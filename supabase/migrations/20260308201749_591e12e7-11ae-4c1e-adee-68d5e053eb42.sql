
-- Fix: allow any authenticated user to apply (candidate_id = auth.uid() is sufficient guard)
DROP POLICY IF EXISTS "Candidates can apply to jobs" ON public.applications;
CREATE POLICY "Candidates can apply to jobs"
  ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (candidate_id = auth.uid());
