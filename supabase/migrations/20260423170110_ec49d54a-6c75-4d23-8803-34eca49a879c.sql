
-- ════════════════════════════════════════════════════════════════════
-- 1. RESET istniejących shortlist do applied (czysty start dla billing)
-- ════════════════════════════════════════════════════════════════════
UPDATE public.applications SET status = 'applied' WHERE status = 'shortlisted';

-- ════════════════════════════════════════════════════════════════════
-- 2. NOWE POLA NA KANDYDACIE pod matching
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE public.candidates 
  ADD COLUMN IF NOT EXISTS relocation_openness boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS normalized_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS years_of_experience integer NOT NULL DEFAULT 0;

-- ════════════════════════════════════════════════════════════════════
-- 3. SHORTLIST PACKAGES (pakiety slotów)
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.shortlist_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL,
  job_id uuid NOT NULL,
  package_size integer NOT NULL CHECK (package_size IN (5, 10, 20)),
  slots_total integer NOT NULL,
  slots_used integer NOT NULL DEFAULT 0,
  price_amount integer NOT NULL,        -- snapshot in PLN grosze
  price_currency text NOT NULL DEFAULT 'PLN',
  status text NOT NULL DEFAULT 'active', -- active | exhausted | refunded
  purchased_at timestamptz NOT NULL DEFAULT now(),
  exhausted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_shortlist_packages_employer ON public.shortlist_packages(employer_id);
CREATE INDEX IF NOT EXISTS idx_shortlist_packages_job ON public.shortlist_packages(job_id);
CREATE INDEX IF NOT EXISTS idx_shortlist_packages_active ON public.shortlist_packages(job_id, status) WHERE status = 'active';

ALTER TABLE public.shortlist_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employer reads own packages"
  ON public.shortlist_packages FOR SELECT TO authenticated
  USING (employer_id = auth.uid());

CREATE POLICY "Employer inserts own packages"
  ON public.shortlist_packages FOR INSERT TO authenticated
  WITH CHECK (employer_id = auth.uid() AND get_user_role(auth.uid()) = 'employer');

CREATE POLICY "Employer updates own packages"
  ON public.shortlist_packages FOR UPDATE TO authenticated
  USING (employer_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════
-- 4. SHORTLIST EVENTS (niezmienialny audit/billing log)
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.shortlist_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,             -- shortlisted_paid | package_purchased
  employer_id uuid NOT NULL,
  job_id uuid NOT NULL,
  application_id uuid,
  candidate_id uuid,
  package_id uuid REFERENCES public.shortlist_packages(id) ON DELETE SET NULL,
  package_size integer,
  slots_before integer,
  slots_after integer,
  price_amount integer,
  price_currency text DEFAULT 'PLN',
  actor_id uuid NOT NULL,
  idempotency_key text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shortlist_events_idempotency 
  ON public.shortlist_events(employer_id, application_id, event_type) 
  WHERE event_type = 'shortlisted_paid' AND application_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shortlist_events_employer ON public.shortlist_events(employer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shortlist_events_candidate ON public.shortlist_events(candidate_id);
CREATE INDEX IF NOT EXISTS idx_shortlist_events_job ON public.shortlist_events(job_id);

ALTER TABLE public.shortlist_events ENABLE ROW LEVEL SECURITY;

-- Niezmienialny: brak UPDATE/DELETE policy
CREATE POLICY "Employer reads own events"
  ON public.shortlist_events FOR SELECT TO authenticated
  USING (employer_id = auth.uid());

CREATE POLICY "Candidate reads own shortlisted events"
  ON public.shortlist_events FOR SELECT TO authenticated
  USING (candidate_id = auth.uid() AND event_type = 'shortlisted_paid');

-- INSERT tylko przez SECURITY DEFINER funkcję (brak policy = blokada bezpośrednich insertów)

-- ════════════════════════════════════════════════════════════════════
-- 5. SHORTLIST SNAPSHOTS (pełny JSONB profilu w momencie shortlistowania)
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.shortlist_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortlist_event_id uuid NOT NULL REFERENCES public.shortlist_events(id) ON DELETE CASCADE,
  employer_id uuid NOT NULL,
  job_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  application_id uuid NOT NULL,
  candidate_snapshot jsonb NOT NULL,    -- pełny stan candidates row + profile
  job_snapshot jsonb NOT NULL,          -- pełny stan jobs row
  match_score integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shortlist_snapshots_employer ON public.shortlist_snapshots(employer_id);
CREATE INDEX IF NOT EXISTS idx_shortlist_snapshots_application ON public.shortlist_snapshots(application_id);

ALTER TABLE public.shortlist_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employer reads own snapshots"
  ON public.shortlist_snapshots FOR SELECT TO authenticated
  USING (employer_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════
-- 6. CANDIDATE NOTES (notatki wewnętrzne rekrutera)
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.candidate_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL,
  application_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  job_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_candidate_notes_app ON public.candidate_notes(application_id);
CREATE INDEX IF NOT EXISTS idx_candidate_notes_employer ON public.candidate_notes(employer_id);

ALTER TABLE public.candidate_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employer manages own notes"
  ON public.candidate_notes FOR ALL TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════
-- 7. ACTIVITY LOG (prosty log aktywności pracodawcy na kandydacie)
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.candidate_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL,
  application_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  job_id uuid NOT NULL,
  action text NOT NULL,                 -- viewed | shortlisted | status_changed | note_added | message_sent
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_app ON public.candidate_activity_log(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_employer ON public.candidate_activity_log(employer_id);

ALTER TABLE public.candidate_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employer reads own activity log"
  ON public.candidate_activity_log FOR SELECT TO authenticated
  USING (employer_id = auth.uid());

CREATE POLICY "Employer inserts own activity log"
  ON public.candidate_activity_log FOR INSERT TO authenticated
  WITH CHECK (employer_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════
-- 8. HELPER: czy kandydat jest shortlistowany dla danego pracodawcy/oferty
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.is_candidate_shortlisted(_employer_id uuid, _application_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM shortlist_events se
    WHERE se.employer_id = _employer_id 
      AND se.application_id = _application_id
      AND se.event_type = 'shortlisted_paid'
  );
$$;

-- ════════════════════════════════════════════════════════════════════
-- 9. HELPER: ile pozostałych slotów dla oferty
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_remaining_slots(_job_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(slots_total - slots_used), 0)::integer
  FROM shortlist_packages
  WHERE job_id = _job_id AND status = 'active';
$$;

-- ════════════════════════════════════════════════════════════════════
-- 10. PURCHASE PACKAGE (mock billing, zapisuje event)
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.purchase_shortlist_package(_job_id uuid, _package_size integer)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _employer_id uuid := auth.uid();
  _package_id uuid;
  _price_amount integer;
BEGIN
  IF _employer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM jobs WHERE id = _job_id AND employer_id = _employer_id) THEN
    RAISE EXCEPTION 'Not authorized for this job';
  END IF;

  IF _package_size NOT IN (5, 10, 20) THEN
    RAISE EXCEPTION 'Invalid package size: %', _package_size;
  END IF;

  -- Mock pricing in PLN grosze: 5=29900, 10=49900, 20=89900
  _price_amount := CASE _package_size
    WHEN 5 THEN 29900
    WHEN 10 THEN 49900
    WHEN 20 THEN 89900
  END;

  INSERT INTO shortlist_packages (employer_id, job_id, package_size, slots_total, slots_used, price_amount, status)
  VALUES (_employer_id, _job_id, _package_size, _package_size, 0, _price_amount, 'active')
  RETURNING id INTO _package_id;

  INSERT INTO shortlist_events (event_type, employer_id, job_id, package_id, package_size, price_amount, actor_id, metadata)
  VALUES ('package_purchased', _employer_id, _job_id, _package_id, _package_size, _price_amount, _employer_id, 
          jsonb_build_object('source', 'mock_billing'));

  RETURN _package_id;
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- 11. SHORTLIST CANDIDATE (atomowo: zużywa slot + snapshot + status + audit)
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.shortlist_candidate(_application_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _employer_id uuid := auth.uid();
  _job_id uuid;
  _candidate_id uuid;
  _package_id uuid;
  _slots_before integer;
  _slots_after integer;
  _package_size integer;
  _price_amount integer;
  _event_id uuid;
  _existing_event_id uuid;
  _candidate_snapshot jsonb;
  _job_snapshot jsonb;
BEGIN
  IF _employer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Pobierz aplikację i sprawdź własność
  SELECT a.job_id, a.candidate_id INTO _job_id, _candidate_id
  FROM applications a
  JOIN jobs j ON j.id = a.job_id
  WHERE a.id = _application_id AND j.employer_id = _employer_id;

  IF _job_id IS NULL THEN
    RAISE EXCEPTION 'Application not found or not authorized';
  END IF;

  -- IDEMPOTENCY: jeśli już shortlistowano, zwróć istniejący event (bez naliczania)
  SELECT id INTO _existing_event_id
  FROM shortlist_events
  WHERE employer_id = _employer_id 
    AND application_id = _application_id 
    AND event_type = 'shortlisted_paid'
  LIMIT 1;

  IF _existing_event_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'event_id', _existing_event_id,
      'status', 'already_shortlisted',
      'slot_consumed', false
    );
  END IF;

  -- Znajdź aktywny pakiet z wolnymi slotami (FOR UPDATE blokuje race condition)
  SELECT id, package_size, price_amount, slots_used 
    INTO _package_id, _package_size, _price_amount, _slots_before
  FROM shortlist_packages
  WHERE job_id = _job_id AND status = 'active' AND slots_used < slots_total
  ORDER BY purchased_at ASC
  LIMIT 1
  FOR UPDATE;

  IF _package_id IS NULL THEN
    RAISE EXCEPTION 'NO_SLOTS_AVAILABLE: brak wolnych slotów dla oferty %', _job_id;
  END IF;

  -- Zużyj slot
  _slots_after := _slots_before + 1;
  UPDATE shortlist_packages 
    SET slots_used = _slots_after,
        status = CASE WHEN _slots_after >= slots_total THEN 'exhausted' ELSE status END,
        exhausted_at = CASE WHEN _slots_after >= slots_total THEN now() ELSE exhausted_at END
  WHERE id = _package_id;

  -- Zmień status aplikacji
  UPDATE applications SET status = 'shortlisted' WHERE id = _application_id;

  -- Snapshot kandydata (pełny rekord candidates + profile)
  SELECT jsonb_build_object(
    'candidate', to_jsonb(c.*),
    'profile', to_jsonb(p.*)
  ) INTO _candidate_snapshot
  FROM candidates c
  LEFT JOIN profiles p ON p.user_id = c.user_id
  WHERE c.user_id = _candidate_id;

  -- Snapshot oferty
  SELECT to_jsonb(j.*) INTO _job_snapshot FROM jobs j WHERE j.id = _job_id;

  -- Zapisz event (idempotency unique index zabezpiecza przed duplikatem)
  INSERT INTO shortlist_events (
    event_type, employer_id, job_id, application_id, candidate_id, package_id,
    package_size, slots_before, slots_after, price_amount, actor_id, metadata
  ) VALUES (
    'shortlisted_paid', _employer_id, _job_id, _application_id, _candidate_id, _package_id,
    _package_size, _slots_before, _slots_after, _price_amount, _employer_id,
    jsonb_build_object('action', 'shortlist_candidate')
  ) RETURNING id INTO _event_id;

  -- Snapshot
  INSERT INTO shortlist_snapshots (
    shortlist_event_id, employer_id, job_id, candidate_id, application_id, candidate_snapshot, job_snapshot
  ) VALUES (
    _event_id, _employer_id, _job_id, _candidate_id, _application_id, _candidate_snapshot, _job_snapshot
  );

  -- Activity log
  INSERT INTO candidate_activity_log (employer_id, application_id, candidate_id, job_id, action, metadata)
  VALUES (_employer_id, _application_id, _candidate_id, _job_id, 'shortlisted',
          jsonb_build_object('event_id', _event_id, 'slots_after', _slots_after));

  -- Notyfikacja dla kandydata (trigger notify_application_status_change już to robi przy UPDATE statusu)

  RETURN jsonb_build_object(
    'event_id', _event_id,
    'status', 'shortlisted',
    'slot_consumed', true,
    'slots_after', _slots_after,
    'package_size', _package_size
  );
END;
$$;

-- ════════════════════════════════════════════════════════════════════
-- 12. NOTIFY APPLICATION STATUS CHANGE (utwórz trigger jeśli nie istnieje)
-- ════════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trg_notify_application_status_change ON public.applications;
CREATE TRIGGER trg_notify_application_status_change
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_application_status_change();

-- ════════════════════════════════════════════════════════════════════
-- 13. UPDATED_AT TRIGGERS
-- ════════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trg_candidate_notes_updated_at ON public.candidate_notes;
CREATE TRIGGER trg_candidate_notes_updated_at
  BEFORE UPDATE ON public.candidate_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ════════════════════════════════════════════════════════════════════
-- 14. ANTI-BYPASS CHAT TRIGGER + GATING SHORTLISTĄ
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.validate_message_send()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _employer_id uuid;
  _candidate_id uuid;
  _is_shortlisted boolean;
  _content text := NEW.content;
  _bypass_pattern text;
  _bypass_match text;
BEGIN
  -- Pobierz strony konwersacji
  SELECT j.employer_id, a.candidate_id INTO _employer_id, _candidate_id
  FROM applications a JOIN jobs j ON j.id = a.job_id
  WHERE a.id = NEW.application_id;

  IF _employer_id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  -- GATING: chat tylko po shortliście
  SELECT EXISTS (
    SELECT 1 FROM shortlist_events se
    WHERE se.employer_id = _employer_id
      AND se.application_id = NEW.application_id
      AND se.event_type = 'shortlisted_paid'
  ) INTO _is_shortlisted;

  IF NOT _is_shortlisted THEN
    RAISE EXCEPTION 'CHAT_LOCKED: czat odblokowuje się po dodaniu kandydata do shortlisty';
  END IF;

  -- ANTI-BYPASS: wykryj próby obejścia
  -- Telefon: 9+ cyfr z opcjonalnymi spacjami/myślnikami/+
  IF _content ~* '(\+?\d[\s\-]?){8,}\d' THEN
    RAISE EXCEPTION 'BYPASS_BLOCKED: numery telefonu nie są dozwolone w czacie. Komunikuj się przez aplikację.';
  END IF;

  -- Email
  IF _content ~* '[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}' THEN
    RAISE EXCEPTION 'BYPASS_BLOCKED: adresy email nie są dozwolone w czacie. Komunikuj się przez aplikację.';
  END IF;

  -- URL i znane platformy (case-insensitive)
  IF _content ~* '(https?://|www\.|\.com|\.pl|\.io|\.dev|linkedin|github|calendly|whatsapp|telegram|signal|wa\.me|t\.me|tg://)' THEN
    RAISE EXCEPTION 'BYPASS_BLOCKED: linki i odnośniki do innych platform są zablokowane. Korzystaj z czatu w aplikacji.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_message_send ON public.messages;
CREATE TRIGGER trg_validate_message_send
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_message_send();

-- ════════════════════════════════════════════════════════════════════
-- 15. ZAOSTRZ RLS APPLICATIONS UPDATE: nie pozwól employerom samodzielnie zmieniać status na 'shortlisted'
-- ════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Employers can update application status" ON public.applications;
CREATE POLICY "Employers can update application status (no direct shortlist)"
  ON public.applications FOR UPDATE TO authenticated
  USING (job_id IN (SELECT id FROM jobs WHERE employer_id = auth.uid()))
  WITH CHECK (
    job_id IN (SELECT id FROM jobs WHERE employer_id = auth.uid())
    -- Status 'shortlisted' można ustawić TYLKO przez funkcję shortlist_candidate (SECURITY DEFINER omija RLS)
    AND status <> 'shortlisted'
  );

-- ════════════════════════════════════════════════════════════════════
-- 16. PROFILE COMPLETENESS HELPER (przelicza po stronie DB)
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.compute_profile_completeness(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _c candidates%ROWTYPE;
  _score integer := 0;
BEGIN
  SELECT * INTO _c FROM candidates WHERE user_id = _user_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF length(_c.full_name) > 1 THEN _score := _score + 10; END IF;
  IF length(_c.title) > 1 THEN _score := _score + 10; END IF;
  IF length(_c.location) > 1 THEN _score := _score + 8; END IF;
  IF length(_c.summary) > 20 THEN _score := _score + 10; END IF;
  IF length(_c.seniority) > 0 AND _c.seniority <> 'Mid' THEN _score := _score + 6; END IF;
  IF _c.years_of_experience > 0 THEN _score := _score + 8; END IF;
  IF length(_c.work_mode) > 0 THEN _score := _score + 4; END IF;
  IF length(_c.availability) > 0 AND _c.availability <> 'Flexible' THEN _score := _score + 4; END IF;
  IF _c.salary_min > 0 OR _c.salary_max > 0 THEN _score := _score + 8; END IF;
  IF jsonb_array_length(COALESCE(_c.skills->'advanced','[]'::jsonb)) > 0 
     OR jsonb_array_length(COALESCE(_c.skills->'intermediate','[]'::jsonb)) > 0 THEN _score := _score + 12; END IF;
  IF jsonb_array_length(COALESCE(_c.experience_entries,'[]'::jsonb)) > 0 THEN _score := _score + 12; END IF;
  IF jsonb_array_length(COALESCE(_c.languages,'[]'::jsonb)) > 0 THEN _score := _score + 4; END IF;
  IF length(_c.primary_industry) > 0 THEN _score := _score + 4; END IF;

  RETURN LEAST(_score, 100);
END;
$$;
