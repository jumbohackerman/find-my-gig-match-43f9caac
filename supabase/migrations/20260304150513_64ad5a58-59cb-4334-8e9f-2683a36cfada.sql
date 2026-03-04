
-- Add new profile fields to candidates table
ALTER TABLE public.candidates 
  ADD COLUMN IF NOT EXISTS seniority text NOT NULL DEFAULT 'Mid',
  ADD COLUMN IF NOT EXISTS summary text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS work_mode text NOT NULL DEFAULT 'Remote',
  ADD COLUMN IF NOT EXISTS employment_type text NOT NULL DEFAULT 'Full-time',
  ADD COLUMN IF NOT EXISTS salary_min integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS salary_max integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS experience_entries jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS links jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cv_url text,
  ADD COLUMN IF NOT EXISTS last_active timestamp with time zone NOT NULL DEFAULT now();

-- Create storage bucket for CVs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cvs', 'cvs', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- RLS for CV storage: candidates can upload/read their own CVs
CREATE POLICY "Candidates can upload CVs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cvs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Candidates can read own CVs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'cvs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Candidates can delete own CVs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cvs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Employers can read CVs of candidates who applied to their jobs
CREATE POLICY "Employers can read applicant CVs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'cvs' AND
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON a.job_id = j.id
    WHERE j.employer_id = auth.uid()
    AND a.candidate_id::text = (storage.foldername(name))[1]
  )
);
