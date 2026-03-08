
-- ============================================================
-- Table: notifications
-- In-app notifications for candidates and employers.
-- ============================================================

CREATE TYPE public.notification_type AS ENUM (
  'status_change',
  'new_message',
  'shortlisted',
  'interview_scheduled',
  'hired'
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type public.notification_type NOT NULL,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  reference_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id) WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- INSERT is system-only (edge functions / triggers with service role).
-- No user INSERT policy needed — notifications are created server-side.
-- TODO: If user-created notifications are ever needed, add INSERT policy.

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());

-- Enable realtime for live notification updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- Table: user_preferences
-- Key-value store for per-user settings.
-- ============================================================

CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  key text NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  UNIQUE (user_id, key)
);

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences (user_id);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own preferences"
  ON public.user_preferences FOR DELETE
  USING (user_id = auth.uid());
