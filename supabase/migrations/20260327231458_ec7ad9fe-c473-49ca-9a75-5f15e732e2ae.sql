-- Create candidate-cvs bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-cvs', 'candidate-cvs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for candidate-cvs bucket
CREATE POLICY "Users can upload own CVs to candidate-cvs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'candidate-cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own CVs in candidate-cvs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'candidate-cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own CVs from candidate-cvs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'candidate-cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create cv_uploads table
CREATE TABLE public.cv_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cv_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own cv_uploads"
ON public.cv_uploads FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own cv_uploads"
ON public.cv_uploads FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own cv_uploads"
ON public.cv_uploads FOR DELETE
TO authenticated
USING (user_id = auth.uid());