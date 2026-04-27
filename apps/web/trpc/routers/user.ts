import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, protectedReadProcedure } from "../init";
import { adminSupabase } from "@/lib/db";
import { usernameSchema } from "@/lib/auth/username";

export const userRouter = router({
  profile: protectedReadProcedure.query(async ({ ctx }) => {
    const { data: profile, error } = await adminSupabase
      .from("profiles")
      .select("id, username, avatar_url, created_at, updated_at")
      .eq("id", ctx.user.id)
      .single();

    if (error || !profile) {
      return null;
    }

    return {
      id: profile.id,
      username: profile.username,
      email: ctx.user.email ?? null,
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        username: z.string().min(1).max(50).optional(),
        avatarUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (input.username !== undefined) updateData.username = input.username;
      if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;

      const { data: updated, error } = await adminSupabase
        .from("profiles")
        .update(updateData)
        .eq("id", ctx.user.id)
        .select("id, username, avatar_url, created_at, updated_at")
        .single();

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      if (!updated) return null;

      return {
        id: updated.id,
        username: updated.username,
        avatarUrl: updated.avatar_url,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      };
    }),

  setUsername: protectedProcedure
    .input(usernameSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await adminSupabase
        .from("profiles")
        .update({ username: input, updated_at: new Date().toISOString() })
        .eq("id", ctx.user.id)
        .select("username")
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { username: data?.username ?? input };
    }),
});
