
-- Only add the policies that don't already exist

-- Employers can read CVs of candidates who applied to their jobs
-- (this one is new — the candidate self-access policies already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Employers can read applicant CVs'
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Employers can read applicant CVs"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (
          bucket_id = 'cvs'
          AND (storage.foldername(name))[1] IN (
            SELECT a.candidate_id::text
            FROM public.applications a
            JOIN public.jobs j ON a.job_id = j.id
            WHERE j.employer_id = auth.uid()
          )
        )
    $policy$;
  END IF;
END $$;

-- Employers can read profiles of candidates who applied to their jobs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Employers can read applicant profiles'
    AND tablename = 'profiles'
    AND schemaname = 'public'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Employers can read applicant profiles"
        ON public.profiles FOR SELECT
        TO authenticated
        USING (
          user_id IN (
            SELECT a.candidate_id
            FROM public.applications a
            JOIN public.jobs j ON a.job_id = j.id
            WHERE j.employer_id = auth.uid()
          )
        )
    $policy$;
  END IF;
END $$;
