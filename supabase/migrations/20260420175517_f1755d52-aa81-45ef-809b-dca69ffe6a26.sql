-- 1. Drop the public (anon) SELECT policy on jobs.
-- App requires login, so anonymous browsing of jobs should not be allowed.
DROP POLICY IF EXISTS "Anyone can view active jobs" ON public.jobs;

-- 2. Notification trigger on application status change.
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _job_title text;
  _company text;
  _notif_type notification_type;
  _title text;
  _body text;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT j.title, j.company INTO _job_title, _company
  FROM jobs j WHERE j.id = NEW.job_id;

  -- Map status -> notification type + copy (Polish)
  IF NEW.status = 'shortlisted' THEN
    _notif_type := 'shortlisted';
    _title := 'Jesteś na shortliście';
    _body  := COALESCE(_company, 'Pracodawca') || ' dodał Cię do shortlisty na stanowisko ' || COALESCE(_job_title, '');
  ELSIF NEW.status = 'interview' THEN
    _notif_type := 'interview_scheduled';
    _title := 'Zaproszenie na rozmowę';
    _body  := COALESCE(_company, 'Pracodawca') || ' zaprasza Cię na rozmowę: ' || COALESCE(_job_title, '');
  ELSIF NEW.status = 'hired' THEN
    _notif_type := 'hired';
    _title := 'Gratulacje — oferta pracy';
    _body  := COALESCE(_company, 'Pracodawca') || ' wybrał Cię na stanowisko ' || COALESCE(_job_title, '');
  ELSE
    _notif_type := 'status_change';
    _title := 'Aktualizacja aplikacji';
    _body  := 'Status Twojej aplikacji na ' || COALESCE(_job_title, '') || ' zmienił się na: ' || NEW.status;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, reference_id)
  VALUES (NEW.candidate_id, _notif_type, _title, _body, NEW.id::text);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_application_status_change ON public.applications;
CREATE TRIGGER trg_notify_application_status_change
AFTER UPDATE OF status ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_application_status_change();