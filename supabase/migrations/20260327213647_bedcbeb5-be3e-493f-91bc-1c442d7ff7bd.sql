
-- Job 1: Senior Frontend Developer
UPDATE public.jobs SET
  summary = 'Twórz nowoczesne aplikacje webowe w React i TypeScript w zespole 12 inżynierów.',
  about_role = 'Szukamy doświadczonego frontend developera, który dołączy do naszego zespołu produktowego. Będziesz odpowiedzialny za rozwój naszej platformy SaaS obsługującej ponad 500 tys. użytkowników.',
  responsibilities = ARRAY['Rozwój i utrzymanie aplikacji frontendowej w React/TypeScript','Projektowanie i implementacja komponentów UI w design systemie','Code review i mentoring juniorów','Współpraca z zespołem UX/UI przy tworzeniu prototypów','Optymalizacja wydajności aplikacji (Core Web Vitals)','Pisanie testów jednostkowych i integracyjnych','Udział w planowaniu sprintów i estymacji zadań'],
  requirements = ARRAY['Min. 4 lata doświadczenia z React','Biegła znajomość TypeScript','Doświadczenie z GraphQL i REST API','Znajomość state management (Redux/Zustand)','Doświadczenie z testami (Jest, React Testing Library)','Umiejętność pracy w metodyce Agile/Scrum'],
  nice_to_have = ARRAY['Doświadczenie z Next.js','Znajomość CI/CD (GitHub Actions)','Kontrybucie open source'],
  benefits = ARRAY['Prywatna opieka medyczna Medicover','Karta MultiSport','Budget szkoleniowy 5000 zł/rok','Nowoczesny sprzęt Apple','Elastyczne godziny pracy','Stock options po roku','Brak dress code'],
  about_company = 'TechNova to polski startup SaaS z siedzibą w Krakowie. Budujemy platformę analityczną dla e-commerce. Zespół liczy 45 osób, a nasza platforma obsługuje klientów w 12 krajach.',
  recruitment_steps = ARRAY['Rozmowa wstępna (30 min)','Zadanie techniczne do domu','Rozmowa techniczna z zespołem (90 min)','Spotkanie z CTO','Oferta'],
  offer_highlights = ARRAY['Produkt z 500k+ użytkowników','Zespół 12 inżynierów','Stack: React, TypeScript, GraphQL'],
  team_size = '12 osób',
  seniority = 'Senior',
  contract_type = 'B2B / UoP',
  work_mode = 'Hybrydowo',
  experience_level = 'Senior',
  logo = 'https://logo.clearbit.com/technova.io'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Job 2: Product Designer
UPDATE public.jobs SET
  summary = 'Projektuj intuicyjne interfejsy dla milionów użytkowników w zespole design.',
  about_role = 'Dołącz jako Product Designer do zespołu tworzącego aplikacje z najwyższą dbałością o UX. Będziesz współpracować bezpośrednio z PM-ami i developerami.',
  responsibilities = ARRAY['Projektowanie user flow i wireframe''ów','Tworzenie high-fidelity mockupów w Figma','Prowadzenie badań użytkowników i testów użyteczności','Rozwój i utrzymanie design systemu','Współpraca z developerami przy implementacji','Analiza danych UX i proponowanie usprawnień','Tworzenie prototypów interaktywnych'],
  requirements = ARRAY['Min. 3 lata doświadczenia w product design','Biegła znajomość Figma','Portfolio z przykładami projektów B2B/B2C','Znajomość zasad dostępności (WCAG)','Doświadczenie z design systemami','Umiejętność prowadzenia badań UX'],
  nice_to_have = ARRAY['Znajomość HTML/CSS','Doświadczenie z motion design','Znajomość narzędzi analitycznych (Hotjar, Mixpanel)'],
  benefits = ARRAY['Prywatna opieka medyczna','Karta sportowa','Budget na konferencje design','Najnowszy MacBook Pro','Piątki bez spotkań','Darmowe lunche w biurze','Roczny bonus'],
  about_company = 'PixelCraft Studios to agencja design z Warszawy specjalizująca się w produktach cyfrowych. Pracujemy z globalnymi markami i startupami. Zespół liczy 30 osób.',
  recruitment_steps = ARRAY['Portfolio review','Rozmowa z Head of Design (45 min)','Zadanie projektowe (3 dni)','Prezentacja rozwiązania','Oferta'],
  offer_highlights = ARRAY['Praca z globalnymi markami','Zespół 8 designerów','Portfolio projektów B2C'],
  team_size = '8 osób',
  seniority = 'Mid',
  contract_type = 'UoP',
  work_mode = 'Hybrydowo',
  experience_level = 'Mid',
  logo = 'https://logo.clearbit.com/pixelcraft.com'
WHERE id = '00000000-0000-0000-0000-000000000002';

-- Job 3: Backend Engineer
UPDATE public.jobs SET
  summary = 'Skaluj systemy rozproszone przetwarzające miliardy zdarzeń dziennie.',
  about_role = 'Jako Backend Engineer będziesz projektować i rozwijać mikroserwisy obsługujące ruch na poziomie enterprise. Pracujemy z Go, Kafka i PostgreSQL w architekturze event-driven.',
  responsibilities = ARRAY['Projektowanie i rozwój mikroserwisów w Go','Optymalizacja zapytań PostgreSQL i modelowanie danych','Konfiguracja i zarządzanie pipeline Kafka','Implementacja API (gRPC/REST)','Monitoring i alerting (Prometheus, Grafana)','Udział w on-call rotation','Dokumentacja techniczna i ADR-y'],
  requirements = ARRAY['Min. 3 lata doświadczenia z Go lub podobnym językiem','Doświadczenie z bazami danych SQL (PostgreSQL)','Znajomość systemów kolejkowych (Kafka/RabbitMQ)','Doświadczenie z Dockerem i Kubernetes','Zrozumienie wzorców systemów rozproszonych','Angielski na poziomie B2+'],
  nice_to_have = ARRAY['Doświadczenie z event sourcing','Znajomość Terraform','Certyfikat AWS/GCP'],
  benefits = ARRAY['Prywatna opieka medyczna Luxmed','Karta MultiSport','Remote-first culture','Budget sprzętowy 10 000 zł','Konferencje zagraniczne','25 dni urlopu','Equity w firmie'],
  about_company = 'DataForge to firma technologiczna z Wrocławia budująca infrastrukturę danych dla sektora fintech. Obsługujemy 50+ klientów bankowych w Europie.',
  recruitment_steps = ARRAY['Screening call (20 min)','Zadanie algorytmiczne online','System design interview (60 min)','Culture fit z zespołem','Oferta'],
  offer_highlights = ARRAY['Miliardy zdarzeń dziennie','Remote-first','Stack: Go, Kafka, PostgreSQL'],
  team_size = '15 osób',
  seniority = 'Mid/Senior',
  contract_type = 'B2B',
  work_mode = 'Zdalnie',
  experience_level = 'Mid',
  logo = 'https://logo.clearbit.com/dataforge.com'
WHERE id = '00000000-0000-0000-0000-000000000003';

-- Job 4: Mobile Developer
UPDATE public.jobs SET
  summary = 'Twórz doświadczenia mobilne w React Native dla milionów użytkowników.',
  about_role = 'Szukamy Mobile Developera do zespołu mobilnego. Będziesz rozwijać naszą aplikację dostępną na iOS i Android, używaną przez 2M+ aktywnych użytkowników miesięcznie.',
  responsibilities = ARRAY['Rozwój aplikacji mobilnej w React Native','Implementacja nowych ekranów i funkcji','Integracja z natywnym kodem iOS/Android','Optymalizacja wydajności i rozmiaru aplikacji','Pisanie testów E2E (Detox)','Publikacja w App Store i Google Play','Współpraca z zespołem backendowym'],
  requirements = ARRAY['Min. 2 lata doświadczenia z React Native','Znajomość TypeScript','Doświadczenie z publikacją aplikacji w sklepach','Znajomość natywnych API (iOS lub Android)','Doświadczenie z Redux/MobX','Git flow i code review'],
  nice_to_have = ARRAY['Doświadczenie z Swift lub Kotlin','Znajomość CI/CD mobilnego (Fastlane)','Doświadczenie z animacjami (Reanimated)','Znajomość GraphQL'],
  benefits = ARRAY['Prywatna opieka zdrowotna','Karta Multisport','Sprzęt Apple (MacBook + iPhone)','Elastyczne godziny','Budget edukacyjny 4000 zł/rok','Team building co kwartał'],
  about_company = 'AppVenture to startup mobile-first z Gdańska. Nasza aplikacja lifestyle jest dostępna w 8 krajach z oceną 4.8 w sklepach.',
  recruitment_steps = ARRAY['Rozmowa telefoniczna (20 min)','Live coding (60 min)','Rozmowa z Tech Leadem','Oferta'],
  offer_highlights = ARRAY['2M+ aktywnych użytkowników','Aplikacja w 8 krajach','Ocena 4.8 w sklepach'],
  team_size = '6 osób',
  seniority = 'Mid',
  contract_type = 'B2B / UoP',
  work_mode = 'Hybrydowo',
  experience_level = 'Mid',
  logo = 'https://logo.clearbit.com/appventure.com'
WHERE id = '00000000-0000-0000-0000-000000000004';

-- Job 5: DevOps Engineer
UPDATE public.jobs SET
  summary = 'Projektuj i utrzymuj infrastrukturę chmurową na AWS z 99.99% SLA.',
  about_role = 'Jako DevOps Engineer będziesz odpowiedzialny za całą infrastrukturę chmurową firmy. Automatyzujesz procesy CI/CD i dbasz o bezpieczeństwo oraz skalowalność.',
  responsibilities = ARRAY['Zarządzanie infrastrukturą AWS (ECS, RDS, S3, CloudFront)','Rozwój pipeline CI/CD (GitHub Actions, ArgoCD)','Infrastructure as Code z Terraform','Monitoring i observability (Datadog, PagerDuty)','Zarządzanie Kubernetes clusters','Implementacja polityk bezpieczeństwa','Optymalizacja kosztów cloud','Automatyzacja procesów deploymentu'],
  requirements = ARRAY['Min. 3 lata doświadczenia DevOps/SRE','Biegła znajomość AWS','Doświadczenie z Terraform','Znajomość Docker i Kubernetes','Doświadczenie z CI/CD','Scripting (Bash, Python)','Znajomość sieci i bezpieczeństwa'],
  nice_to_have = ARRAY['Certyfikat AWS Solutions Architect','Doświadczenie z GitOps','Znajomość FinOps'],
  benefits = ARRAY['Prywatna opieka medyczna Enel-Med','Karta MultiSport','100% remote','Budget szkoleniowy 8000 zł/rok','Certyfikaty cloud opłacane przez firmę','30 dni urlopu','Sprzęt do wyboru'],
  about_company = 'CloudPeak to firma SaaS z Poznania dostarczająca rozwiązania cloud-native dla enterprise. Nasz platform obsługuje 200+ firm w Europie.',
  recruitment_steps = ARRAY['Rozmowa wstępna (30 min)','Zadanie praktyczne (infrastruktura)','Rozmowa techniczna (60 min)','Oferta'],
  offer_highlights = ARRAY['100% remote','200+ klientów enterprise','AWS, Terraform, K8s'],
  team_size = '10 osób',
  seniority = 'Senior',
  contract_type = 'B2B',
  work_mode = 'Zdalnie',
  experience_level = 'Senior',
  logo = 'https://logo.clearbit.com/cloudpeak.io'
WHERE id = '00000000-0000-0000-0000-000000000005';

-- Job 6: Data Scientist
UPDATE public.jobs SET
  summary = 'Buduj modele ML napędzające decyzje biznesowe i funkcje produktu.',
  about_role = 'Dołącz do zespołu Data Science pracującego nad modelami predykcyjnymi i systemami rekomendacji. Twoje modele będą bezpośrednio wpływać na produkt i przychody firmy.',
  responsibilities = ARRAY['Budowa i wdrażanie modeli ML/DL','Analiza danych i feature engineering','Tworzenie pipeline danych (Airflow, Spark)','A/B testowanie modeli','Prezentacja wyników stakeholderom','Monitoring modeli w produkcji','Współpraca z zespołem inżynierskim przy MLOps'],
  requirements = ARRAY['Min. 3 lata doświadczenia w Data Science','Biegły Python (pandas, scikit-learn, TensorFlow/PyTorch)','Doświadczenie z SQL i bazami danych','Znajomość statystyki i algebry liniowej','Doświadczenie z wdrażaniem modeli na produkcję','Angielski B2+'],
  nice_to_have = ARRAY['Doświadczenie z NLP','Znajomość Spark/Databricks','Publikacje naukowe lub udział w Kaggle','Doświadczenie z LLM'],
  benefits = ARRAY['Prywatna opieka medyczna Medicover','Karta Multisport','GPU cluster do eksperymentów','Budget konferencyjny 10 000 zł/rok','Elastyczny czas pracy','Praca zdalna 4 dni/tydzień','Roczny bonus 10-20%','Ubezpieczenie na życie'],
  about_company = 'InsightAI to firma AI z Warszawy budująca rozwiązania predykcyjne dla e-commerce i fintech. Nasz zespół R&D liczy 20 osób, a modele obsługują 100M+ predykcji dziennie.',
  recruitment_steps = ARRAY['Screening (20 min)','Zadanie analityczne (take-home)','Prezentacja rozwiązania + rozmowa techniczna (90 min)','Culture fit','Oferta'],
  offer_highlights = ARRAY['100M+ predykcji dziennie','GPU cluster','Python, TensorFlow, Spark'],
  team_size = '20 osób',
  seniority = 'Mid/Senior',
  contract_type = 'UoP / B2B',
  work_mode = 'Hybrydowo',
  experience_level = 'Mid',
  logo = 'https://logo.clearbit.com/insightai.com'
WHERE id = '00000000-0000-0000-0000-000000000006';

-- Job 7: Marketing Manager
UPDATE public.jobs SET
  summary = 'Kieruj strategią growth marketingu w dynamicznym startupie technologicznym.',
  about_role = 'Szukamy Marketing Managera, który przejmie odpowiedzialność za strategię pozyskiwania użytkowników i budowanie marki. Raportowanie bezpośrednio do CEO.',
  responsibilities = ARRAY['Planowanie i realizacja kampanii digitalowych','Zarządzanie budżetem marketingowym','SEO i content marketing','Analiza efektywności kampanii (GA4, Mixpanel)','Zarządzanie social media','Współpraca z zespołem sprzedaży','Organizacja eventów i webinarów'],
  requirements = ARRAY['Min. 3 lata doświadczenia w digital marketingu','Doświadczenie z Google Ads i Meta Ads','Znajomość SEO i content marketingu','Doświadczenie z narzędziami analitycznymi','Umiejętność zarządzania budżetem','Kreatywność i samodzielność'],
  nice_to_have = ARRAY['Doświadczenie w startupie B2B SaaS','Znajomość marketing automation (HubSpot)','Doświadczenie z PR'],
  benefits = ARRAY['Prywatna opieka medyczna','Karta sportowa','Elastyczne godziny pracy','Laptop do wyboru','Budget na kursy i konferencje','Młody, dynamiczny zespół'],
  about_company = 'GrowthLab to warszawski startup martech pomagający firmom automatyzować procesy marketingowe. Obsługujemy 300+ klientów w Polsce i CEE.',
  recruitment_steps = ARRAY['Rozmowa z HR (30 min)','Case study do przygotowania','Prezentacja + rozmowa z CEO (60 min)','Oferta'],
  offer_highlights = ARRAY['Raport do CEO','300+ klientów','Growth stage startup'],
  team_size = '5 osób',
  seniority = 'Mid',
  contract_type = 'UoP',
  work_mode = 'Hybrydowo',
  experience_level = 'Mid',
  logo = 'https://logo.clearbit.com/growthlab.io'
WHERE id = '00000000-0000-0000-0000-000000000007';

-- Job 8: Full Stack Developer
UPDATE public.jobs SET
  summary = 'Pełna odpowiedzialność end-to-end w startupie budującym narzędzia PM.',
  about_role = 'Dołącz jako Full Stack Developer do małego, zgranego zespołu. Będziesz wpływać na architekturę i kierunek technologiczny produktu od pierwszego dnia.',
  responsibilities = ARRAY['Rozwój frontendu w Next.js/React','Rozwój backendu w Node.js','Projektowanie i zarządzanie bazą danych MongoDB','Integracja z zewnętrznymi API','Deployment i utrzymanie na Vercel/AWS','Code review i pair programming','Udział w discovery i planowaniu produktu','Automatyzacja testów'],
  requirements = ARRAY['Min. 2 lata doświadczenia full stack','Znajomość React/Next.js','Doświadczenie z Node.js i Express','Znajomość MongoDB lub PostgreSQL','Git i podstawy DevOps','Komunikatywny angielski'],
  nice_to_have = ARRAY['Doświadczenie z WebSockets/real-time','Znajomość Docker','Doświadczenie w startupie','Znajomość Tailwind CSS'],
  benefits = ARRAY['Equity w startupie','Prywatna opieka medyczna','100% remote','Elastyczne godziny','Budget sprzętowy','Team retreat 2x w roku','Brak micromanagementu'],
  about_company = 'BuildBetter to wczesny startup z Krakowa budujący nową generację narzędzi do zarządzania projektami. Zespół 8 osób, seed funding, ambitna wizja.',
  recruitment_steps = ARRAY['Rozmowa z CTO (30 min)','Pair programming session (90 min)','Spotkanie z zespołem','Oferta'],
  offer_highlights = ARRAY['Equity w startupie','Wpływ na architekturę','Mały zespół, duży impact'],
  team_size = '8 osób',
  seniority = 'Mid',
  contract_type = 'B2B',
  work_mode = 'Zdalnie',
  experience_level = 'Mid',
  logo = 'https://logo.clearbit.com/buildbetter.app'
WHERE id = '00000000-0000-0000-0000-000000000008';
