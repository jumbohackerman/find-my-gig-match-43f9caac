/**
 * Block 7B — Lista zaproszeń do kontaktu po stronie kandydata.
 * Pokazuje pending zaproszenia z pełną informacją o ofercie i wiadomością pracodawcy.
 * Akcje: "Akceptuję kontakt" / "Nie jestem zainteresowany".
 */
import { useState } from "react";
import { Mail, Check, XCircle, Building2, Briefcase, Loader2, MessageCircle } from "lucide-react";
import { useCandidateInvitations } from "@/hooks/useContactInvitations";

export default function ContactInvitationsList() {
  const { invitations, loading, accept, reject } = useCandidateInvitations();
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = invitations.filter((i) => i.status === "pending");
  const responded = invitations.filter((i) => i.status !== "pending");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Ładowanie zaproszeń…
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="rounded-xl bg-secondary/40 border border-border p-4 text-center">
        <Mail className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Nie masz jeszcze zaproszeń do kontaktu. Pojawią się tu, gdy pracodawca wybierze Cię z shortlisty AI.
        </p>
      </div>
    );
  }

  const handleAccept = async (id: string) => {
    setBusyId(id);
    try { await accept(id); } finally { setBusyId(null); }
  };
  const handleReject = async (inv: typeof invitations[0]) => {
    setBusyId(inv.id);
    try { await reject(inv.id, inv.job_id, inv.candidate_id); } finally { setBusyId(null); }
  };

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-orange-400">
            Oczekujące ({pending.length})
          </p>
          {pending.map((inv) => (
            <div key={inv.id} className="rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/30 p-3">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                    {inv.job_title || "Oferta"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3" /> {inv.company || "Pracodawca"}
                  </p>
                  {inv.employer_message && (
                    <div className="mt-2 rounded-lg bg-background/60 border border-border p-2">
                      <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" /> Wiadomość pracodawcy
                      </p>
                      <p className="text-xs text-foreground whitespace-pre-wrap">{inv.employer_message}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => handleAccept(inv.id)}
                      disabled={busyId === inv.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {busyId === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Akceptuję kontakt
                    </button>
                    <button
                      onClick={() => handleReject(inv)}
                      disabled={busyId === inv.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-muted border border-border disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Nie jestem zainteresowany
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {responded.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
            Historia ({responded.length})
          </p>
          {responded.map((inv) => (
            <div key={inv.id} className="rounded-xl bg-secondary/30 border border-border p-2.5 flex items-center gap-3">
              <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                inv.status === "accepted" ? "bg-green-500/20" : "bg-muted"
              }`}>
                {inv.status === "accepted"
                  ? <Check className="w-4 h-4 text-green-400" />
                  : <XCircle className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {inv.job_title || "Oferta"} · {inv.company || ""}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {inv.status === "accepted" ? "Zaakceptowane" : "Odrzucone"}
                  {inv.responded_at && ` • ${new Date(inv.responded_at).toLocaleDateString("pl-PL")}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
