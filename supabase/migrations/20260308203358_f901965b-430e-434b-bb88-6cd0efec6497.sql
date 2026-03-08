
INSERT INTO public.profiles (user_id, role, full_name)
VALUES ('09f96b5d-ef13-420d-981a-0c4df3d5f843', 'candidate', '')
ON CONFLICT DO NOTHING;

INSERT INTO public.candidates (user_id, title, location, bio)
VALUES ('09f96b5d-ef13-420d-981a-0c4df3d5f843', '', '', '')
ON CONFLICT DO NOTHING;
