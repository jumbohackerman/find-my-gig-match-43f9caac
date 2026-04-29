import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles, FileText } from "lucide-react";

/**
 * Wzorcowe oferty dla pracodawcy — pokazują jak powinna wyglądać dobrze
 * uzupełniona oferta. Zachęcają do wypełnienia kluczowych pól, które
 * poprawiają jakość dopasowania kandydatów (scoring).
 *
 * To są przykłady demonstracyjne, nie operacyjny dostęp do cudzych ogłoszeń.
 */

interface SampleJob {
  title: string;
  company: string;
  logo: string;
  summary: string;
  requirements: string[];
  niceToHave: string[];
  whyGood: string;
}

const SAMPLES: SampleJob[] = [
  {
    title: "Senior Frontend Developer (React)",
    company: "Acme Tech",
    logo: "💻",
    summary:
      "Dołącz do zespołu rozwijającego aplikację SaaS dla 50k użytkowników. Szukamy osoby z doświadczeniem w React i TypeScript, która poprowadzi refaktoryzację frontu.",
    requirements: [
      "5+ lat komercyjnego doświadczenia z React",
      "Bardzo dobra znajomość TypeScript",
      "Doświadczenie z testowaniem (Jest, Playwright)",
      "Angielski B2+",
    ],
    niceToHave: ["Next.js", "Doświadczenie z design systems", "Wiedza o accessibility (WCAG)"],
    whyGood:
      "Konkretne wymagania (lata doświadczenia, wersje technologii), jasny kontekst (SaaS, skala) oraz rozdzielone 'wymagane' od 'mile widziane' — scoring kandydata będzie precyzyjny.",
  },
  {
    title: "Product Designer — SaaS B2B",
    company: "Acme Tech",
    logo: "🎨",
    summary:
      "Poprowadzisz projektowanie flagowego produktu od research po wdrożenie. Ścisła współpraca z PM i zespołem front-endowym.",
    requirements: [
      "3+ lat w projektowaniu produktów SaaS",
      "Portfolio z case studies (nie same screeny)",
      "Figma na poziomie zaawansowanym",
      "Znajomość procesu research → low-fi → hi-fi",
    ],
    niceToHave: ["Design systems", "Doświadczenie z B2B", "Prototypowanie interakcji (Framer)"],
    whyGood:
      "Oferta precyzuje kontekst (B2B, SaaS), oczekiwania co do portfolio oraz poziom znajomości narzędzi — dzięki temu dopasowanie uwzględni realne kompetencje, a nie tylko nazwę roli.",
  },
  {
    title: "Backend Engineer (Go / PostgreSQL)",
    company: "Acme Tech",
    logo: "⚙️",
    summary:
      "Będziesz projektować i rozwijać backend przetwarzający miliony zdarzeń dziennie. Zespół 6 osób, praca hybrydowa (Warszawa) lub zdalna z UE.",
    requirements: [
      "3+ lat w Go lub gotowość szybkiego przesiadki (np. z Node/Java)",
      "Mocne podstawy SQL i PostgreSQL",
      "Doświadczenie z systemami rozproszonymi",
      "CI/CD, Docker, monitoring (Prometheus/Grafana)",
    ],
    niceToHave: ["Kafka/NATS", "Event sourcing", "Kubernetes"],
    whyGood:
      "Jasny tryb pracy (hybryda/zdalnie z UE), skala techniczna (miliony zdarzeń) i otwartość na przebranżowienie — oferta przyciąga konkretnych kandydatów i daje scoring trafne sygnały.",
  },
];

const SampleJobsPanel = () => {
  const [expanded, setExpanded] = useState(false);
  const [openSample, setOpenSample] = useState<number | null>(null);

  return (
    <div className="mb-4 rounded-2xl border border-border/70 bg-secondary/30 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-foreground">Wzorcowe oferty — inspiracja</p>
          <p className="text-sm text-muted-foreground">
            Dobrze uzupełniona oferta przyciąga lepszych kandydatów i daje trafniejszą shortlistę. Zobacz przykłady.
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-2">
              {SAMPLES.map((sample, idx) => {
                const isOpen = openSample === idx;
                return (
                  <div key={idx} className="rounded-xl border border-border bg-card/60 overflow-hidden">
                    <button
                      onClick={() => setOpenSample(isOpen ? null : idx)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-secondary/40 transition-colors"
                    >
                      <span className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-lg shrink-0">
                        {sample.logo}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{sample.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{sample.company}</p>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-1 space-y-3 text-xs">
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Podsumowanie
                              </p>
                              <p className="text-foreground/90 leading-relaxed">{sample.summary}</p>
                            </div>

                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Wymagania (obowiązkowe)
                              </p>
                              <ul className="space-y-0.5">
                                {sample.requirements.map((r, i) => (
                                  <li key={i} className="flex items-start gap-1.5 text-foreground/85">
                                    <span className="text-accent mt-0.5">✓</span>
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Mile widziane
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {sample.niceToHave.map((n, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground"
                                  >
                                    {n}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-lg bg-primary/5 border border-primary/15 p-2.5 flex items-start gap-2">
                              <FileText className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-0.5">
                                  Dlaczego ta oferta działa
                                </p>
                                <p className="text-[11px] text-foreground/80 leading-relaxed">{sample.whyGood}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SampleJobsPanel;
