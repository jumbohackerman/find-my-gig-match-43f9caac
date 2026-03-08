
-- ============================================================
-- Table: saved_jobs
-- Tracks jobs a candidate has bookmarked for later review.
-- ============================================================

CREATE TABLE public.saved_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Each user can save a job only once
  UNIQUE (user_id, job_id)
);

-- Index for fast lookup by user
CREATE INDEX idx_saved_jobs_user_id ON public.saved_jobs (user_id);

-- RLS
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved jobs"
  ON public.saved_jobs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can save jobs"
  ON public.saved_jobs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unsave jobs"
  ON public.saved_jobs FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- Table: swipe_events
-- Records every swipe action (left/right/save) for feed state.
-- ============================================================

-- Direction enum
CREATE TYPE public.swipe_direction AS ENUM ('left', 'right', 'save');

CREATE TABLE public.swipe_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  direction public.swipe_direction NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Each user can swipe a job only once
  UNIQUE (user_id, job_id)
);

-- Index for fast feed exclusion queries
CREATE INDEX idx_swipe_events_user_id ON public.swipe_events (user_id);

-- RLS
ALTER TABLE public.swipe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own swipe events"
  ON public.swipe_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can record swipe events"
  ON public.swipe_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can clear own swipe events"
  ON public.swipe_events FOR DELETE
  USING (user_id = auth.uid());
