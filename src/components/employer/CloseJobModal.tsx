/**
 * Block 7C — Modal for closing a job (recruitment).
 * Forces a closure_reason and warns about irreversibility.
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

export type ClosureReason = "hired_via_jobswipe" | "hired_other_channel" | "no_hire";

interface Props {
  open: boolean;
  jobTitle: string;
  onClose: () => void;
  onConfirm: (reason: ClosureReason) => Promise<void>;
}

const OPTIONS: { value: ClosureReason; emoji: string; label: string }[] = [
  { value: "hired_via_jobswipe", emoji: "🎉", label: "Zatrudniono kandydata przez JobSwipe" },
  { value: "hired_other_channel", emoji: "📋", label: "Zatrudniono innym kanałem" },
  { value: "no_hire", emoji: "❌", label: "Nie zatrudniono nikogo" },
];

export default function CloseJobModal({ open, jobTitle, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState<ClosureReason | null>(null);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (!reason) return;
    setBusy(true);
    try {
      await onConfirm(reason);
      setReason(null);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Zakończyć rekrutację?</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Oferta: <span className="font-semibold text-foreground">{jobTitle}</span>
          </p>

          <div className="space-y-2">
            {OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  reason === opt.value
                    ? "border-accent bg-accent/10"
                    : "border-border hover:bg-secondary/40"
                }`}
              >
                <input
                  type="radio"
                  name="closure_reason"
                  value={opt.value}
                  checked={reason === opt.value}
                  onChange={() => setReason(opt.value)}
                  className="accent-orange-500"
                />
                <span className="text-lg">{opt.emoji}</span>
                <span className="text-sm text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Ta operacja jest nieodwracalna. Oferta zostanie zamknięta i nie przyjmie nowych aplikacji.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Anuluj
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason || busy}
            className="bg-destructive hover:opacity-90 text-destructive-foreground"
          >
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Zakończ rekrutację
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
