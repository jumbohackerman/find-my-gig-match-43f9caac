-- 1. shortlists table (one per job)
CREATE TABLE public.shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL UNIQUE,
  employer_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','completed','failed')),
  ai_model_used text,
  total_candidates_analyzed integer,
  error_message text,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers see own shortlists" ON public.shortlists
  FOR SELECT TO authenticated USING (employer_id = auth.uid());

CREATE POLICY "Employers insert own shortlists" ON public.shortlists
  FOR INSERT TO authenticated
  WITH CHECK (employer_id = auth.uid() AND get_user_role(auth.uid()) = 'employer');

-- Candidates can see shortlists where they appear in snapshots (read-only)
CREATE POLICY "Candidates see shortlists they're in" ON public.shortlists
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.ai_shortlist_snapshots s
      WHERE s.ai_shortlist_id = shortlists.id AND s.candidate_id = auth.uid()
    )
  );

-- 2. Add shortlist_id to ai_shortlist_snapshots (link to new shortlists table)
ALTER TABLE public.ai_shortlist_snapshots
  ADD COLUMN IF NOT EXISTS shortlist_id uuid;

CREATE INDEX IF NOT EXISTS idx_ai_shortlist_snapshots_shortlist_id
  ON public.ai_shortlist_snapshots(shortlist_id);

-- Allow snapshot inserts via service role (edge function); also let employers see snapshots of their own shortlists
CREATE POLICY "Employers see snapshots via shortlist_id" ON public.ai_shortlist_snapshots
  FOR SELECT TO authenticated USING (
    shortlist_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.shortlists s
      WHERE s.id = ai_shortlist_snapshots.shortlist_id AND s.employer_id = auth.uid()
    )
  );

-- 3. Relax application UPDATE policy: employers may set status to 'shortlisted' or 'rejected' (for AI shortlist flow)
DROP POLICY IF EXISTS "Employers can update application status (no direct shortlist)" ON public.applications;

CREATE POLICY "Employers update application status"
  ON public.applications FOR UPDATE TO authenticated
  USING (job_id IN (SELECT id FROM public.jobs WHERE employer_id = auth.uid()))
  WITH CHECK (job_id IN (SELECT id FROM public.jobs WHERE employer_id = auth.uid()));

-- 4. Index for fast count of applications per job
CREATE INDEX IF NOT EXISTS idx_applications_job_status ON public.applications(job_id, status);
