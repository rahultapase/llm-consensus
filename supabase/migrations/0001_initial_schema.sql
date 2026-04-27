-- ===== profiles =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== conversations =====
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Conversation',
  council_models text[] NOT NULL DEFAULT '{}',
  chairman_model text,
  is_temporary boolean NOT NULL DEFAULT false,
  preset text NOT NULL DEFAULT 'fast',
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT preset_check CHECK (preset IN ('fast', 'reasoning', 'free'))
);

-- ===== messages =====
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  stage text,
  model_id text,
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT role_check CHECK (role IN ('user', 'assistant', 'system')),
  CONSTRAINT stage_check CHECK (stage IS NULL OR stage IN ('council', 'ranking', 'synthesis'))
);

-- ===== indexes =====
CREATE INDEX idx_conversations_user_active
  ON public.conversations (user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_messages_conversation
  ON public.messages (conversation_id, created_at ASC);
