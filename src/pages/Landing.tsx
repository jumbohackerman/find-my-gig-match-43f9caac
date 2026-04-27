import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Briefcase,
  MapPin,
  Lock,
  Zap,
  Building2,
  FileText,
  Layers,
  MessageCircle,
  PlusSquare,
  UserCheck,
  Lightbulb,
  Check,
  X,
  Wifi,
  GraduationCap,
  Users,
  Wallet,
  Target,
  ListChecks,
  Gift,
  Workflow,
  Star,
  User,
  Shield,
  Clock,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/jobswipe-logo.png";
import founderJedrzej from "@/assets/founder-jedrzej.png";
import SwipeDemoStack from "@/components/SwipeDemoStack";
import PublicHeader from "@/components/PublicHeader";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

type View = "candidate" | "employer";

type PainStat = { value: string; title: string; desc: string };
type CompareRow = { category: string; old: string; neu: string };
type StepCard = { icon: typeof FileText; title: string; body: string };
type FaqItem = { q: string; a: string };

/* ================= DATA ================= */

const painCandidate: PainStat[] = [
  { value: "80%", title: "kandydatów", desc: "nigdy nie dostaje żadnej odpowiedzi po aplikacji" },
  { value: "250+", title: "aplikacji", desc: "wpływa na przeciętne ogłoszenie o pracę" },
  { value: "42 dni", title: "średni czas", desc: "oczekiwania kandydata na jakikolwiek feedback" },
  { value: "75%", title: "odrzuconych", desc: "nie dostaje żadnego feedbacku co poprawić" },
];

const painEmployer: PainStat[] = [
  { value: "800+", title: "CV rocznie", desc: "przegląda ręcznie przeciętny rekruter przy kilku rekrutacjach" },
  { value: "23 dni", title: "średni czas", desc: "potrzebny na wstępną selekcję kandydatów do shortlisty" },
  { value: "58%", title: "pracodawców", desc: "przyznaje, że traci najlepszych kandydatów przez zbyt wolny proces" },
  { value: "4 200 zł", title: "koszt", desc: "jednej nieudanej rekrutacji dla firmy (IPiSS)" },
];

const compareCandidate: CompareRow[] = [
  {
    category: "Aplikowanie",
    old: "Wysyłasz PDF i mozolnie wypełniasz formularze",
    neu: "Aplikujesz profilem (swipe). JobSwipe samo uzupełni Twoje dane na podstawie CV",
  },
  {
    category: "Ekosystem",
    old: "Ciągłe przekierowania na zewnętrzne strony i obce systemy firmowe",
    neu: "Wszystko u nas. Cały proces — od swipe'a po kontakt — dzieje się w jednej aplikacji",
  },
  {
    category: "Informacja zwrotna",
    old: "„Odezwiemy się do wybranych” (rekrutacyjny ghosting)",
    neu: "Gwarantowany feedback. Zawsze wiesz, na czym stoisz. Otrzymujesz wskazówki co poprawić",
  },
  {
    category: "Widoczność",
    old: "Aplikujesz na oślep, nie wiesz czy pasujesz",
    neu: "Widzisz Scoring dopasowania zanim aplikujesz — decydujesz świadomie",
  },
  {
    category: "Narzędzia",
    old: "Płatne szablony CV na innych portalach",
    neu: "Darmowe, profesjonalne CV. Pobierasz gotowy PDF bezpośrednio z profilu",
  },
];

const compareEmployer: CompareRow[] = [
  {
    category: "Selekcja",
    old: "Tracisz godziny na ręczne czytanie 150 chaotycznych życiorysów",
    neu: "JobSwipe analizuje profile wszystkich i podaje na tacy Top 5 z rankingiem i uzasadnieniem",
  },
  {
    category: "Czas",
    old: "Tygodnie wstępnej selekcji zanim dojdziesz do rozmów",
    neu: "Shortlista gotowa w minuty — od razu przechodzisz do kontaktu",
  },
  {
    category: "Feedback",
    old: "Musisz ręcznie odpisywać kandydatom lub milczeć",
    neu: "JobSwipe automatycznie wysyła merytoryczny feedback odrzuconym",
  },
  {
    category: "Obiektywność",
    old: "Subiektywna ocena zależy od nastroju rekrutera",
    neu: "Każdy kandydat oceniany według tych samych kryteriów zawodowych",
  },
  {
    category: "Dane",
    old: "Bałagan formatów — Word, PDF, Europass, różne układy",
    neu: "Ustrukturyzowane profile — czyste, porównywalne dane od razu",
  },
];

const candidateSteps: StepCard[] = [
  {
    icon: FileText,
    title: "Zbuduj profil w sekundę",
    body: "Wrzuć swoje stare CV raz — JobSwipe natychmiast wyciągnie z niego dane i stworzy strukturalny profil. Jako bonus: w każdej chwili pobierzesz z niego darmowe CV w formacie PDF.",
  },
  {
    icon: Layers,
    title: "Swipuj i aplikuj jednym kliknięciem",
    body: "Od razu widzisz nasz Scoring — procentowe dopasowanie Twojego profilu do oferty. Pasuje? Swipuj w prawo i aplikacja wysłana. Zero formularzy, zero załączników.",
  },
  {
    icon: MessageCircle,
    title: "Zawsze dostaniesz odpowiedź",
    body: "Kończymy z ghostingiem. Jeśli nie trafisz na Shortlistę, JobSwipe wygeneruje dla Ciebie automatyczny, merytoryczny feedback wskazujący konkretne obszary do poprawy.",
  },
];

const employerSteps: StepCard[] = [
  {
    icon: PlusSquare,
    title: "Zbierz aplikacje bez czytania PDF-ów",
    body: "Opublikuj ogłoszenie i patrz jak spływają uporządkowane profile kandydatów. Zamiast chaosu formatów, masz czyste dane gotowe do analizy.",
  },
  {
    icon: Zap,
    title: "Uruchom Shortlistę (płacisz za wynik)",
    body: "JobSwipe analizuje twarde kompetencje wszystkich chętnych i przygotowuje uargumentowaną listę Top 5. Oszczędzasz godziny ręcznej selekcji.",
  },
  {
    icon: UserCheck,
    title: "Kontaktujesz tylko najlepszych",
    body: "Widzisz Top 5 z wynikami i uzasadnieniem JobSwipe. Decydujesz, do kogo piszesz. Reszta kandydatów automatycznie dostaje feedback — bez Twojego zaangażowania.",
  },
];

const faqCandidate: FaqItem[] = [
  {
    q: "Czy to naprawdę darmowe dla kandydata?",
    a: "Tak. Założenie profilu, aplikowanie i pobranie profesjonalnego CV w PDF jest w 100% darmowe dla kandydatów.",
  },
  {
    q: "Skąd będę wiedzieć, dlaczego mnie odrzucono?",
    a: "JobSwipe automatycznie wysyła do odrzuconych kandydatów merytoryczny feedback z listą konkretnych obszarów, nad którymi warto popracować przed kolejną aplikacją. Zawsze dostajesz odpowiedź.",
  },
  {
    q: "Czy pracodawca widzi moje CV jako PDF?",
    a: "Nie. Pracodawca widzi Twój profil w ustrukturyzowanej formie — nie oryginalny plik CV. PDF generowany przez JobSwipe to reprezentacja Twojego profilu, nie przesłany przez Ciebie dokument.",
  },
  {
    q: "Co to jest Scoring dopasowania?",
    a: "Scoring to procentowy wskaźnik pokazujący, jak dobrze Twój profil pasuje do wymagań danej oferty. Widzisz go zanim aplikujesz — możesz świadomie zdecydować, czy oferta jest warta Twojej aplikacji.",
  },
];

const faqEmployer: FaqItem[] = [
  {
    q: "Kiedy mogę uruchomić Shortlistę?",
    a: "Shortlista odblokowuje się, gdy zbierzesz minimum 10 aplikacji na dane stanowisko. JobSwipe dba o jakość wyboru — przy mniejszej liczbie kandydatów wynik nie byłby miarodajny.",
  },
  {
    q: "Ile kosztuje znalezienie pracownika przez JobSwipe?",
    a: "Opublikowanie oferty i zbieranie kandydatów jest całkowicie darmowe. Płacisz tylko wtedy, gdy zdecydujesz się wygenerować Shortlistę Top 5. Zero ryzyka, płacisz za wynik.",
  },
  {
    q: "Czy widzę pełne profile kandydatów przed Shortlistą?",
    a: "Przed uruchomieniem Shortlisty widzisz tylko kluczowe dane zawodowe: stanowisko, lata doświadczenia i oczekiwania finansowe. Pełen profil i dane kontaktowe odblokowują się po Shortliście dla wybranych kandydatów.",
  },
  {
    q: "Czy muszę samodzielnie informować odrzuconych kandydatów?",
    a: "Nie. JobSwipe automatycznie wysyła merytoryczny feedback do każdego kandydata który nie trafił na Shortlistę. Ty nie musisz nic robić — system obsługuje całą komunikację.",
  },
];

/* ================= COMPONENTS ================= */

const CTA_PRIMARY =
  "px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-500 text-white font-medium inline-flex items-center justify-center gap-2 transition-shadow duration-200 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]";
const CTA_GHOST =
  "px-6 py-3 rounded-xl border border-border bg-transparent text-foreground font-medium hover:bg-secondary/50 transition-colors inline-flex items-center justify-center gap-2";
const GLASS_CARD =
  "bg-secondary/50 border border-border backdrop-blur-sm rounded-2xl";

function PainBar({ stats, conclusion }: { stats: PainStat[]; conclusion: string }) {
  return (
    <motion.section {...fadeUp} className="px-6 py-14 bg-muted/40 border-y border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-white/10">
          {stats.map((s, i) => (
            <div key={i} className="text-center px-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-3">
                Problem
              </div>
              <div className="text-5xl sm:text-6xl font-black text-orange-500 mb-3 leading-none">
                {s.value}
              </div>
              <div className="text-sm text-foreground font-bold">{s.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
            </div>
          ))}
        </div>
        <p className="text-center mt-10 text-base sm:text-lg font-semibold text-orange-500">
          {conclusion}
        </p>
      </div>
    </motion.section>
  );
}

function CompareTable({
  rows,
  title,
  subtitle,
}: {
  rows: CompareRow[];
  title: string;
  subtitle: string;
}) {
  return (
    <motion.section {...fadeUp} className="px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3 text-center">{title}</h2>
        <p className="text-muted-foreground text-center mb-12">{subtitle}</p>

        <div className={`${GLASS_CARD} overflow-hidden shadow-xl`}>
          {/* Header */}
          <div className="hidden md:grid grid-cols-[140px_1fr_auto_1fr] gap-4 px-6 py-4 border-b border-border bg-muted/30">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Kategoria</div>
            <div className="text-sm font-bold text-muted-foreground inline-flex items-center gap-2">
              <X className="w-4 h-4" /> Tradycyjna rekrutacja
            </div>
            <div className="w-6" />
            <div className="text-sm font-bold text-orange-500 inline-flex items-center gap-2">
              <Check className="w-4 h-4" /> JobSwipe
            </div>
          </div>

          {rows.map((row, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-1 md:grid-cols-[140px_1fr_auto_1fr] gap-3 md:gap-4 px-6 py-5 items-start hover:bg-orange-500/5 transition-colors ${
                idx !== rows.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider text-foreground md:pt-0.5">
                {row.category}
              </div>
              <div className="flex items-start gap-2 text-muted-foreground text-sm sm:text-[15px] leading-relaxed">
                <X className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/70" />
                <span>{row.old}</span>
              </div>
              <ArrowRight className="hidden md:block w-4 h-4 text-muted-foreground/50 mt-1" />
              <div className="flex items-start gap-2 text-foreground text-sm sm:text-[15px] leading-relaxed md:pl-2 md:border-l-2 md:border-orange-500/40">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-orange-500" />
                <span>{row.neu}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function StepsRow({ steps }: { steps: StepCard[] }) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={i} className={`${GLASS_CARD} p-6 relative`}>
            <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-sm">
              {i + 1}
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-foreground">{s.title}</h3>
            <p className="text-sm text-foreground/70 leading-relaxed">{s.body}</p>
          </div>
        );
      })}
    </div>
  );
}

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="max-w-3xl mx-auto">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="border-b border-border">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-foreground font-medium text-base">{it.q}</span>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <p className="text-muted-foreground text-sm pb-5 pr-8 leading-relaxed">{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function SocialProof({ a, b }: { a: React.ReactNode; b: React.ReactNode }) {
  return (
    <motion.section {...fadeUp} className="px-6 py-14 bg-muted/40 border-y border-border">
      <div className="max-w-4xl mx-auto text-center space-y-3">
        <p className="text-lg sm:text-2xl text-foreground">{a}</p>
        <p className="text-lg sm:text-2xl text-foreground">{b}</p>
      </div>
    </motion.section>
  );
}

function FinalCtaPair({
  heading,
  primary,
  secondary,
  onSwitch,
}: {
  heading: string;
  primary: { icon: typeof User; title: string; body: string; cta: string; to: string };
  secondary: { icon: typeof User; title: string; body: string; cta: string; switchTo: View };
  onSwitch: (v: View) => void;
}) {
  const PIcon = primary.icon;
  const SIcon = secondary.icon;
  return (
    <motion.section {...fadeUp} className="px-6 py-20 bg-muted/50 border-t border-border">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-12 text-foreground">
          {heading}
        </h2>

        <div className="grid md:grid-cols-2 gap-6 relative">
          <div className={`${GLASS_CARD} p-8 text-left ring-1 ring-orange-500/30`}>
            <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center mb-4">
              <PIcon className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl mb-2 text-foreground">{primary.title}</h3>
            <p className="text-sm text-foreground/70 mb-6">{primary.body}</p>
            <Link to={primary.to} className={`${CTA_PRIMARY} w-full`}>
              {primary.cta} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-secondary border border-border items-center justify-center text-xs text-muted-foreground font-medium z-10">
            lub
          </div>

          <div className={`${GLASS_CARD} p-8 text-left`}>
            <div className="w-12 h-12 rounded-full bg-secondary text-foreground flex items-center justify-center mb-4">
              <SIcon className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl mb-2 text-foreground">{secondary.title}</h3>
            <p className="text-sm text-foreground/70 mb-6">{secondary.body}</p>
            <button
              type="button"
              onClick={() => onSwitch(secondary.switchTo)}
              className={`${CTA_GHOST} w-full`}
            >
              {secondary.cta}
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ================= PAGE ================= */

const Landing = () => {
  const [view, setView] = useState<View>("candidate");
  const [exampleExpanded, setExampleExpanded] = useState(false);
  const [heroStep, setHeroStep] = useState(0);
  const [counts, setCounts] = useState<{ candidates: number; employers: number }>({
    candidates: 0,
    employers: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, e] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "candidate"),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "employer"),
        ]);
        if (!cancelled) {
          setCounts({ candidates: c.count ?? 0, employers: e.count ?? 0 });
        }
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-rotate employer hero mockup steps
  useEffect(() => {
    if (view === "candidate") return;
    setHeroStep(0);
    const timer = setInterval(() => {
      setHeroStep((s) => (s + 1) % 3);
    }, 3500);
    return () => clearInterval(timer);
  }, [view]);

  const candidatesLabel = counts.candidates > 0 ? counts.candidates.toLocaleString("pl-PL") : null;
  const employersLabel = counts.employers > 0 ? counts.employers.toLocaleString("pl-PL") : null;

  const switchView = (v: View) => {
    setView(v);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isCandidate = view === "candidate";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Top bar with toggle ── */}
      <header className="px-4 sm:px-6 py-4 border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center gap-3 sm:gap-6">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src={logo} alt="" className="w-9 h-9" />
            <span className="font-display text-xl font-bold hidden sm:inline">
              Job<span className="text-gradient-primary">Swipe</span>
            </span>
          </Link>

          {/* Toggle pills */}
          <div className="flex-1 flex justify-center">
            <div
              role="tablist"
              aria-label="Wybierz widok"
              className="inline-flex gap-1 p-1 rounded-full bg-secondary/50 border border-border"
            >
              <button
                type="button"
                role="tab"
                aria-selected={isCandidate}
                onClick={() => switchView("candidate")}
                className={`px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isCandidate
                    ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Dla kandydata
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isCandidate}
                onClick={() => switchView("employer")}
                className={`px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                  !isCandidate
                    ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Dla pracodawcy
              </button>
            </div>
          </div>

          <Link
            to="/auth"
            className="px-3 sm:px-4 py-2 rounded-xl bg-secondary/50 border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors shrink-0"
          >
            Zaloguj się
          </Link>
        </div>
      </header>

      {/* Wrap views with smooth transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* ────────── HERO ────────── */}
          <section className="px-6 py-16 sm:py-24">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium mb-6 border border-orange-500/20">
                  <Sparkles className="w-3 h-3" />
                  <span>
                    {isCandidate
                      ? "Nowy sposób na rekrutację"
                      : "Pierwszy etap rekrutacji na autopilocie"}
                  </span>
                </div>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-6">
                  {isCandidate ? (
                    <>
                      Koniec z rekrutacją <span className="text-orange-500">w ciemno.</span>
                    </>
                  ) : (
                    <>
                      Przestań czytać <span className="text-orange-500">stosy CV.</span>
                    </>
                  )}
                </h1>
                <p className="text-base sm:text-lg text-foreground/70 mb-8 max-w-xl leading-relaxed">
                  {isCandidate
                    ? "Aplikujesz profilem, nie PDF-em. JobSwipe wybiera top 5 kandydatów — pracodawca kontaktuje tylko najlepszych. A Ty zawsze dostajesz odpowiedź."
                    : "Opublikuj ofertę, zbierz kandydatów, kliknij jeden przycisk. JobSwipe analizuje wszystkich i zwraca Top 5 z uzasadnieniem. Ty kontaktujesz tylko najlepszych."}
                </p>
                <div className="flex flex-wrap gap-3">
                  {isCandidate ? (
                    <>
                      <Link to="/auth?role=candidate" className={CTA_PRIMARY}>
                        Zacznij jako kandydat <ArrowRight className="w-4 h-4" />
                      </Link>
                      <button type="button" onClick={() => switchView("employer")} className={CTA_GHOST}>
                        <Building2 className="w-4 h-4" /> Jestem pracodawcą
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/auth?role=employer" className={CTA_PRIMARY}>
                        Dodaj ofertę pracy <ArrowRight className="w-4 h-4" />
                      </Link>
                      <button type="button" onClick={() => switchView("candidate")} className={CTA_GHOST}>
                        <User className="w-4 h-4" /> Jestem kandydatem
                      </button>
                    </>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex justify-center"
              >
                {isCandidate ? (
                  <SwipeDemoStack />
                ) : (
                  <div className="w-full max-w-[340px] mx-auto min-h-[420px] flex items-center">
                    <AnimatePresence mode="wait">
                      {heroStep === 0 && (
                        <motion.div
                          key="hero-step-0"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.35 }}
                          className="card-gradient rounded-2xl border border-border p-5 shadow-xl w-full"
                        >
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
                            87 kandydatów aplikowało
                          </p>
                          <div className="space-y-1.5">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/40">
                                <div className="w-6 h-6 rounded-full bg-muted" />
                                <div className="flex-1">
                                  <div className="h-3 w-24 rounded bg-muted" />
                                  <div className="h-2 w-16 rounded bg-muted/60 mt-1" />
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground text-center mt-3">
                            Profile zbierane automatycznie...
                          </p>
                        </motion.div>
                      )}

                      {heroStep === 1 && (
                        <motion.div
                          key="hero-step-1"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.35 }}
                          className="card-gradient rounded-2xl border border-primary/30 p-5 shadow-xl flex flex-col items-center justify-center w-full min-h-[420px]"
                        >
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
                            <Zap className="w-6 h-6 text-primary" />
                          </div>
                          <p className="text-sm font-bold text-foreground">JobSwipe analizuje...</p>
                          <p className="text-[11px] text-muted-foreground mt-1">Porównuję 87 profili z wymaganiami</p>
                          <div className="flex gap-1 mt-4">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="w-2 h-2 rounded-full bg-primary animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {heroStep === 2 && (
                        <motion.div
                          key="hero-step-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.35 }}
                          className="card-gradient rounded-2xl border border-border p-5 shadow-xl w-full"
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Zap className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground uppercase tracking-wide">AI Shortlista</p>
                              <p className="text-[10px] text-muted-foreground">87 kandydatów → Top 5</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {[
                              { rank: 1, name: "A. Kowalski", role: "Senior Frontend Dev", score: 94 },
                              { rank: 2, name: "M. Nowak", role: "Full-Stack Engineer", score: 89 },
                              { rank: 3, name: "K. Wiśniewska", role: "React Developer", score: 85 },
                              { rank: 4, name: "P. Zieliński", role: "Frontend Architect", score: 82 },
                              { rank: 5, name: "J. Lewandowska", role: "UI Engineer", score: 78 },
                            ].map((c) => (
                              <div
                                key={c.rank}
                                className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/40 border border-border"
                              >
                                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                                  {c.rank}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                                  <p className="text-[11px] text-muted-foreground truncate">{c.role}</p>
                                </div>
                                <span className="text-sm font-bold text-primary">{c.score}%</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between gap-2">
                            <p className="text-[9px] sm:text-[10px] text-muted-foreground">87 profili</p>
                            <p className="text-[9px] sm:text-[10px] font-medium text-primary">12 sek.</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </div>
          </section>

          {/* ────────── PAIN BAR ────────── */}
          {isCandidate ? (
            <PainBar stats={painCandidate} conclusion="JobSwipe kończy z tym chaosem." />
          ) : (
            <PainBar
              stats={painEmployer}
              conclusion="JobSwipe skraca ten proces do jednego kliknięcia."
            />
          )}

          {/* ────────── COMPARE TABLE ────────── */}
          {isCandidate ? (
            <CompareTable
              rows={compareCandidate}
              title="To nie jest kolejny portal z ofertami pracy."
              subtitle="JobSwipe to nowy model pierwszego etapu rekrutacji."
            />
          ) : (
            <CompareTable
              rows={compareEmployer}
              title="Koniec z ręczną selekcją kandydatów."
              subtitle="JobSwipe automatyzuje pierwszy etap rekrutacji."
            />
          )}

          {/* ────────── HOW IT WORKS ────────── */}
          <motion.section
            {...fadeUp}
            className="px-6 py-16 bg-muted/30 border-y border-border"
          >
            <div className="max-w-6xl mx-auto">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2 text-center">
                {isCandidate ? "Jak to działa — kandydat" : "Jak to działa — pracodawca"}
              </h2>
              <p className="text-muted-foreground text-center mb-12">
                {isCandidate
                  ? "3 kroki do nowej pracy"
                  : "Top 5 kandydatów wybranych przez JobSwipe — bez czytania CV"}
              </p>
              <StepsRow steps={isCandidate ? candidateSteps : employerSteps} />

              {/* Banner 1 — orange callout */}
              <div className="mt-8 max-w-3xl mx-auto rounded-xl border-2 border-orange-500 bg-orange-500/10 px-5 py-4 text-sm text-foreground/90 shadow-[0_0_30px_rgba(249,115,22,0.15)] flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <p className="leading-relaxed">
                  {isCandidate ? (
                    <>
                      <span className="font-semibold">💡 Jako jedyna platforma w Polsce</span>{" "}
                      kończymy z ghostingiem — każdy odrzucony kandydat dostaje automatyczny,
                      merytoryczny feedback od JobSwipe. Bez udziału pracodawcy.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">💡 JobSwipe automatycznie wysyła</span>{" "}
                      merytoryczny feedback każdemu odrzuconemu kandydatowi. Budujesz reputację fair
                      pracodawcy — bez dodatkowej pracy z Twojej strony.
                    </>
                  )}
                </p>
              </div>

              {/* Banner 2 — neutral RODO/objectivity */}
              <div className="mt-4 max-w-3xl mx-auto rounded-xl border border-border bg-secondary/50 px-5 py-4 text-sm text-foreground/90 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <p className="leading-relaxed">
                  {isCandidate ? (
                    <>
                      <span className="font-semibold">🔒 W 100% zgodne z RODO.</span> JobSwipe
                      analizuje Twój profil tylko za Twoją jasną, świadomą zgodą. Masz pełną kontrolę
                      nad swoimi danymi.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">🔒 Przed Shortlistą</span> ukrywamy dane osobowe
                      kandydatów. Widzisz tylko twarde dane zawodowe: kompetencje, staż pracy,
                      oczekiwania. Zero uprzedzeń, czysta ocena potencjału.
                    </>
                  )}
                </p>
              </div>
            </div>
          </motion.section>

          {/* ────────── CANDIDATE-ONLY: FEEDBACK EXAMPLE ────────── */}
          {isCandidate && (
            <motion.section {...fadeUp} className="px-6 py-20">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                  <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3 text-foreground">
                    Jak wygląda feedback od JobSwipe?
                  </h2>
                  <p className="text-muted-foreground">
                    Każdy odrzucony kandydat dostaje konkretne wskazówki — nie ogólniki.
                  </p>
                </div>
                <div className={`${GLASS_CARD} p-6 sm:p-8`}>
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Feedback od JobSwipe</p>
                      <p className="text-xs text-muted-foreground">Dotyczy: Senior Frontend Developer · SGH Tech</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
                    <p>Cześć Anna,</p>
                    <p>Dziękujemy za aplikację na stanowisko <strong className="text-foreground">Senior Frontend Developer</strong> w firmie SGH Tech. Po analizie profili wszystkich kandydatów, Twoja aplikacja nie znalazła się w shortliście Top 5.</p>
                    <div className="rounded-xl bg-muted/50 p-4 my-4">
                      <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Wskazówki do rozwoju</p>
                      <ul className="space-y-1.5">
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          <span>Oferta wymagała min. 5 lat doświadczenia z React — Twój profil wskazuje 2 lata. Rozważ uzupełnienie doświadczenia.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          <span>Brak doświadczenia z Next.js (App Router) — to był kluczowy wymóg techniczny tej oferty.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          <span>Dodanie portfolio z projektami React mogłoby wzmocnić Twój profil przy podobnych ofertach.</span>
                        </li>
                      </ul>
                    </div>
                    <p>Nie zniechęcaj się — regularnie pojawiają się nowe oferty dopasowane do Twojego poziomu. Powodzenia!</p>
                    <p className="text-xs text-muted-foreground mt-3">— Zespół JobSwipe</p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* ────────── SOCIAL PROOF ────────── */}
          {candidatesLabel && employersLabel && (
            isCandidate ? (
              <SocialProof
                a={
                  <>
                    <span className="font-bold text-orange-500">{candidatesLabel}</span> kandydatów już
                    nie wysyła CV w ciemno
                  </>
                }
                b={
                  <>
                    <span className="font-bold text-orange-500">{employersLabel}</span> pracodawców nie
                    czyta stosów PDF-ów
                  </>
                }
              />
            ) : (
              <SocialProof
                a={
                  <>
                    <span className="font-bold text-orange-500">{employersLabel}</span> pracodawców
                    oszczędza czas na selekcji
                  </>
                }
                b={
                  <>
                    <span className="font-bold text-orange-500">{candidatesLabel}</span> kandydatów
                    przeanalizowanych przez JobSwipe
                  </>
                }
              />
            )
          )}

          {/* ────────── CANDIDATE-ONLY: EXAMPLE JOB CARD ────────── */}
          {isCandidate && (
            <motion.section {...fadeUp} className="px-6 py-20">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium mb-4 border border-orange-500/20">
                    <Sparkles className="w-3 h-3" /> Pełny widok oferty
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
                    Przykładowa oferta
                  </h2>
                  <p className="text-base text-foreground/70 max-w-xl mx-auto">
                    Pełna informacja zanim aplikujesz — widzisz Scoring, wymagania i widełki przed
                    wysłaniem aplikacji.
                  </p>
                </div>

                <div className="relative">
                  <div
                    className="absolute inset-0 card-gradient rounded-3xl border border-border shadow-xl"
                    style={{ transform: "scale(0.96) translateY(14px)", opacity: 0.35 }}
                    aria-hidden
                  />
                  <div
                    className="absolute inset-0 card-gradient rounded-3xl border border-border shadow-xl"
                    style={{ transform: "scale(0.98) translateY(7px)", opacity: 0.6 }}
                    aria-hidden
                  />

                  <div className="relative card-gradient rounded-3xl border border-border shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="p-6 sm:p-8 border-b border-border">
                      <div className="flex items-start gap-4 mb-5">
                        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-3xl shrink-0">
                          🚀
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                                Senior Frontend Developer
                              </h3>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                SGH Tech · Edukacja / SaaS
                              </p>
                            </div>
                            <span className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-bold shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                              92% match
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {[
                          { Icon: MapPin, t: "Warszawa" },
                          { Icon: Wifi, t: "Hybrydowo (2 dni / tydz.)" },
                          { Icon: GraduationCap, t: "Senior · 5+ lat" },
                          { Icon: Briefcase, t: "B2B / UoP" },
                          { Icon: Users, t: "Zespół 8 osób" },
                        ].map(({ Icon, t }) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/50 border border-border text-foreground"
                          >
                            <Icon className="w-3 h-3" /> {t}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30">
                        <Wallet className="w-4 h-4 text-orange-500" />
                        <span className="font-bold text-foreground">18 000 – 25 000 zł</span>
                        <span className="text-xs text-muted-foreground">netto / mies. (B2B)</span>
                      </div>
                    </div>

                    {/* Tech stack */}
                    <div className="px-6 sm:px-8 py-5 border-b border-border">
                      <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">
                        Tech stack
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { t: "React", lvl: "must" },
                          { t: "TypeScript", lvl: "must" },
                          { t: "GraphQL", lvl: "must" },
                          { t: "Next.js", lvl: "must" },
                          { t: "Node.js", lvl: "nice" },
                          { t: "Tailwind", lvl: "nice" },
                          { t: "Playwright", lvl: "nice" },
                        ].map(({ t, lvl }) => (
                          <span
                            key={t}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                              lvl === "must"
                                ? "bg-orange-500/15 text-orange-500 border border-orange-500/30"
                                : "bg-secondary/50 text-foreground/70 border border-border"
                            }`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* About role — always visible */}
                    <div className="px-6 sm:px-8 py-6 border-b border-border">
                      <h4 className="flex items-center gap-2 font-semibold text-foreground mb-3">
                        <Target className="w-4 h-4 text-orange-500" /> O roli
                      </h4>
                      <p className="text-sm text-foreground/70 leading-relaxed">
                        Dołącz do zespołu budującego nowoczesną platformę edukacyjną używaną przez
                        ponad 50 000 studentów w Polsce. Poprowadzisz refaktoryzację frontu na Next.js
                        14, wdrożysz design system oraz zadbasz o wydajność i dostępność (WCAG 2.1).
                        Pracujesz blisko z PM, designerem i 3 backendowcami w Go.
                      </p>
                    </div>

                    {/* Responsibilities — always visible */}
                    <div className="px-6 sm:px-8 py-6 border-b border-border">
                      <h4 className="flex items-center gap-2 font-semibold text-foreground mb-3">
                        <ListChecks className="w-4 h-4 text-orange-500" /> Obowiązki
                      </h4>
                      <ul className="space-y-2">
                        {[
                          "Rozwój głównej aplikacji webowej w React + Next.js",
                          "Migracja istniejącego kodu z Pages Router na App Router",
                          "Współtworzenie i utrzymanie wewnętrznego design systemu",
                          "Code review oraz mentoring 2 mid-developerów",
                          "Współpraca z backend i product przy projektowaniu API (GraphQL)",
                        ].map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => setExampleExpanded(!exampleExpanded)}
                      className="w-full py-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1.5 border-t border-border"
                    >
                      {exampleExpanded ? "Zwiń ogłoszenie" : "Pokaż wymagania, benefity i więcej..."}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${exampleExpanded ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence initial={false}>
                      {exampleExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                    {/* Requirements */}
                    <div className="px-6 sm:px-8 py-6 border-b border-border">
                      <h4 className="flex items-center gap-2 font-semibold text-foreground mb-3">
                        <Check className="w-4 h-4 text-orange-500" /> Wymagania
                      </h4>
                      <ul className="space-y-2">
                        {[
                          "5+ lat komercyjnego doświadczenia z React",
                          "Bardzo dobra znajomość TypeScript (typy generyczne, narrowing)",
                          "Doświadczenie z Next.js (App Router) na produkcji",
                          "Praktyka z testowaniem (Jest, Playwright lub Cypress)",
                          "Angielski B2+ (codzienna komunikacja z zespołem QA)",
                        ].map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                            <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Nice to have */}
                    <div className="px-6 sm:px-8 py-6 border-b border-border">
                      <h4 className="flex items-center gap-2 font-semibold text-foreground mb-3">
                        <Star className="w-4 h-4 text-muted-foreground" /> Mile widziane
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Design systems (Storybook)",
                          "Accessibility (WCAG 2.1)",
                          "GraphQL Codegen",
                          "Doświadczenie w EdTech",
                        ].map((n) => (
                          <span
                            key={n}
                            className="px-2.5 py-1 rounded-full bg-secondary/50 text-xs text-foreground/70 border border-border"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="px-6 sm:px-8 py-6 border-b border-border">
                      <h4 className="flex items-center gap-2 font-semibold text-foreground mb-3">
                        <Gift className="w-4 h-4 text-orange-500" /> Benefity
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {[
                          "Prywatna opieka medyczna (Medicover)",
                          "Karta Multisport Plus",
                          "Budżet szkoleniowy 5 000 zł / rok",
                          "MacBook Pro M3 + monitor 4K",
                          "26 dni urlopu (B2B)",
                          "Hybryda: 2 dni z biura w centrum Warszawy",
                        ].map((b, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-foreground/70">
                            <Check className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recruitment process */}
                    <div className="px-6 sm:px-8 py-6 border-b border-border">
                      <h4 className="flex items-center gap-2 font-semibold text-foreground mb-3">
                        <Workflow className="w-4 h-4 text-orange-500" /> Proces rekrutacji
                      </h4>
                      <ol className="space-y-2.5">
                        {[
                          "Krótka rozmowa z rekruterką (30 min)",
                          "Zadanie techniczne na żywo z lead developerem (60 min)",
                          "Spotkanie z zespołem i CTO (45 min)",
                          "Decyzja w ciągu 5 dni roboczych",
                        ].map((s, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-foreground/70">
                            <span className="w-6 h-6 rounded-full bg-orange-500/15 text-orange-500 text-xs font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="pt-0.5">{s}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* About company */}
                    <div className="px-6 sm:px-8 py-6 border-b border-border">
                      <h4 className="flex items-center gap-2 font-semibold text-foreground mb-3">
                        <Building2 className="w-4 h-4 text-orange-500" /> O firmie
                      </h4>
                      <p className="text-sm text-foreground/70 leading-relaxed">
                        SGH Tech to spółka technologiczna budująca platformę e-learningową dla
                        uczelni wyższych w Polsce. Zespół liczy 35 osób, działamy od 2019 r.,
                        jesteśmy rentowni od 2022 r. Inwestujemy w rozwój produktu, a nie w marketing
                        — większość klientów przychodzi z polecenia.
                      </p>
                    </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* CTA */}
                    <div className="px-6 sm:px-8 py-6 bg-muted/30">
                      <Link to="/auth?role=candidate" className={`${CTA_PRIMARY} w-full`}>
                        <Lock className="w-4 h-4" /> Zaloguj się, by aplikować
                      </Link>
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        Przeglądanie ofert jest darmowe. Konto wymagane tylko do aplikowania.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* ────────── CANDIDATE-ONLY: FREE CV ────────── */}
          {isCandidate && (
            <motion.section
              {...fadeUp}
              className="px-6 py-20 bg-gradient-to-br from-white/[0.03] via-background to-orange-500/[0.05] border-y border-border"
            >
              <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium mb-5 border border-orange-500/20">
                    <FileText className="w-3 h-3" /> Bonus dla kandydatów
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 leading-tight">
                    Darmowe, profesjonalne CV — <span className="text-orange-500">od razu.</span>
                  </h2>
                  <p className="text-foreground/70 mb-6 leading-relaxed">
                    Uzupełnij profil i pobierz gotowe CV w formacie A4. Bez Worda, bez Canvy, bez
                    płatnych subskrypcji. Twoje doświadczenie, umiejętności i języki — w estetycznym
                    szablonie z brandingiem JobSwipe.
                  </p>
                  <Link to="/auth?role=candidate" className={CTA_PRIMARY}>
                    Załóż konto i pobierz CV <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="relative flex justify-center">
                  <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
                  <div
                    className="relative w-[280px] sm:w-[320px] aspect-[1/1.414] rounded-lg overflow-hidden shadow-2xl border border-border grid grid-cols-[32%_68%] bg-card shadow-[0_0_40px_rgba(249,115,22,0.2)]"
                    aria-hidden
                  >
                    <div className="bg-foreground/90 p-3 flex flex-col gap-3">
                      <div className="w-12 h-12 rounded-full bg-orange-500/30 mx-auto" />
                      <div className="space-y-1">
                        <div className="h-1.5 bg-background/40 rounded w-full" />
                        <div className="h-1.5 bg-background/30 rounded w-3/4" />
                      </div>
                      <div className="space-y-1 mt-2">
                        <div className="h-1 bg-orange-500/60 rounded w-1/2" />
                        <div className="h-1 bg-background/30 rounded w-full" />
                        <div className="h-1 bg-background/30 rounded w-5/6" />
                        <div className="h-1 bg-background/30 rounded w-4/6" />
                      </div>
                      <div className="space-y-1 mt-2">
                        <div className="h-1 bg-orange-500/60 rounded w-1/2" />
                        <div className="h-1 bg-background/30 rounded w-full" />
                        <div className="h-1 bg-background/30 rounded w-3/4" />
                      </div>
                    </div>
                    <div className="bg-white p-4 flex flex-col gap-3">
                      <div className="space-y-1">
                        <div className="h-2.5 bg-foreground/80 rounded w-2/3" />
                        <div className="h-1.5 bg-orange-500 rounded w-1/3" />
                      </div>
                      <div className="space-y-1.5 mt-2">
                        <div className="h-1 bg-orange-500 rounded w-1/4" />
                        <div className="h-1 bg-foreground/30 rounded w-full" />
                        <div className="h-1 bg-foreground/30 rounded w-5/6" />
                        <div className="h-1 bg-foreground/30 rounded w-4/6" />
                      </div>
                      <div className="space-y-1.5 mt-2">
                        <div className="h-1 bg-orange-500 rounded w-1/3" />
                        <div className="h-1 bg-foreground/30 rounded w-full" />
                        <div className="h-1 bg-foreground/30 rounded w-3/4" />
                        <div className="h-1 bg-foreground/30 rounded w-5/6" />
                      </div>
                      <div className="space-y-1.5 mt-2">
                        <div className="h-1 bg-orange-500 rounded w-1/4" />
                        <div className="h-1 bg-foreground/30 rounded w-full" />
                        <div className="h-1 bg-foreground/30 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* ────────── EMPLOYER-ONLY: BENEFITS ────────── */}
          {!isCandidate && (
            <motion.section {...fadeUp} className="px-6 py-20">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">
                    Co dostajesz jako pracodawca
                  </h2>
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    Pełna kontrola nad procesem, zero chaosu dokumentowego.
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      Icon: Shield,
                      title: "Obiektywna selekcja",
                      body: "JobSwipe ocenia kandydatów wyłącznie na podstawie kompetencji zawodowych. Zero subiektywnych uprzedzeń, zero przypadkowości.",
                    },
                    {
                      Icon: Clock,
                      title: "Shortlista w minuty, nie dni",
                      body: "Zamiast tygodnia wstępnej selekcji — jeden przycisk i masz Top 5 z uzasadnieniem. Twój czas wraca do Ciebie.",
                    },
                    {
                      Icon: Star,
                      title: "Reputacja fair pracodawcy",
                      body: "Każdy kandydat dostaje automatyczny feedback. Budujesz markę pracodawcy który szanuje czas aplikujących — bez żadnego wysiłku z Twojej strony.",
                    },
                  ].map(({ Icon, title, body }) => (
                    <div key={title} className={`${GLASS_CARD} p-6`}>
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2 text-foreground">{title}</h3>
                      <p className="text-sm text-foreground/70 leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* ────────── EMPLOYER-ONLY: PRICING ────────── */}
          {!isCandidate && (
            <motion.section {...fadeUp} className="px-6 py-20">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3 text-foreground">
                  Proste zasady, zero ukrytych kosztów
                </h2>
                <p className="text-muted-foreground mb-10">
                  Publikujesz ofertę za darmo. Płacisz tylko gdy chcesz zobaczyć Top 5.
                </p>
                <div className={`${GLASS_CARD} p-8 ring-1 ring-primary/30 max-w-md mx-auto`}>
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground mb-1">Shortlista Top 5</h3>
                  <p className="text-4xl font-black text-primary mb-2">299 zł <span className="text-base font-normal text-muted-foreground">netto</span></p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Jednorazowa opłata za ofertę. Bez abonamentu, bez zobowiązań.
                  </p>
                  <div className="space-y-2 text-left text-sm text-foreground/70">
                    {[
                      "Publikacja oferty i zbieranie kandydatów — bezpłatne",
                      "Ranking Top 5 z uzasadnieniem wyboru",
                      "Automatyczny feedback dla odrzuconych",
                      "PDF profilu kandydata po shortliście",
                      "Kontakt z wybranymi kandydatami",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Link to="/auth?role=employer" className={`${CTA_PRIMARY} w-full mt-6`}>
                    Dodaj ofertę pracy <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground mt-6">
                  Pakiety dla firm z wieloma rekrutacjami — wkrótce.
                </p>
              </div>
            </motion.section>
          )}

          {/* ────────── FAQ ────────── */}
          <motion.section
            {...fadeUp}
            className="px-6 py-20 bg-muted/30 border-y border-border"
          >
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-10 text-center">
                Często zadawane pytania
              </h2>
              <FaqAccordion items={isCandidate ? faqCandidate : faqEmployer} />
            </div>
          </motion.section>

          {/* ────────── WHO'S BEHIND JOBSWIPE ────────── */}
          <motion.section {...fadeUp} className="px-6 py-20">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3 text-foreground">
                  Kto stoi za JobSwipe?
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Budujemy nowy standard rekrutacji — szybszy, prostszy i bardziej transparentny dla obu stron.
                </p>
              </div>

              {/* Story block */}
              <div className={`${GLASS_CARD} p-6 sm:p-8 mb-8`}>
                <p className="text-sm sm:text-[15px] text-foreground/80 leading-relaxed mb-4">
                  Rekrutacja utknęła między masowym aplikowaniem a ręczną selekcją. Kandydaci wysyłają dziesiątki zgłoszeń i zbyt często nie dostają żadnej odpowiedzi. Pracodawcy toną w CV, tracą czas na porządkowanie kandydatów i próbują rozwiązywać rosnący wolumen zatrudnianiem kolejnych osób do selekcji. To model, który nie skaluje się do tempa współczesnego rynku pracy.
                </p>
                <p className="text-sm sm:text-[15px] text-foreground/80 leading-relaxed mb-4">
                  JobSwipe zmienia ten proces od podstaw. Kandydat może aplikować jednym swipem — szybko, prosto i bez powtarzania tych samych danych w kolejnych formularzach. Pracodawca otrzymuje uporządkowany profil kandydata i narzędzie, które pozwala szybciej przejść od zainteresowania do decyzji, bez konieczności rozbudowywania zespołu rekrutacyjnego tylko po to, by przetwarzać większą liczbę aplikacji.
                </p>
                <p className="text-sm sm:text-[15px] text-foreground/80 leading-relaxed">
                  Nasza wizja jest prosta: rekrutacja, w której każda aplikacja ma jasny status, kandydat otrzymuje odpowiedź i feedback, a pracodawca podejmuje decyzje szybciej, na lepiej uporządkowanych danych. Nie tworzymy kolejnego job boardu. Budujemy nowy standard rekrutacji — szybszy, trafniejszy i bardziej transparentny. Taki, w którym technologia realnie oszczędza czas i podnosi jakość decyzji.
                </p>
              </div>

              {/* Founders */}
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    name: "Robert Matysiak",
                    position: "Data Scientist",
                    company: "LOT Polish Airlines",
                    linkedin: "https://www.linkedin.com/in/robert-matysiak-abc/",
                  },
                  {
                    name: "Jędrzej Kalisiewicz",
                    position: "Lead BI",
                    company: "Renters.pl",
                    linkedin: "https://www.linkedin.com/in/j%C4%99drzej-kalisiewicz-97958a233/",
                    image: founderJedrzej,
                  },
                ].map((person) => (
                  <div
                    key={person.name}
                    className={`${GLASS_CARD} relative overflow-hidden p-4 sm:p-5 flex items-center gap-4 sm:gap-5 group hover:border-primary/40 transition-all duration-300`}
                  >
                    {/* Decorative gradient blob */}
                    <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-colors" />

                    {/* Avatar */}
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-lg sm:text-xl font-bold text-primary-foreground shadow-lg shadow-primary/20 shrink-0 overflow-hidden">
                      {(person as { image?: string }).image ? (
                        <img
                          src={(person as { image?: string }).image}
                          alt={person.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        person.name.split(" ").map((n) => n[0]).join("")
                      )}
                    </div>

                    {/* Name + role */}
                    <div className="relative min-w-0 flex-1">
                      <p className="text-base sm:text-lg font-bold text-foreground leading-tight truncate">
                        {person.name}
                      </p>
                      <p className="text-sm text-foreground/80 mt-0.5 truncate">
                        <span className="font-medium">{person.position}</span>
                        <span className="text-muted-foreground"> · </span>
                        <span className="text-primary font-medium">{person.company}</span>
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">
                        Co-founder
                      </p>
                    </div>

                    {/* LinkedIn CTA */}
                    <a
                      href={person.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Profil LinkedIn — ${person.name}`}
                      className="relative shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 hover:border-primary/40 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      <span className="hidden sm:inline">LinkedIn</span>
                    </a>
                  </div>
                ))}
              </div>

            </div>
          </motion.section>

          {/* ────────── FINAL CTA ────────── */}
          {isCandidate ? (
            <FinalCtaPair
              heading="Gotowy na rekrutację, która działa?"
              primary={{
                icon: User,
                title: "Jestem kandydatem",
                body: "Stwórz profil, aplikuj bez CV, zawsze dostań odpowiedź.",
                cta: "Zacznij za darmo",
                to: "/auth?role=candidate",
              }}
              secondary={{
                icon: Building2,
                title: "Jestem pracodawcą",
                body: "Dodaj ofertę, zbierz kandydatów, uruchom shortlistę JobSwipe.",
                cta: "Dodaj ofertę pracy",
                switchTo: "employer",
              }}
              onSwitch={switchView}
            />
          ) : (
            <FinalCtaPair
              heading="Gotowy skończyć z ręczną selekcją?"
              primary={{
                icon: Building2,
                title: "Jestem pracodawcą",
                body: "Dodaj ofertę, zbierz kandydatów, uruchom shortlistę JobSwipe.",
                cta: "Dodaj ofertę pracy",
                to: "/auth?role=employer",
              }}
              secondary={{
                icon: User,
                title: "Jestem kandydatem",
                body: "Stwórz profil, aplikuj bez CV, zawsze dostań odpowiedź.",
                cta: "Zacznij za darmo",
                switchTo: "candidate",
              }}
              onSwitch={switchView}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 py-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            Prywatność
          </Link>
          <span className="text-border">·</span>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Regulamin
          </Link>
          <span className="text-border">·</span>
          <Link to="/cookies" className="hover:text-foreground transition-colors">
            Cookies
          </Link>
          <span className="text-border">·</span>
          <a href="mailto:kontakt@jobswipe.pl" className="hover:text-foreground transition-colors">
            kontakt@jobswipe.pl
          </a>
          <span className="text-border">·</span>
          <span>© {new Date().getFullYear()} JobSwipe</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
