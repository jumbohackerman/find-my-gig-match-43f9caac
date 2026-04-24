-- Block 7: Job closure constraint
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_closure_reason_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_closure_reason_check
  CHECK (closure_reason IS NULL OR closure_reason IN ('hired_via_jobswipe', 'hired_other_channel', 'no_hire'));

-- Allow status transitions to 'closed' for jobs (already allowed via existing UPDATE policy on employer)
-- Add index for fast lookup of pending invitations per candidate
CREATE INDEX IF NOT EXISTS idx_contact_invitations_candidate_status ON public.contact_invitations(candidate_id, status);
CREATE INDEX IF NOT EXISTS idx_contact_invitations_employer_job ON public.contact_invitations(employer_id, job_id);