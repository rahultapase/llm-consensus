import { defineConfig } from "drizzle-kit";
import { env } from "./lib/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./../../packages/shared/src/schema.ts",
  out: "./supabase/migrations",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
