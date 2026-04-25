import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/jobswipe-logo.png";
import SwipeDemoStack from "@/components/SwipeDemoStack";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const Landing = () => {
  const [counts, setCounts] = useState<{ candidates: number; employers: number }>({ candidates: 0, employers: 0 });

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

  const candidatesLabel = counts.candidates > 0 ? counts.candidates.toLocaleString("pl-PL") : "1 200+";
  const employersLabel = counts.employers > 0 ? counts.employers.toLocaleString("pl-PL") : "180+";

  const painStats = [
    { value: "73%", title: "kandydatów", desc: "nigdy nie dostaje odpowiedzi" },
    { value: "6 tyg.", title: "średnio", desc: "czeka na jakąkolwiek odpowiedź" },
    { value: "60+", title: "CV", desc: "czyta pracodawca przed shortlistą" },
    { value: "0", title: "odpowiedzi", desc: "dostaje większość odrzuconych" },
  ];

  const comparison = [
    { old: "Wysyłasz CV w ciemno, bez śledzenia", neu: "Aplikujesz profilem. Raz tworzysz, wszędzie aplikujesz" },
    { old: "Tygodnie ciszy po aplikacji", neu: "Każdy kandydat dostaje odpowiedź i feedback od JobSwipe" },
    { old: "Pracodawca przegląda 80 PDF-ów ręcznie", neu: "JobSwipe analizuje wszystkich i zwraca top 5 z uzasadnieniem" },
    { old: "Zero informacji, dlaczego odrzucono", neu: "Konkretny feedback: co zadziałało, czego brakowało" },
    { old: "CV ginie w skrzynce rekrutera", neu: "Profil + darmowe profesjonalne CV do pobrania" },
  ];

  const candidateSteps = [
    {
      icon: FileText,
      title: "Zbuduj profil w sekundę",
      body: "Wrzuć swoje stare CV raz — JobSwipe natychmiast wyciągnie z niego dane i stworzy strukturalny profil. Jako bonus: w każdej chwili pobierzesz z niego nowoczesne, darmowe CV w formacie PDF.",
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

  const employerSteps = [
    {
      icon: PlusSquare,
      title: "Zbierz aplikacje bez czytania PDF-ów",
      body: "Opublikuj ofertę i patrz jak spływają uporządkowane profile kandydatów. Zero PDF-ów, zero chaosu. Same czyste dane gotowe do shortlisty.",
    },
    {
      icon: Zap,
      title: "Wybierz Top 5 jednym kliknięciem",
      body: "Kliknij jeden przycisk — JobSwipe analizuje wszystkich kandydatów i podaje Ci Top 5 z rankingiem i uzasadnieniem wyboru. Oszczędzasz godziny ręcznej selekcji.",
    },
    {
      icon: UserCheck,
      title: "Kontaktujesz tylko najlepszych",
      body: "Widzisz top 5 z wynikami i uzasadnieniem JobSwipe. Decydujesz, do kogo piszesz. Reszta kandydatów automatycznie dostaje feedback — bez Twojego zaangażowania.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Top bar ── */}
      <header className="px-6 py-4 border-b border-border/40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="" className="w-9 h-9" />
            <span className="font-display text-xl font-bold">
              Job<span className="text-gradient-primary">Swipe</span>
            </span>
          </Link>
          <Link
            to="/auth"
            className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            Zaloguj się
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="px-6 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-6">
              <Sparkles className="w-3 h-3" />
              <span>Nowy sposób na rekrutację</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
              Koniec z rekrutacją <span className="text-gradient-primary">w ciemno.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-xl">
              Aplikujesz profilem, nie PDF-em. JobSwipe wybiera top 5 kandydatów — pracodawca kontaktuje tylko
              najlepszych. A Ty zawsze dostajesz odpowiedź.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/auth?role=candidate"
                className="px-6 py-3 rounded-xl btn-gradient text-primary-foreground font-medium shadow-glow hover:scale-[1.02] transition-transform inline-flex items-center gap-2"
              >
                Zacznij jako kandydat <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/auth?role=employer"
                className="px-6 py-3 rounded-xl border border-border bg-transparent text-foreground font-medium hover:bg-secondary transition-colors inline-flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4" /> Dodaj ofertę pracy
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <SwipeDemoStack />
          </motion.div>
        </div>
      </section>

      {/* ── Pain points bar ── */}
      <motion.section {...fadeUp} className="px-6 py-12 bg-white/[0.05] border-y border-border/40">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-border/40">
            {painStats.map((s, i) => (
              <div key={i} className="text-center px-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-2">
                  Problem
                </div>
                <div className="text-5xl sm:text-6xl font-display font-black text-primary mb-2 leading-none">{s.value}</div>
                <div className="text-sm text-foreground font-medium">{s.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-center mt-10 text-base sm:text-lg font-semibold text-gradient-primary">
            JobSwipe rozwiązuje każdy z tych problemów.
          </p>
        </div>
      </motion.section>

      {/* ── VS Comparison ── */}
      <motion.section {...fadeUp} className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3 text-center">
            To nie jest kolejny portal z ofertami pracy.
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            JobSwipe to nowy model pierwszego etapu rekrutacji.
          </p>

          <div className="card-gradient rounded-2xl border border-border overflow-hidden shadow-xl">
            {/* Header */}
            <div className="hidden md:grid grid-cols-[1fr_auto_1fr] gap-4 px-6 py-4 border-b border-border/60 bg-secondary/30">
              <div className="text-sm font-bold text-muted-foreground inline-flex items-center gap-2">
                <X className="w-4 h-4" /> Tradycyjna rekrutacja
              </div>
              <div className="w-6" />
              <div className="text-sm font-bold text-gradient-primary inline-flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" /> JobSwipe
              </div>
            </div>

            {comparison.map((row, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 md:gap-4 px-6 py-4 items-center hover:bg-orange-500/5 transition-colors ${
                  idx !== comparison.length - 1 ? "border-b border-border/40" : ""
                }`}
              >
                <div className="flex items-start gap-2 text-muted-foreground text-sm sm:text-[15px] leading-relaxed">
                  <X className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/70" />
                  <span>{row.old}</span>
                </div>
                <ArrowRight className="hidden md:block w-4 h-4 text-muted-foreground/50" />
                <div className="flex items-start gap-2 text-foreground text-sm sm:text-[15px] leading-relaxed md:pl-2 md:border-l-2 md:border-primary/30">
                  <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                  <span>{row.neu}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── How it works — candidate ── */}
      <motion.section {...fadeUp} className="px-6 py-16 bg-white/[0.03] border-y border-border/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2 text-center">Jak to działa — kandydat</h2>
          <p className="text-muted-foreground text-center mb-12">3 kroki do nowej pracy</p>
          <div className="grid md:grid-cols-3 gap-6">
            {candidateSteps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="card-gradient rounded-2xl border border-border p-6">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 max-w-3xl mx-auto rounded-xl border-2 border-orange-500 bg-orange-500/10 px-5 py-4 text-sm font-medium text-foreground/90 shadow-[0_0_30px_rgba(249,115,22,0.15)] flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <p>
              <span className="font-semibold">Jako jedyna platforma w Polsce</span> kończymy z ghostingiem — każdy
              odrzucony kandydat dostaje automatyczny, merytoryczny feedback od JobSwipe. Bez udziału pracodawcy.
            </p>
          </div>
        </div>
      </motion.section>

      {/* ── How it works — employer ── */}
      <motion.section {...fadeUp} className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2 text-center">Jak to działa — pracodawca</h2>
          <p className="text-muted-foreground text-center mb-12">
            Top 5 kandydatów wybranych przez JobSwipe — bez czytania CV
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {employerSteps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="card-gradient rounded-2xl border border-border p-6">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ── Social proof ── */}
      <motion.section {...fadeUp} className="px-6 py-12 bg-white/[0.05] border-y border-border/40">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <p className="text-lg sm:text-xl text-foreground">
            <span className="font-bold text-gradient-primary">{candidatesLabel}</span> kandydatów już nie wysyła CV w ciemno
          </p>
          <p className="text-lg sm:text-xl text-foreground">
            <span className="font-bold text-gradient-primary">{employersLabel}</span> pracodawców nie czyta stosów PDF-ów
          </p>
        </div>
      </motion.section>

      {/* ── Example job card ── */}
      <motion.section {...fadeUp} className="px-6 py-16">
        <div className="max-w-lg mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2 text-center">Przykładowa oferta</h2>
          <p className="text-sm text-muted-foreground text-center mb-10">
            Tak wygląda oferta w JobSwipe — pełna informacja zanim aplikujesz
          </p>
          <div className="relative">
            {/* Ghost card 3 */}
            <div
              className="absolute inset-0 card-gradient rounded-3xl border border-border shadow-xl"
              style={{ transform: "scale(0.94) translateY(12px)", opacity: 0.3 }}
              aria-hidden
            />
            {/* Ghost card 2 */}
            <div
              className="absolute inset-0 card-gradient rounded-3xl border border-border shadow-xl"
              style={{ transform: "scale(0.97) translateY(6px)", opacity: 0.6 }}
              aria-hidden
            />
            {/* Main card */}
            <div className="relative card-gradient rounded-3xl border border-border shadow-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">🚀</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">Senior Frontend Developer</h3>
                      <p className="text-sm text-muted-foreground">SGH Tech</p>
                    </div>
                    <span className="px-2 py-1 rounded-md btn-gradient text-primary-foreground text-xs font-bold">
                      92% match
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-4">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Warszawa
                </span>
                <span>· Hybrydowo</span>
                <span>· Senior</span>
              </div>
              <p className="text-sm text-foreground mb-4">
                Dołącz do zespołu budującego nowoczesną platformę edukacyjną. React, TypeScript, GraphQL.
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {["React", "TypeScript", "GraphQL", "Node.js"].map((t) => (
                  <span key={t} className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs">
                    {t}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm mb-5">
                <span className="font-semibold text-foreground">18 000 – 25 000 zł</span>
              </div>
              <Link
                to="/auth"
                className="w-full px-5 py-3 rounded-xl btn-gradient text-primary-foreground font-medium shadow-glow inline-flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" /> Zaloguj się, by aplikować
              </Link>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Przeglądanie ofert jest darmowe. Konto wymagane tylko do aplikowania.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Free CV callout ── */}
      <motion.section
        {...fadeUp}
        className="px-6 py-20 bg-gradient-to-br from-secondary/30 via-background to-primary/5 border-y border-border/40"
      >
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-5">
              <FileText className="w-3 h-3" /> Bonus dla kandydatów
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 leading-tight">
              Darmowe, profesjonalne CV — <span className="text-gradient-primary">od razu.</span>
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Uzupełnij profil i pobierz gotowe CV w formacie A4. Bez Worda, bez Canvy, bez płatnych subskrypcji. Twoje
              doświadczenie, umiejętności i języki — w estetycznym szablonie z brandingiem JobSwipe.
            </p>
            <Link
              to="/auth?role=candidate"
              className="px-6 py-3 rounded-xl btn-gradient text-primary-foreground font-medium shadow-glow hover:scale-[1.02] transition-transform inline-flex items-center gap-2"
            >
              Załóż konto i pobierz CV <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* CV thumbnail */}
          <div className="relative flex justify-center">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <div
              className="relative w-[280px] sm:w-[320px] aspect-[1/1.414] rounded-lg overflow-hidden shadow-2xl border border-border/60 grid grid-cols-[32%_68%] bg-card shadow-[0_0_40px_rgba(249,115,22,0.2)]"
              aria-hidden
            >
              {/* Sidebar */}
              <div className="bg-foreground/90 p-3 flex flex-col gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/30 mx-auto" />
                <div className="space-y-1">
                  <div className="h-1.5 bg-background/40 rounded w-full" />
                  <div className="h-1.5 bg-background/30 rounded w-3/4" />
                </div>
                <div className="space-y-1 mt-2">
                  <div className="h-1 bg-primary/60 rounded w-1/2" />
                  <div className="h-1 bg-background/30 rounded w-full" />
                  <div className="h-1 bg-background/30 rounded w-5/6" />
                  <div className="h-1 bg-background/30 rounded w-4/6" />
                </div>
                <div className="space-y-1 mt-2">
                  <div className="h-1 bg-primary/60 rounded w-1/2" />
                  <div className="h-1 bg-background/30 rounded w-full" />
                  <div className="h-1 bg-background/30 rounded w-3/4" />
                </div>
              </div>
              {/* Content */}
              <div className="bg-white p-4 flex flex-col gap-3">
                <div className="space-y-1">
                  <div className="h-2.5 bg-foreground/80 rounded w-2/3" />
                  <div className="h-1.5 bg-primary rounded w-1/3" />
                </div>
                <div className="space-y-1.5 mt-2">
                  <div className="h-1 bg-primary rounded w-1/4" />
                  <div className="h-1 bg-foreground/30 rounded w-full" />
                  <div className="h-1 bg-foreground/30 rounded w-5/6" />
                  <div className="h-1 bg-foreground/30 rounded w-4/6" />
                </div>
                <div className="space-y-1.5 mt-2">
                  <div className="h-1 bg-primary rounded w-1/3" />
                  <div className="h-1 bg-foreground/30 rounded w-full" />
                  <div className="h-1 bg-foreground/30 rounded w-3/4" />
                  <div className="h-1 bg-foreground/30 rounded w-5/6" />
                </div>
                <div className="space-y-1.5 mt-2">
                  <div className="h-1 bg-primary rounded w-1/4" />
                  <div className="h-1 bg-foreground/30 rounded w-full" />
                  <div className="h-1 bg-foreground/30 rounded w-2/3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Final CTA ── */}
      <motion.section {...fadeUp} className="px-6 py-20 bg-white/[0.05] border-t border-border/40">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-12">
            Gotowy na rekrutację, <span className="text-gradient-primary">która działa?</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6 relative">
            <div className="card-gradient rounded-2xl border border-border p-8 text-left">
              <div className="w-12 h-12 rounded-full btn-gradient text-primary-foreground text-2xl flex items-center justify-center mb-4">
                👤
              </div>
              <h3 className="font-display font-bold text-xl mb-2">Jestem kandydatem</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Stwórz profil, aplikuj bez CV, zawsze dostań odpowiedź.
              </p>
              <Link
                to="/auth?role=candidate"
                className="w-full px-5 py-3 rounded-xl btn-gradient text-primary-foreground font-medium shadow-glow hover:scale-[1.02] transition-transform inline-flex items-center justify-center gap-2"
              >
                Zacznij za darmo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background border border-border items-center justify-center text-xs text-muted-foreground font-medium z-10">
              lub
            </div>

            <div className="card-gradient rounded-2xl border border-border p-8 text-left">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent text-2xl flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">Jestem pracodawcą</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Dodaj ofertę, zbierz kandydatów, uruchom shortlistę JobSwipe.
              </p>
              <Link
                to="/auth?role=employer"
                className="w-full px-5 py-3 rounded-xl border border-border bg-transparent text-foreground font-medium hover:bg-secondary transition-colors inline-flex items-center justify-center gap-2"
              >
                <Briefcase className="w-4 h-4" /> Dodaj ofertę pracy
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 px-6 py-6 mt-auto">
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
          <span>© {new Date().getFullYear()} JobSwipe</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
