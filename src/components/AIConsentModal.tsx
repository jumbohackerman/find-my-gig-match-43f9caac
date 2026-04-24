/**
 * AIConsentModal — full-screen, non-dismissible consent gate.
 *
 * Block 4 spec:
 * - No X button, no click-outside dismissal
 * - Two choices: grant or refuse
 * - Refusal still proceeds, but apply actions are disabled elsewhere
 */

import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Info } from "lucide-react";

interface Props {
  open: boolean;
  onAccept: () => void | Promise<void>;
  onDecline: () => void | Promise<void>;
  busy?: boolean;
}

const AIConsentModal = ({ open, onAccept, onDecline, busy }: Props) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-consent-title"
      // Intentionally no onClick handler — modal cannot be dismissed by clicking outside.
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-xl my-6 rounded-2xl bg-card border border-border shadow-2xl"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/15 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ai-consent-title" className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Zgoda na analizę profilu przez AI
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Wymagane do aplikowania</p>
            </div>
          </div>

          <p className="text-sm text-foreground/90 mb-4 leading-relaxed">
            JobSwipe wykorzystuje systemy sztucznej inteligencji do analizy Twojego profilu
            zawodowego w procesach rekrutacyjnych — w tym do automatycznego shortlistowania kandydatów.
          </p>

          <div className="rounded-xl bg-secondary/60 border border-border p-4 mb-5">
            <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Co to oznacza:</p>
            <ul className="text-xs sm:text-sm text-muted-foreground space-y-2 leading-relaxed">
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Twój profil (umiejętności, doświadczenie, oczekiwania) będzie analizowany przez AI, gdy aplikujesz na oferty pracy.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>AI może wybrać lub odrzucić Twoją aplikację w procesie shortlistowania.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Decyzje AI oparte są wyłącznie na danych zawodowych — imię, płeć, wiek, narodowość i inne cechy osobiste nie są brane pod uwagę.</span></li>
              <li className="flex gap-2"><span className="text-primary mt-0.5">•</span><span>Masz prawo wycofać zgodę w ustawieniach, co uniemożliwi dalsze aplikowanie.</span></li>
            </ul>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p>Ta zgoda jest wymagana do korzystania z procesu rekrutacyjnego JobSwipe. Bez niej możesz przeglądać oferty, ale nie aplikować.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onDecline}
              disabled={busy}
              className="sm:flex-1 px-4 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              Nie wyrażam zgody
            </button>
            <button
              onClick={onAccept}
              disabled={busy}
              className="sm:flex-[1.3] px-4 py-3 rounded-xl btn-gradient text-primary-foreground text-sm font-semibold shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:pointer-events-none"
            >
              {busy ? "Zapisuję…" : "Wyrażam zgodę"}
            </button>
          </div>

          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-3 justify-center">
            <Info className="w-3 h-3" /> Możesz zmienić tę decyzję w dowolnej chwili w ustawieniach profilu.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AIConsentModal;
