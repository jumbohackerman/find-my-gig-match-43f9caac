
-- ============================================================================
-- Block 3: Candidate consents, AI shortlists, contact invitations
-- ============================================================================

-- 1) Candidate consents (RODO / AI processing)
CREATE TABLE IF NOT EXISTS public.candidate_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL UNIQUE,
  ai_processing_consent boolean NOT NULL DEFAULT false,
  consented_at timestamptz,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view own consent"
  ON public.candidate_consents FOR SELECT
  TO authenticated
  USING (candidate_id = auth.uid());

CREATE POLICY "Candidates can insert own consent"
  ON public.candidate_consents FOR INSERT
  TO authenticated
  WITH CHECK (candidate_id = auth.uid());

CREATE POLICY "Candidates can update own consent"
  ON public.candidate_consents FOR UPDATE
  TO authenticated
  USING (candidate_id = auth.uid())
  WITH CHECK (candidate_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_candidate_consents_candidate
  ON public.candidate_consents(candidate_id);

CREATE TRIGGER trg_candidate_consents_updated_at
  BEFORE UPDATE ON public.candidate_consents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) AI shortlists (separate from paid shortlist_packages flow)
CREATE TABLE IF NOT EXISTS public.ai_shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL UNIQUE,
  employer_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  triggered_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  total_candidates_analyzed integer,
  ai_model_used text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers see own AI shortlists"
  ON public.ai_shortlists FOR SELECT
  TO authenticated
  USING (employer_id = auth.uid());

CREATE POLICY "Employers insert own AI shortlists"
  ON public.ai_shortlists FOR INSERT
  TO authenticated
  WITH CHECK (
    employer_id = auth.uid()
    AND public.get_user_role(auth.uid()) = 'employer'
  );

-- Edge function (service role) updates status; no UPDATE policy for clients.

CREATE INDEX IF NOT EXISTS idx_ai_shortlists_job ON public.ai_shortlists(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_shortlists_employer ON public.ai_shortlists(employer_id);

-- 3) AI shortlist snapshots (frozen top 5 per AI shortlist)
CREATE TABLE IF NOT EXISTS public.ai_shortlist_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_shortlist_id uuid NOT NULL REFERENCES public.ai_shortlists(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL,
  job_id uuid NOT NULL,
  rank integer NOT NULL CHECK (rank BETWEEN 1 AND 5),
  shortlist_score numeric(5,2) NOT NULL,
  ai_justification text NOT NULL,

  snapshot_full_name text,
  snapshot_job_title text,
  snapshot_location text,
  snapshot_summary text,
  snapshot_skills jsonb,
  snapshot_experience jsonb,
  snapshot_education jsonb,
  snapshot_languages jsonb,
  snapshot_salary_min integer,
  snapshot_salary_max integer,
  snapshot_level text,
  snapshot_links jsonb,

  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_shortlist_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers see own AI snapshots"
  ON public.ai_shortlist_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_shortlists s
      WHERE s.id = ai_shortlist_id AND s.employer_id = auth.uid()
    )
  );

CREATE POLICY "Candidates see own AI snapshots"
  ON public.ai_shortlist_snapshots FOR SELECT
  TO authenticated
  USING (candidate_id = auth.uid());

-- Inserts go through service role (edge function); no client INSERT policy.

CREATE INDEX IF NOT EXISTS idx_ai_snapshots_shortlist
  ON public.ai_shortlist_snapshots(ai_shortlist_id);
CREATE INDEX IF NOT EXISTS idx_ai_snapshots_candidate
  ON public.ai_shortlist_snapshots(candidate_id);
CREATE INDEX IF NOT EXISTS idx_ai_snapshots_job
  ON public.ai_shortlist_snapshots(job_id);

-- 4) Contact invitations
CREATE TABLE IF NOT EXISTS public.contact_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_shortlist_snapshot_id uuid NOT NULL
    REFERENCES public.ai_shortlist_snapshots(id) ON DELETE CASCADE,
  job_id uuid NOT NULL,
  employer_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  employer_message text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers see own invitations"
  ON public.contact_invitations FOR SELECT
  TO authenticated
  USING (employer_id = auth.uid());

CREATE POLICY "Candidates see own invitations"
  ON public.contact_invitations FOR SELECT
  TO authenticated
  USING (candidate_id = auth.uid());

CREATE POLICY "Employers insert invitations"
  ON public.contact_invitations FOR INSERT
  TO authenticated
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Candidates update invitation status"
  ON public.contact_invitations FOR UPDATE
  TO authenticated
  USING (candidate_id = auth.uid())
  WITH CHECK (candidate_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_contact_inv_employer ON public.contact_invitations(employer_id);
CREATE INDEX IF NOT EXISTS idx_contact_inv_candidate ON public.contact_invitations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_contact_inv_job ON public.contact_invitations(job_id);

-- 5) Job closure fields
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS closure_reason text
    CHECK (closure_reason IS NULL OR closure_reason IN ('hired_via_jobswipe', 'hired_other_channel', 'no_hire')),
  ADD COLUMN IF NOT EXISTS ai_shortlist_id uuid REFERENCES public.ai_shortlists(id);
