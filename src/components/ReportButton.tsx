import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const REASONS = [
  "Fałszywa oferta / profil",
  "Nieodpowiednia treść",
  "Spam",
  "Dane kontaktowe w opisie",
  "Inne",
];

interface Props {
  targetType: "job" | "profile";
  targetId: string;
  targetLabel?: string;
}

const ReportButton = ({ targetType, targetId, targetLabel }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => {
    setOpen(false);
    setReason("");
    setDetails("");
  }, []);

  // Focus trap + ESC
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => closeRef.current?.focus());
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, handleClose]);

  const handleSubmit = async () => {
    if (!user || !reason || sending) return;
    setSending(true);
    const { error } = await supabase.from("reports" as any).insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: `${reason}${details ? `: ${details}` : ""}`,
    } as any);
    setSending(false);
    if (error) {
      toast.error("Nie udało się wysłać zgłoszenia");
    } else {
      toast.success("Zgłoszenie wysłane — dziękujemy!");
      handleClose();
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1"
        aria-label={`Zgłoś ${targetType === "job" ? "ofertę" : "profil"}`}
      >
        <Flag className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Zgłoś</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-label={`Zgłoś ${targetType === "job" ? "ofertę" : "profil"}`}
          >
            <motion.div
              ref={dialogRef}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card-gradient rounded-2xl border border-border p-5 w-full max-w-sm shadow-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-foreground">
                  Zgłoś {targetType === "job" ? "ofertę" : "profil"}
                </h3>
                <button ref={closeRef} onClick={handleClose} className="p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg" aria-label="Zamknij">
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {targetLabel && (
                <p className="text-xs text-muted-foreground mb-3 truncate">
                  {targetLabel}
                </p>
              )}

              <fieldset className="space-y-2 mb-4">
                <legend className="sr-only">Powód zgłoszenia</legend>
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      reason === r
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-muted"
                    }`}
                    role="radio"
                    aria-checked={reason === r}
                  >
                    {r}
                  </button>
                ))}
              </fieldset>

              {reason === "Inne" && (
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Opisz problem…"
                  rows={2}
                  aria-label="Szczegóły zgłoszenia"
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4"
                />
              )}

              <button
                onClick={handleSubmit}
                disabled={!reason || sending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                {sending ? "Wysyłanie…" : "Wyślij zgłoszenie"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ReportButton;
