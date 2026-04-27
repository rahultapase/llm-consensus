import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, protectedReadProcedure } from "../init";
import { adminSupabase } from "@/lib/db";

interface ConversationRow {
  id: string;
  user_id: string;
  title: string;
  council_models: string[];
  chairman_model: string | null;
  is_temporary: boolean;
  preset: "fast" | "reasoning";
  is_starred: boolean | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  stage: string | null;
  model_id: string | null;
  content: string | null;
  metadata: unknown;
  created_at: string;
}

export const conversationRouter = router({
  list: protectedReadProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data: items, error } = await adminSupabase
        .from("conversations")
        .select("id, user_id, title, council_models, chairman_model, is_temporary, preset, is_starred, deleted_at, created_at, updated_at")
        .eq("user_id", ctx.user.id)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(input.limit + 1);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      // Map snake_case DB columns to camelCase for frontend compatibility
      const mapped = (items ?? []).map(mapConversation);

      let nextCursor: string | undefined;
      if (mapped.length > input.limit) {
        const next = mapped.pop()!;
        nextCursor = next.id;
      }

      return { items: mapped, nextCursor };
    }),

  byId: protectedReadProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: conversation, error: convError } = await adminSupabase
        .from("conversations")
        .select("id, user_id, title, council_models, chairman_model, is_temporary, preset, is_starred, deleted_at, created_at, updated_at")
        .eq("id", input.id)
        .eq("user_id", ctx.user.id)
        .is("deleted_at", null)
        .single();

      if (convError || !conversation) {
        return null;
      }

      const { data: msgs, error: msgsError } = await adminSupabase
        .from("messages")
        .select("id, conversation_id, role, stage, model_id, content, metadata, created_at")
        .eq("conversation_id", input.id)
        .order("created_at", { ascending: true });

      if (msgsError) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msgsError.message });
      }

      const mappedMsgs = (msgs ?? []).map(mapMessage);

      return { ...mapConversation(conversation), messages: mappedMsgs };
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().optional(),
        councilModels: z.array(z.string()).optional(),
        chairmanModel: z.string().optional(),
        preset: z.enum(["fast", "reasoning"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data: conversation, error } = await adminSupabase
        .from("conversations")
        .insert({
          user_id: ctx.user.id,
          title: input.title ?? "New Conversation",
          council_models: input.councilModels ?? [],
          chairman_model: input.chairmanModel ?? null,
          preset: input.preset ?? "fast",
        })
        .select()
        .single();

      if (error || !conversation) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error?.message ?? "Failed to create conversation" });
      }

      return mapConversation(conversation);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await adminSupabase
        .from("conversations")
        .delete()
        .eq("id", input.id)
        .eq("user_id", ctx.user.id);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { id: input.id };
    }),

  updateTitle: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data: updated, error } = await adminSupabase
        .from("conversations")
        .update({ title: input.title, updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .eq("user_id", ctx.user.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return updated ? mapConversation(updated) : null;
    }),

  toggleStar: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        isStarred: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await adminSupabase
        .from("conversations")
        .update({ is_starred: input.isStarred, updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .eq("user_id", ctx.user.id);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      return { id: input.id, isStarred: input.isStarred };
    }),
});

// Map snake_case DB row to camelCase for frontend
function mapConversation(row: ConversationRow) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    councilModels: row.council_models,
    chairmanModel: row.chairman_model,
    isTemporary: row.is_temporary,
    preset: row.preset,
    isStarred: row.is_starred ?? false,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: MessageRow) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    stage: row.stage,
    modelId: row.model_id,
    content: row.content,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}
