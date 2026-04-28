import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Sparkles, Search, Zap,
  MessageCircle, Send, Users, FileText,
  ChevronLeft, ChevronRight, Upload,
} from "lucide-react";

interface TutorialStep {
  icon: React.ReactNode;
  badge: string;
  title: string;
  description: string;
  visual: React.ReactNode;
  cta?: string;
}

/* ── Candidate Steps ── */
const CANDIDATE_STEPS: TutorialStep[] = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    badge: "Krok 1 z 5",
    title: "Wrzuć CV — resztę zrobi AI",
    description: "Prześlij swoje CV w PDF. JobSwipe automatycznie wyciągnie z niego umiejętności, doświadczenie i dane — i uzupełni Twój profil. Zero ręcznego wpisywania.",
    visual: (
      <div className="relative w-full max-w-[280px] mx-auto">
        <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
          </motion.div>
          <p className="text-xs text-primary font-medium">CV.pdf</p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="absolute -bottom-3 -right-3 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-[10px] font-bold shadow-lg"
        >
          ✓ AI uzupełnia profil
        </motion.div>
      </div>
    ),
  },
  {
    icon: <Search className="w-5 h-5" />,
    badge: "Krok 2 z 5",
    title: "Przeglądaj oferty swipe'em",
    description: "Każda oferta pokazuje % dopasowania do Twojego profilu. Swipe w prawo = aplikujesz. W lewo = pomijasz. W górę = zapisujesz na później.",
    visual: (
      <div className="relative w-full max-w-[240px] mx-auto">
        <motion.div
          className="rounded-2xl border border-border bg-secondary/50 p-4 shadow-lg"
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-bold text-foreground">Frontend Developer</p>
              <p className="text-[10px] text-primary">Acme Corp</p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold">87%</span>
          </div>
          <div className="flex gap-1">
            <span className="px-1.5 py-0.5 rounded text-[8px] bg-accent/15 text-accent">React</span>
            <span className="px-1.5 py-0.5 rounded text-[8px] bg-accent/15 text-accent">TypeScript</span>
            <span className="px-1.5 py-0.5 rounded text-[8px] bg-muted text-muted-foreground">Go</span>
          </div>
        </motion.div>
        <div className="flex justify-center gap-6 mt-4 text-muted-foreground">
          <div className="flex flex-col items-center gap-0.5">
            <motion.span animate={{ x: [-3, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-lg">←</motion.span>
            <span className="text-[8px]">Pomiń</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <motion.span animate={{ y: [-3, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-lg">↑</motion.span>
            <span className="text-[8px]">Zapisz</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <motion.span animate={{ x: [3, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-primary text-lg">→</motion.span>
            <span className="text-[8px] text-primary font-medium">Aplikuj</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: <Zap className="w-5 h-5" />,
    badge: "Krok 3 z 5",
    title: "Scoring pokazuje Twoje szanse",
    description: "Algorytm porównuje Twoje umiejętności, doświadczenie i oczekiwania z wymaganiami oferty. Im pełniejszy profil — tym trafniejszy scoring.",
    visual: (
      <div className="w-full max-w-[260px] mx-auto space-y-2">
        {[
          { label: "Umiejętności", value: 85, color: "bg-accent" },
          { label: "Seniority", value: 100, color: "bg-accent" },
          { label: "Lokalizacja", value: 60, color: "bg-yellow-500" },
          { label: "Widełki", value: 0, color: "bg-muted" },
        ].map((d, i) => (
          <div key={d.label}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-muted-foreground">{d.label}</span>
              <span className="text-foreground font-medium">{d.value}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${d.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${d.value}%` }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
              />
            </div>
          </div>
        ))}
        <p className="text-[9px] text-muted-foreground text-center pt-1">
          💡 Widełki puste → uzupełnij profil
        </p>
      </div>
    ),
  },
  {
    icon: <MessageCircle className="w-5 h-5" />,
    badge: "Krok 4 z 5",
    title: "Zawsze dostajesz odpowiedź",
    description: "Koniec z ghostingiem. Nawet jeśli nie przejdziesz dalej — otrzymasz konkretny feedback ze wskazówkami, co poprawić.",
    visual: (
      <div className="w-full max-w-[260px] mx-auto">
        <div className="rounded-xl border border-border bg-secondary/30 p-4">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
              <MessageCircle className="w-3 h-3 text-primary" />
            </div>
            <span className="text-[10px] font-medium text-foreground">Feedback od JobSwipe</span>
          </div>
          <div className="space-y-1.5 text-[10px] text-foreground/70">
            <p>Cześć! Twoja aplikacja nie przeszła do Top 5, ale:</p>
            <div className="pl-2 border-l-2 border-primary/30 space-y-1">
              <p>• Uzupełnij Next.js — kluczowy wymóg</p>
              <p>• Dodaj portfolio z projektami React</p>
            </div>
            <p className="text-primary text-[9px] font-medium pt-1">Powodzenia! — Zespół JobSwipe</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: <FileText className="w-5 h-5" />,
    badge: "Krok 5 z 5",
    title: "Darmowe CV w PDF",
    description: "JobSwipe generuje profesjonalne CV z Twojego profilu. Pobierz w każdej chwili — bez Worda, Canvy i opłat.",
    visual: (
      <div className="w-full max-w-[200px] mx-auto">
        <motion.div
          className="rounded-lg border border-border bg-white shadow-xl overflow-hidden"
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-400" />
          <div className="p-3 space-y-2">
            <div className="h-2.5 w-24 rounded bg-gray-800" />
            <div className="h-1.5 w-16 rounded bg-orange-400" />
            <div className="h-1 w-full rounded bg-gray-200 mt-3" />
            <div className="h-1 w-full rounded bg-gray-200" />
            <div className="h-1 w-3/4 rounded bg-gray-200" />
            <div className="h-1.5 w-20 rounded bg-orange-400 mt-3" />
            <div className="h-1 w-full rounded bg-gray-200" />
            <div className="h-1 w-full rounded bg-gray-200" />
          </div>
        </motion.div>
        <p className="text-center text-[9px] text-muted-foreground mt-2">Profesjonalne CV · Format A4</p>
      </div>
    ),
    cta: "Zaczynajmy — uzupełnij profil →",
  },
];

/* ── Employer Steps ── */
const EMPLOYER_STEPS: TutorialStep[] = [
  {
    icon: <Send className="w-5 h-5" />,
    badge: "Krok 1 z 4",
    title: "Opublikuj ofertę w minutę",
    description: "Dodaj stanowisko, wymagania, widełki i benefity. Im lepiej opiszesz ofertę, tym trafniejsze dopasowanie kandydatów.",
    visual: (
      <div className="w-full max-w-[260px] mx-auto rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
        {["Senior Frontend Developer", "React, TypeScript, Next.js", "18 000 – 25 000 PLN"].map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className="h-8 rounded-lg bg-secondary flex items-center px-3 text-[10px] text-foreground/60"
          >
            {t}
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium text-center"
        >
          Opublikuj ofertę →
        </motion.div>
      </div>
    ),
  },
  {
    icon: <Users className="w-5 h-5" />,
    badge: "Krok 2 z 4",
    title: "Kandydaci aplikują profilem",
    description: "Zamiast stosów CV w różnych formatach — uporządkowane, porównywalne profile. Widzisz scoring dopasowania przy każdym kandydacie.",
    visual: (
      <div className="w-full max-w-[260px] mx-auto space-y-1.5">
        {[
          { name: "A. Kowalski", role: "Senior Frontend", score: 94, delay: 0 },
          { name: "M. Nowak", role: "Full-Stack Eng.", score: 87, delay: 0.15 },
          { name: "K. Wiśniewska", role: "React Dev", score: 73, delay: 0.3 },
        ].map((c) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: c.delay }}
            className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border"
          >
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">{c.name[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-foreground truncate">{c.name}</p>
              <p className="text-[8px] text-muted-foreground">{c.role}</p>
            </div>
            <span className="text-[10px] font-bold text-primary">{c.score}%</span>
          </motion.div>
        ))}
        <p className="text-[9px] text-muted-foreground text-center">+12 kolejnych kandydatów</p>
      </div>
    ),
  },
  {
    icon: <Zap className="w-5 h-5" />,
    badge: "Krok 3 z 4",
    title: "Shortlista Top 5 — jednym kliknięciem",
    description: "Gdy zbierzesz min. 10 kandydatów, uruchom Shortlistę. JobSwipe analizuje wszystkich i zwraca Top 5 z uzasadnieniem. Bez ręcznego przeglądania.",
    visual: (
      <div className="w-full max-w-[240px] mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center"
          >
            <Zap className="w-4 h-4 text-primary" />
          </motion.div>
          <div>
            <p className="text-[10px] font-bold text-foreground">15 kandydatów → Top 5</p>
            <p className="text-[8px] text-muted-foreground">Analiza trwa ~12 sekund</p>
          </div>
        </div>
        {[1, 2, 3, 4, 5].map((rank) => (
          <motion.div
            key={rank}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: rank * 0.12 }}
            className="flex items-center gap-2 py-1"
          >
            <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[9px] font-bold flex items-center justify-center">{rank}</span>
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${100 - rank * 8}%` }} />
            </div>
            <span className="text-[9px] text-foreground font-medium">{100 - rank * 8}%</span>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    icon: <MessageCircle className="w-5 h-5" />,
    badge: "Krok 4 z 4",
    title: "Automatyczny feedback dla odrzuconych",
    description: "Odrzuceni kandydaci dostają merytoryczny feedback automatycznie. Budujesz markę fair pracodawcy — bez dodatkowej pracy z Twojej strony.",
    visual: (
      <div className="w-full max-w-[260px] mx-auto grid grid-cols-2 gap-2">
        {[
          { icon: "✓", label: "Top 5 — kontaktujesz", color: "text-accent" },
          { icon: "✉", label: "Reszta — auto feedback", color: "text-primary" },
          { icon: "⏱", label: "Czas: 0 minut z Twojej strony", color: "text-foreground" },
          { icon: "⭐", label: "Budujesz markę pracodawcy", color: "text-yellow-500" },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-3 rounded-xl bg-secondary/30 border border-border text-center"
          >
            <span className={`text-xl block mb-1 ${item.color}`}>{item.icon}</span>
            <p className="text-[9px] text-foreground/70">{item.label}</p>
          </motion.div>
        ))}
      </div>
    ),
    cta: "Dodaj pierwszą ofertę →",
  },
];

/* ── Component ── */
interface Props {
  role: "candidate" | "employer";
  onComplete: () => void;
}

const WelcomeTutorial = ({ role, onComplete }: Props) => {
  const steps = role === "candidate" ? CANDIDATE_STEPS : EMPLOYER_STEPS;
  const [current, setCurrent] = useState(0);
  const isLast = current === steps.length - 1;
  const step = steps[current];
  const [direction, setDirection] = useState(1);

  const goNext = () => {
    if (isLast) { onComplete(); return; }
    setDirection(1);
    setCurrent((s) => s + 1);
  };

  const goPrev = () => {
    if (current === 0) return;
    setDirection(-1);
    setCurrent((s) => s - 1);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onComplete();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, isLast]);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 backdrop-blur-lg px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome tutorial"
    >
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Skip */}
        <div className="self-end mb-3">
          <button onClick={onComplete} className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Pomiń <X className="w-3 h-3" />
          </button>
        </div>

        {/* Main card */}
        <div className="w-full card-gradient rounded-3xl border border-border shadow-2xl overflow-hidden">
          {/* Visual area */}
          <div className="bg-secondary/30 border-b border-border p-6 sm:p-8 min-h-[200px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`visual-${current}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                {step.visual}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Text area */}
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${current}`}
                initial={{ opacity: 0, x: direction * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -30 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                    {step.icon}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{step.badge}</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2 leading-tight">
                  {step.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
                {step.cta && isLast && (
                  <p className="text-primary font-semibold text-sm mt-3">{step.cta}</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <div className="w-full flex items-center justify-between mt-5">
          <button
            onClick={goPrev}
            disabled={current === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-0 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="w-4 h-4" /> Wstecz
          </button>

          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  i === current ? "bg-primary w-8" : i < current ? "bg-primary/40 w-2" : "bg-secondary w-2"
                }`}
                aria-label={`Krok ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={goNext}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isLast ? "Zaczynajmy!" : "Dalej"} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default WelcomeTutorial;
