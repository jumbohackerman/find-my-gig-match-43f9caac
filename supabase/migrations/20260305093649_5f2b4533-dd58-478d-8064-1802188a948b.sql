
-- Drop the restrictive policies on candidates
DROP POLICY IF EXISTS "Candidates can manage own profile" ON public.candidates;
DROP POLICY IF EXISTS "Employers can view candidates who applied" ON public.candidates;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Candidates can manage own profile"
ON public.candidates
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Employers can view candidates who applied"
ON public.candidates
FOR SELECT
TO authenticated
USING (
  (get_user_role(auth.uid()) = 'employer') AND
  (user_id IN (
    SELECT a.candidate_id
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE j.employer_id = auth.uid()
  ))
);
