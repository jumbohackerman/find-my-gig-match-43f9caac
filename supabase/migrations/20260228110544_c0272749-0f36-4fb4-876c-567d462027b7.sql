
-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('candidate', 'employer')),
  full_name TEXT NOT NULL DEFAULT '',
  avatar TEXT DEFAULT '👤',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Candidates table
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  experience TEXT NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT NOT NULL DEFAULT 'Flexible' CHECK (availability IN ('Immediate', '2 weeks', '1 month', 'Flexible')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  logo TEXT NOT NULL DEFAULT '🏢',
  location TEXT NOT NULL,
  salary TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'Full-time' CHECK (type IN ('Full-time', 'Part-time', 'Contract', 'Remote')),
  description TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, job_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Helper functions (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Candidates policies
CREATE POLICY "Candidates can manage own profile"
  ON public.candidates FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Employers can view candidates who applied"
  ON public.candidates FOR SELECT
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'employer'
    AND user_id IN (
      SELECT a.candidate_id FROM public.applications a
      JOIN public.jobs j ON a.job_id = j.id
      WHERE j.employer_id = auth.uid()
    )
  );

-- Jobs policies
CREATE POLICY "Anyone authenticated can view active jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (status = 'active' OR employer_id = auth.uid());

CREATE POLICY "Employers can insert jobs"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    employer_id = auth.uid()
    AND public.get_user_role(auth.uid()) = 'employer'
  );

CREATE POLICY "Employers can update own jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (employer_id = auth.uid());

CREATE POLICY "Employers can delete own jobs"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (employer_id = auth.uid());

-- Applications policies
CREATE POLICY "Candidates can apply to jobs"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (
    candidate_id = auth.uid()
    AND public.get_user_role(auth.uid()) = 'candidate'
  );

CREATE POLICY "Candidates can view own applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (candidate_id = auth.uid());

CREATE POLICY "Employers can view applications to their jobs"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    job_id IN (SELECT id FROM public.jobs WHERE employer_id = auth.uid())
  );

CREATE POLICY "Candidates can withdraw applications"
  ON public.applications FOR DELETE
  TO authenticated
  USING (candidate_id = auth.uid());

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
