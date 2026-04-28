import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, X, Sparkles, Search, Zap, MessageCircle,
  ClipboardList, Send, Users, BarChart3,
} from "lucide-react";

interface TutorialStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: string;
}

const ICON_CLASS = "w-10 h-10 text-primary-foreground";

const CANDIDATE_STEPS: TutorialStep[] = [
  {
    icon: <Sparkles className={ICON_CLASS} />,
    title: "Witaj w JobSwipe!",
    description:
      "Rekrutacja bez chaosu. Stwórz profil raz — aplikuj na oferty jednym gestem. Bez formularzy, bez PDF-ów, bez stresu.",
    accent: "Zaczynamy!",
  },
  {
    icon: <Search className={ICON_CLASS} />,
    title: "Przeglądaj oferty swipe'em",
    description:
      "Każda oferta pokazuje scoring dopasowania do Twojego profilu. Przesuń w prawo aby aplikować, w lewo aby pominąć, w górę aby zapisać na później.",
  },
  {
    icon: <Zap className={ICON_CLASS} />,
    title: "Scoring — Twoje szanse",
    description:
      "Im pełniejszy profil (umiejętności, doświadczenie, oczekiwania), tym trafniejszy scoring. Procent dopasowania pomaga Ci świadomie decydować, na co aplikować.",
  },
  {
    icon: <MessageCircle className={ICON_CLASS} />,
    title: "Zawsze dostajesz odpowiedź",
    description:
      "Koniec z ghostingiem. Nawet jeśli nie przejdziesz dalej — otrzymasz merytoryczny feedback ze wskazówkami, co poprawić. Każdy kandydat jest traktowany z szacunkiem.",
  },
  {
    icon: <ClipboardList className={ICON_CLASS} />,
    title: "Darmowe CV w PDF",
    description:
      "JobSwipe generuje profesjonalne CV na podstawie Twojego profilu. Pobierz je w dowolnym momencie — bez Worda, bez Canvy, bez opłat.",
    accent: "Zaczynajmy — uzupełnij profil →",
  },
];

const EMPLOYER_STEPS: TutorialStep[] = [
  {
    icon: <Sparkles className={ICON_CLASS} />,
    title: "Witaj w JobSwipe!",
    description:
      "Pierwszy etap rekrutacji na autopilocie. Opublikuj ofertę, zbierz kandydatów, uruchom Shortlistę — resztą zajmie się JobSwipe.",
    accent: "Zaczynamy!",
  },
  {
    icon: <Send className={ICON_CLASS} />,
    title: "Opublikuj ofertę w minutę",
    description:
      "Dodaj stanowisko, wymagania, widełki i benefity. Im lepiej opiszesz ofertę, tym trafniejsze dopasowanie kandydatów.",
  },
  {
    icon: <Users className={ICON_CLASS} />,
    title: "Kandydaci aplikują profilem",
    description:
      "Zamiast stosów CV w różnych formatach — uporządkowane, porównywalne profile. Każdy kandydat widzi scoring dopasowania i aplikuje świadomie.",
  },
  {
    icon: <BarChart3 className={ICON_CLASS} />,
    title: "Shortlista Top 5 jednym kliknięciem",
    description:
      "Gdy zbierzesz minimum 10 kandydatów, uruchom Shortlistę. JobSwipe analizuje wszystkich i zwraca Top 5 z uzasadnieniem wyboru. Bez ręcznego przeglądania.",
  },
  {
    icon: <MessageCircle className={ICON_CLASS} />,
    title: "Automatyczny feedback",
    description:
      "Odrzuceni kandydaci dostają merytoryczny feedback automatycznie. Budujesz markę fair pracodawcy — bez dodatkowej pracy z Twojej strony.",
    accent: "Dodaj pierwszą ofertę →",
  },
];

interface Props {
  role: "candidate" | "employer";
  onComplete: () => void;
}

const WelcomeTutorial = ({ role, onComplete }: Props) => {
  const steps = role === "candidate" ? CANDIDATE_STEPS : EMPLOYER_STEPS;
  const [current, setCurrent] = useState(0);
  const isLast = current === steps.length - 1;
  const step = steps[current];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (isLast) onComplete();
        else setCurrent((s) => s + 1);
      }
      if (e.key === "ArrowLeft" && current > 0) setCurrent((s) => s - 1);
      if (e.key === "Escape") onComplete();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [current, isLast, onComplete]);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 backdrop-blur-md px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome tutorial"
    >
      <div className="w-full max-w-lg flex flex-col items-center">
        {/* Skip */}
        <div className="self-end mb-4">
          <button
            onClick={onComplete}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="w-3.5 h-3.5" /> Pomiń tutorial
          </button>
        </div>

        {/* Card */}
        <div className="w-full card-gradient rounded-3xl border border-border p-8 shadow-glow min-h-[360px] flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full text-center space-y-5"
            >
              <div className="w-20 h-20 rounded-2xl btn-gradient flex items-center justify-center mx-auto shadow-glow">
                {step.icon}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                {step.title}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                {step.description}
              </p>
              {step.accent && isLast && (
                <p className="text-primary font-semibold text-sm pt-1">{step.accent}</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="w-full flex items-center justify-between mt-6">
          {/* Dots */}
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  i === current
                    ? "bg-primary w-6"
                    : i < current
                      ? "bg-primary/40 w-2"
                      : "bg-secondary w-2"
                }`}
                aria-label={`Krok ${i + 1}`}
              />
            ))}
          </div>

          {/* Next / Finish */}
          <button
            onClick={() => {
              if (isLast) onComplete();
              else setCurrent((s) => s + 1);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isLast ? "Zaczynaj!" : "Dalej"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default WelcomeTutorial;
