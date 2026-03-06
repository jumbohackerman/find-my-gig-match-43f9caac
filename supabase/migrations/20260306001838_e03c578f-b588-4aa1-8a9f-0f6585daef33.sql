
-- Add status and source columns to applications
ALTER TABLE public.applications 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'applied',
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'candidate';

-- Create messages table for chat
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages: participants can read
CREATE POLICY "Participants can read messages"
ON public.messages FOR SELECT TO authenticated
USING (
  application_id IN (
    SELECT a.id FROM public.applications a
    WHERE a.candidate_id = auth.uid()
    UNION
    SELECT a.id FROM public.applications a
    JOIN public.jobs j ON a.job_id = j.id
    WHERE j.employer_id = auth.uid()
  )
);

-- Messages: participants can send
CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  application_id IN (
    SELECT a.id FROM public.applications a
    WHERE a.candidate_id = auth.uid()
    UNION
    SELECT a.id FROM public.applications a
    JOIN public.jobs j ON a.job_id = j.id
    WHERE j.employer_id = auth.uid()
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
