/**
 * Block 7A — Modal for sending a contact invitation with optional message.
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  candidateName: string;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
}

const MAX = 500;

export default function ContactInvitationModal({ open, candidateName, onClose, onSubmit }: Props) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await onSubmit(message.trim());
      setMessage("");
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-orange-400" />
            Zaproszenie do kontaktu — {candidateName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <label className="text-sm font-medium text-foreground">
            Wiadomość do kandydata (opcjonalna)
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX))}
            placeholder="Napisz krótko, dlaczego chcesz się skontaktować…"
            rows={5}
            maxLength={MAX}
          />
          <p className="text-[11px] text-muted-foreground text-right">
            {message.length} / {MAX}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={busy} className="bg-accent hover:opacity-90">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            Wyślij zaproszenie
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
