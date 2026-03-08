
-- Drop the foreign key constraint on jobs.employer_id so we can insert seed jobs
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_employer_id_fkey;

-- Now replace the function to use auth.uid() as employer_id for seeded jobs
CREATE OR REPLACE FUNCTION public.apply_to_job(
  _static_job_id text,
  _job_title text,
  _job_company text,
  _job_location text,
  _job_logo text,
  _job_salary text,
  _job_tags text[],
  _job_type text,
  _job_description text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _job_uuid uuid;
  _app_id uuid;
BEGIN
  _job_uuid := ('00000000-0000-0000-0000-' || lpad(_static_job_id, 12, '0'))::uuid;

  -- Use a system UUID for seeded jobs employer_id (not referencing auth.users anymore)
  INSERT INTO jobs (id, title, company, location, logo, salary, tags, type, description, employer_id, status)
  VALUES (_job_uuid, _job_title, _job_company, _job_location, _job_logo, _job_salary, _job_tags, _job_type, _job_description, '00000000-0000-0000-0000-000000000000'::uuid, 'active')
  ON CONFLICT (id) DO NOTHING;

  -- Check if already applied
  SELECT id INTO _app_id FROM applications WHERE candidate_id = auth.uid() AND job_id = _job_uuid;
  IF _app_id IS NOT NULL THEN
    RETURN _app_id;
  END IF;

  INSERT INTO applications (candidate_id, job_id, source, status)
  VALUES (auth.uid(), _job_uuid, 'candidate', 'applied')
  RETURNING id INTO _app_id;

  RETURN _app_id;
END;
$$;
