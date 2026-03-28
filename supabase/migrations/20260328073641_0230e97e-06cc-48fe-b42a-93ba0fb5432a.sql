
-- Add error_message column to cv_uploads
ALTER TABLE public.cv_uploads ADD COLUMN IF NOT EXISTS error_message text;

-- Allow users to update their own cv_uploads (for status changes)
CREATE POLICY "Users can update own cv_uploads"
ON public.cv_uploads
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create cv_parsed_data table
CREATE TABLE public.cv_parsed_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_upload_id uuid NOT NULL REFERENCES public.cv_uploads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  raw_text text,
  parsed_json jsonb,
  parse_confidence real,
  model_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cv_upload_id)
);

ALTER TABLE public.cv_parsed_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cv_parsed_data"
ON public.cv_parsed_data FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own cv_parsed_data"
ON public.cv_parsed_data FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cv_parsed_data"
ON public.cv_parsed_data FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
