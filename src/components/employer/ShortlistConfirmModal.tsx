/**
 * ShortlistConfirmModal — explicit confirmation before consuming a paid slot.
 * Shows job name, slots remaining, active package size, and the cost (1 slot).
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, Layers, AlertTriangle } from "lucide-react";
import type { ShortlistJobBalance } from "@/domain/shortlist";

interface Props {
  open: boolean;
  jobTitle: string;
  candidateLabel: string;
  balance: ShortlistJobBalance;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onPurchase?: () => void;
}

export default function ShortlistConfirmModal({
  open, jobTitle, candidateLabel, balance, busy, onConfirm, onCancel, onPurchase,
}: Props) {
  if (!open) return null;
  const noSlots = balance.remainingSlots <= 0;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
        onClick={() => !busy && onCancel()}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md card-gradient rounded-2xl border border-border p-5 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => !busy && onCancel()}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-lg p-1"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-4">
            <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent" />
              Dodać do shortlisty?
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Akcja zużyje <strong className="text-foreground">1 slot</strong> z aktywnego pakietu i odblokuje pełny profil oraz czat.
            </p>
          </div>

          <div className="mb-4 p-3 rounded-xl bg-secondary/50 border border-border text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Oferta</span><span className="text-foreground font-medium truncate ml-3 max-w-[200px]">{jobTitle}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Kandydat</span><span className="text-foreground font-medium">{candidateLabel}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Aktywny pakiet</span><span className="text-foreground font-medium">{balance.activePackage ? `${balance.activePackage.packageSize} slotów` : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pozostałe sloty</span>
              <span className={`font-semibold ${noSlots ? "text-destructive" : "text-accent"}`}>
                {balance.remainingSlots}/{balance.totalSlots}
              </span>
            </div>
          </div>

          {noSlots ? (
            <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Brak wolnych slotów dla tej oferty. Dokup pakiet, aby kontynuować.</p>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-muted border border-border disabled:opacity-50"
            >
              Anuluj
            </button>
            {noSlots && onPurchase ? (
              <button
                onClick={onPurchase}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                Kup pakiet
              </button>
            ) : (
              <button
                onClick={onConfirm}
                disabled={busy || noSlots}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Dodawanie…" : "Tak, zużyj 1 slot"}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
