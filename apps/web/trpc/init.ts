import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { rateLimit } from "@/lib/ratelimit";
import { createClient } from "@/lib/supabase/server";

export async function createTRPCContext(_opts: FetchCreateContextFnOptions) {
  void _opts;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabase, rateLimit };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const createCallerFactory = t.createCallerFactory;
export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedReadProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const result = await ctx.rateLimit.read(ctx.user.id);
  void result.pending.catch(() => {});

  if (!result.success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many read requests. Please wait a minute and try again.",
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});
