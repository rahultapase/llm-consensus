-- Add is_starred column to conversations table
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_starred boolean NOT NULL DEFAULT false;

-- Index for efficient starred + recent queries per user
CREATE INDEX IF NOT EXISTS idx_conversations_user_starred
  ON public.conversations (user_id, is_starred, updated_at DESC)
  WHERE deleted_at IS NULL;
