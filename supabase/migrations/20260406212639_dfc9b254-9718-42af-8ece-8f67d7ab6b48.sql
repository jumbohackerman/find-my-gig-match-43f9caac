
ALTER TABLE public.candidates DROP CONSTRAINT candidates_availability_check;
ALTER TABLE public.candidates ADD CONSTRAINT candidates_availability_check 
  CHECK (availability = ANY (ARRAY['Immediate'::text, '2 weeks'::text, '1 month'::text, 'Flexible'::text, 'Otwarty na oferty'::text, 'Pasywny'::text, 'Nie szukam'::text]));
