
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT '';
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS languages jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS primary_industry text NOT NULL DEFAULT '';
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS profile_completeness integer NOT NULL DEFAULT 0;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS salary_currency text NOT NULL DEFAULT 'PLN';

ALTER TABLE public.candidates ALTER COLUMN skills DROP DEFAULT;
ALTER TABLE public.candidates ALTER COLUMN skills TYPE jsonb USING 
  CASE 
    WHEN skills IS NULL THEN '{"advanced":[],"intermediate":[],"beginner":[]}'::jsonb
    WHEN array_length(skills, 1) IS NULL THEN '{"advanced":[],"intermediate":[],"beginner":[]}'::jsonb
    ELSE jsonb_build_object('advanced', to_jsonb(skills), 'intermediate', '[]'::jsonb, 'beginner', '[]'::jsonb)
  END;
ALTER TABLE public.candidates ALTER COLUMN skills SET DEFAULT '{"advanced":[],"intermediate":[],"beginner":[]}'::jsonb;
