import { z } from "zod/v4";

export const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export const usernameSchema = z
  .string()
  .min(2, "Username must be at least 2 characters")
  .max(32, "Username must be 32 characters or less")
  .regex(USERNAME_REGEX, "Only letters, numbers, and underscores");

export function validateUsername(value: string): string | null {
  const result = usernameSchema.safeParse(value);
  return result.success ? null : result.error.issues[0]?.message ?? "Invalid username";
}