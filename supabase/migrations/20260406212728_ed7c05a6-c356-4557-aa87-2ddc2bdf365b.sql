
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'candidate'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'candidate') = 'candidate' THEN
    INSERT INTO public.candidates (user_id, title, location, bio, full_name)
    VALUES (NEW.id, '', '', '', COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  END IF;

  RETURN NEW;
END;
$$;
