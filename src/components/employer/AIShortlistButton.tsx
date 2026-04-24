/**
 * AIShortlistButton — Block 5A + 5B
 * Renders the gated button to launch AI Shortlist with a confirmation modal.
 * Hidden if shortlist already exists (parent renders results instead).
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, AlertTriangle, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  applicationsCount: number;
  running: boolean;
  onRun: () => Promise<boolean>;
}

const MIN_APPLICATIONS = 10;

export default function AIShortlistButton({ applicationsCount, running, onRun }: Props) {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const enough = applicationsCount >= MIN_APPLICATIONS;
  const missing = Math.max(0, MIN_APPLICATIONS - applicationsCount);

  const handleConfirm = async () => {
    const ok = await onRun();
    if (ok) {
      setOpen(false);
      setAccepted(false);
    }
  };

  return (
    <>
      <button
        onClick={() => enough && setOpen(true)}
        disabled={!enough || running}
        title={
          !enough
            ? `Potrzebujesz jeszcze ${missing} kandydatów, aby uruchomić shortlistę`
            : "Wygeneruj shortlistę AI"
        }
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
          enough
            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90 shadow-lg shadow-orange-500/30"
            : "bg-secondary text-muted-foreground cursor-not-allowed"
        }`}
      >
        {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Generuj Shortlistę AI
        {!enough && <span className="text-xs opacity-80">(brak {missing})</span>}
      </button>

      {open &&
        createPortal(
          <AnimatePresence>
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm px-4 overflow-y-auto py-8"
              onClick={() => !running && setOpen(false)}
              role="dialog"
              aria-modal="true"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg card-gradient rounded-2xl border border-border p-6 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => !running && setOpen(false)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                  aria-label="Zamknij"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">
                    Uruchomić AI Shortlistę?
                  </h3>
                </div>

                <div className="rounded-xl bg-orange-500/10 border border-orange-500/30 p-4 mb-4">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-foreground">
                      Przeczytaj uważnie przed potwierdzeniem:
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-foreground/90">
                    <li>💳 Ta operacja generuje koszt zgodnie z cennikiem JobSwipe.</li>
                    <li>🔒 Shortlista jest jednorazowa — nie można jej uruchomić ponownie dla tej oferty.</li>
                    <li>✂️ Kandydaci spoza top 5 zostaną automatycznie odrzuceni i otrzymają email z feedbackiem.</li>
                    <li>📧 System automatycznie wyśle maile do wszystkich kandydatów (wybranych i odrzuconych).</li>
                    <li>🚫 Po shortliście oferta nie może zostać ponownie otwarta na nowe aplikacje.</li>
                  </ul>
                </div>

                <label className="flex items-start gap-3 mb-5 cursor-pointer p-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition-colors">
                  <Checkbox
                    checked={accepted}
                    onCheckedChange={(v) => setAccepted(v === true)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-foreground">
                    Rozumiem i akceptuję powyższe warunki
                  </span>
                </label>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    disabled={running}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-muted border border-border disabled:opacity-50"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!accepted || running}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90 shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                  >
                    {running ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Uruchom Shortlistę AI →
                  </button>
                </div>
              </motion.div>
            </div>
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
