
-- Allow employers to update application status for their jobs
CREATE POLICY "Employers can update application status"
ON public.applications
FOR UPDATE
TO authenticated
USING (job_id IN (SELECT id FROM jobs WHERE employer_id = auth.uid()))
WITH CHECK (job_id IN (SELECT id FROM jobs WHERE employer_id = auth.uid()));
