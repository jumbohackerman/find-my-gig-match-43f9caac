ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS company_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS company_website text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS company_location text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS company_industry text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS company_size text NOT NULL DEFAULT '';