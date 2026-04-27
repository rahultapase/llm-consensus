import {
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/ratelimit";
import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/db";
import type { CouncilSSEEvent, CouncilUIMessage } from "@/lib/streaming/types";

const FASTAPI_URL = env.FASTAPI_INTERNAL_URL;

function getCouncilServiceErrorMessage(status: number) {
  if (status === 429) {
    return "Council service is rate limited right now. Please wait a minute and try again.";
  }

  if (status === 400) {
    return "Council request could not be processed. Please revise the prompt and try again.";
  }

  if (status === 401 || status === 403) {
    return "Council authorization expired. Please sign in again and retry.";
  }

  if (status >= 500) {
    return "Council service is temporarily unavailable. Please try again shortly.";
  }

  return `Council service returned an unexpected response (${status}).`;
}

export async function POST(req: Request) {
  // ── Auth: verify user identity with Supabase, then read token for proxying ──
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!user || !session?.access_token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const councilLimit = await rateLimit.council(user.id);
  void councilLimit.pending.catch(() => {});

  if (!councilLimit.success) {
    return new Response(
      "Too many council requests. Please wait a minute and try again.",
      { status: 429 }
    );
  }

  // ── Parse request body (AI SDK useChat format) ───────────────────
  const body = await req.json();

  // useChat sends { messages: [...], ...extra }
  // Extract user message content from the last message
  const lastMessage = body.messages?.[body.messages.length - 1];
  const content =
    lastMessage?.parts?.find(
      (p: { type: string; text?: string }) => p.type === "text"
    )?.text ??
    lastMessage?.content ??
    "";

  if (!content) {
    return new Response("Missing message content", { status: 400 });
  }

  // ── Build FastAPI request ────────────────────────────────────────
  const fastapiBody = {
    content,
    preset: body.preset,
    council_models: body.council_models,
    chairman_model: body.chairman_model,
    conversation_id: body.conversation_id,
    council_mode: body.council_mode,
  };

  const conversationId = body.conversation_id as string | undefined;

  // ── Create AI SDK UIMessageStream that bridges FastAPI SSE ───────
  const stream = createUIMessageStream<CouncilUIMessage>({
    execute: async ({ writer }) => {
      const abortController = new AbortController();
      // Captured for DB persistence after stream completes or on cancellation
      let capturedStage1: { model: string; response: string }[] | null = null;
      let capturedStage2: { rankings: { model: string; ranking: string; parsed_ranking: string[] }[]; metadata: { label_to_model: Record<string, string>; aggregate_rankings: { model: string; average_rank: number; rankings_count: number }[] } } | null = null;
      let capturedStage3: { model: string; response: string } | null = null;
      // Set to true when client aborts the request (Stop button)
      let wasCancelled = false;

      // Propagate client disconnect to FastAPI fetch
      req.signal.addEventListener("abort", () => abortController.abort());

      let fastapiResponse: Response;
      try {
        fastapiResponse = await fetch(`${FASTAPI_URL}/api/council/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(fastapiBody),
          signal: abortController.signal,
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        writer.write({
          type: "data-error",
          data: {
            message: "Unable to reach the council service right now. Please try again.",
          },
        });
        return;
      }

      if (!fastapiResponse.ok) {
        writer.write({
          type: "data-error",
          data: {
            message: getCouncilServiceErrorMessage(fastapiResponse.status),
          },
        });
        return;
      }

      if (!fastapiResponse.body) {
        writer.write({
          type: "data-error",
          data: {
            message: "Council service returned an empty response. Please try again.",
          },
        });
        return;
      }

      // ── Read FastAPI SSE stream and translate to AI SDK data parts ─
      const reader = fastapiResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by double newline
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed.startsWith("data: ")) continue;

            let event: CouncilSSEEvent;
            try {
              event = JSON.parse(trimmed.slice(6)) as CouncilSSEEvent;
            } catch {
              continue; // Skip malformed events
            }

            // Translate each FastAPI event into an AI SDK data part
            switch (event.type) {
              case "stage1_start":
                writer.write({ type: "data-stage1_start", data: {} });
                break;

              case "stage1_complete":
                capturedStage1 = event.data as { model: string; response: string }[];
                writer.write({
                  type: "data-stage1_complete",
                  data: event.data,
                });
                break;

              case "stage2_start":
                writer.write({ type: "data-stage2_start", data: {} });
                break;

              case "stage2_complete":
                capturedStage2 = { rankings: event.data as { model: string; ranking: string; parsed_ranking: string[] }[], metadata: event.metadata as { label_to_model: Record<string, string>; aggregate_rankings: { model: string; average_rank: number; rankings_count: number }[] } };
                writer.write({
                  type: "data-stage2_complete",
                  data: {
                    rankings: event.data,
                    metadata: event.metadata,
                  },
                });
                break;

              case "stage3_start":
                writer.write({ type: "data-stage3_start", data: {} });
                break;

              case "stage3_complete":
                capturedStage3 = event.data as { model: string; response: string };
                writer.write({
                  type: "data-stage3_complete",
                  data: event.data,
                });
                // Also emit the synthesis as text so useChat has message content
                writer.write({ type: "text-start", id: "synthesis" });
                writer.write({
                  type: "text-delta",
                  id: "synthesis",
                  delta: event.data.response,
                });
                writer.write({ type: "text-end", id: "synthesis" });
                break;

              case "title_complete":
                writer.write({
                  type: "data-title_complete",
                  data: event.data,
                });
                break;

              case "complete":
                writer.write({ type: "data-complete", data: {} });
                break;

              case "cancelled":
                writer.write({ type: "data-cancelled", data: {} });
                break;

              case "error":
                writer.write({
                  type: "data-error",
                  data: { message: event.message },
                });
                break;
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          writer.write({
            type: "data-error",
            data: { message: "Stream interrupted" },
          });
          return; // Don't persist on unexpected errors
        }
        // Client aborted the request (Stop button) — fall through to persist
        wasCancelled = true;
      }

      // ── Persist messages to Supabase (on completion OR partial cancellation) ──
      // Persist any stages that fully completed before the stream ended.
      // Rule: DB state mirrors exactly what was shown on screen at cancel time.
      if (conversationId && capturedStage1) {
        const rows: object[] = [
          {
            conversation_id: conversationId,
            role: "user",
            content,
          },
        ];

        rows.push({
          conversation_id: conversationId,
          role: "assistant",
          stage: "council",
          content: "",
          metadata: { responses: capturedStage1 },
        });

        if (capturedStage2) {
          rows.push({
            conversation_id: conversationId,
            role: "assistant",
            stage: "ranking",
            content: "",
            metadata: {
              rankings: capturedStage2.rankings,
              label_to_model: capturedStage2.metadata.label_to_model,
              aggregate_rankings: capturedStage2.metadata.aggregate_rankings,
            },
          });
        }

        if (capturedStage3) {
          rows.push({
            conversation_id: conversationId,
            role: "assistant",
            stage: "synthesis",
            content: capturedStage3.response,
            metadata: capturedStage3,
          });
        }

        await adminSupabase.from("messages").insert(rows);
        // Only notify the client if the stream wasn't cancelled
        // (on cancel the client connection is already gone).
        if (!wasCancelled) {
          writer.write({ type: "data-persisted", data: {} });
        }
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
