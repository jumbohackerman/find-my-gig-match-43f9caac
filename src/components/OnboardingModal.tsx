import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

const SKILL_OPTIONS = [
  "React", "TypeScript", "JavaScript", "Node.js", "Python", "Go",
  "GraphQL", "PostgreSQL", "AWS", "Docker", "Kubernetes", "Terraform",
  "Figma", "UI/UX", "Swift", "Kotlin", "React Native", "Next.js",
  "Tailwind CSS", "MongoDB", "Redis", "Machine Learning",
];

const SENIORITY_OPTIONS = ["Junior", "Mid", "Senior", "Lead"];
const REMOTE_OPTIONS = ["Zdalnie", "Hybrydowo", "Stacjonarnie", "Dowolnie"];

interface OnboardingData {
  title: string;
  skills: string[];
  salaryMin: number;
  salaryMax: number;
  remotePreference: string;
  seniority: string;
}

interface Props {
  open: boolean;
  onComplete: (data: OnboardingData) => void;
  onClose: () => void;
}

const OnboardingModal = ({ open, onComplete, onClose }: Props) => {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState(8);
  const [salaryMax, setSalaryMax] = useState(25);
  const [remote, setRemote] = useState("Dowolnie");
  const [seniority, setSeniority] = useState("Mid");

  const toggleSkill = (s: string) => {
    setSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : prev.length < 8 ? [...prev, s] : prev
    );
  };

  const steps = [
    // Step 0: Role
    <div key="role" className="space-y-3">
      <h3 className="font-display text-lg font-bold text-foreground">Jaka jest Twoja główna rola?</h3>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="np. Frontend Developer"
        className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>,
    // Step 1: Skills
    <div key="skills" className="space-y-3">
      <h3 className="font-display text-lg font-bold text-foreground">Twoje kluczowe umiejętności (max 8)</h3>
      <div className="flex flex-wrap gap-2">
        {SKILL_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => toggleSkill(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              skills.includes(s)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{skills.length}/8 wybranych</p>
    </div>,
    // Step 2: Salary + Seniority
    <div key="salary" className="space-y-4">
      <h3 className="font-display text-lg font-bold text-foreground">Wynagrodzenie i poziom</h3>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium">
          Oczekiwane wynagrodzenie: {salaryMin} 000 zł – {salaryMax} 000 zł brutto
        </label>
        <div className="flex gap-3">
          <input
            type="range" min={5} max={40} step={1} value={salaryMin}
            onChange={(e) => setSalaryMin(Math.min(Number(e.target.value), salaryMax - 1))}
            className="flex-1"
          />
          <input
            type="range" min={5} max={40} step={1} value={salaryMax}
            onChange={(e) => setSalaryMax(Math.max(Number(e.target.value), salaryMin + 1))}
            className="flex-1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-medium">Poziom doświadczenia</label>
        <div className="grid grid-cols-4 gap-2">
          {SENIORITY_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSeniority(s)}
              className={`py-2 rounded-xl text-xs font-medium transition-all ${
                seniority === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>,
    // Step 3: Remote preference
    <div key="remote" className="space-y-3">
      <h3 className="font-display text-lg font-bold text-foreground">Preferowany tryb pracy</h3>
      <div className="grid grid-cols-2 gap-2">
        {REMOTE_OPTIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRemote(r)}
            className={`py-3 rounded-xl text-sm font-medium transition-all ${
              remote === r
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>,
  ];

  const canNext = step === 0 ? title.trim().length > 0 : step === 1 ? skills.length >= 1 : true;

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4" role="dialog" aria-modal="true" aria-label="Onboarding — konfiguracja profilu">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md card-gradient rounded-2xl border border-border p-6 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1" aria-label="Zamknij">
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex gap-1 mb-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" /> Wstecz
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="flex items-center gap-2 px-5 py-2 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform disabled:opacity-50"
            >
              Dalej <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() =>
                onComplete({
                  title,
                  skills,
                  salaryMin,
                  salaryMax,
                  remotePreference: remote,
                  seniority,
                })
              }
              className="flex items-center gap-2 px-5 py-2 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform"
            >
              Gotowe ✓
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
