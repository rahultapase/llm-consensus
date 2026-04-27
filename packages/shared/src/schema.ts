import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ===== profiles =====

// RLS enabled via SQL migration (0002_rls_policies.sql), not Drizzle schema.
// Drizzle v0.45 doesn't support pgTable.withRLS — upgrade to v1.0.0-beta.1+ when stable.

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    // References auth.users(id) — managed via migration SQL, not Drizzle FK
    username: text("username"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  }
);

// ===== conversations =====

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("New Conversation"),
    councilModels: text("council_models").array().notNull().default(sql`'{}'`),
    chairmanModel: text("chairman_model"),
    isTemporary: boolean("is_temporary").notNull().default(false),
    preset: text("preset").notNull().default("fast"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("preset_check", sql`${table.preset} IN ('fast', 'reasoning', 'free')`),
    index("idx_conversations_user_active")
      .on(table.userId, table.createdAt)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
);

// ===== messages =====

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    stage: text("stage"),
    modelId: text("model_id"),
    content: text("content").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("role_check", sql`${table.role} IN ('user', 'assistant', 'system')`),
    check(
      "stage_check",
      sql`${table.stage} IS NULL OR ${table.stage} IN ('council', 'ranking', 'synthesis')`
    ),
    index("idx_messages_conversation").on(table.conversationId, table.createdAt),
  ]
);
