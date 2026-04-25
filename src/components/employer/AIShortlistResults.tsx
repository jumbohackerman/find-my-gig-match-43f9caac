/**
 * AIShortlistResults — Block 5D
 * Renders top 5 ranked candidates after shortlist completion.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, Mail, Download, MapPin, Briefcase, DollarSign, Sparkles } from "lucide-react";
import type { ShortlistRecord, ShortlistSnapshot } from "@/hooks/useAIShortlist";
import { useContactInvitations } from "@/hooks/useContactInvitations";
import ContactInvitationModal from "./ContactInvitationModal";
import { toast } from "sonner";
import { downloadCandidateProfilePdf } from "@/lib/downloadProfilePdf";

interface Props {
  shortlist: ShortlistRecord;
  snapshots: ShortlistSnapshot[];
  totalApplied: number;
}

const RANK_STYLES: Record<number, { bg: string; label: string }> = {
  1: { bg: "from-yellow-400 to-amber-500", label: "🥇" },
  2: { bg: "from-slate-300 to-slate-400", label: "🥈" },
  3: { bg: "from-amber-700 to-orange-700", label: "🥉" },
};

function formatSalary(min?: number | null, max?: number | null) {
  if (!min && !max) return "—";
  const f = (n: number) => `${n.toLocaleString("pl-PL")} zł`;
  if (min && max) return `${f(min)} – ${f(max)}`;
  return f((min || max) as number);
}

export default function AIShortlistResults({ shortlist, snapshots, totalApplied }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [inviteTarget, setInviteTarget] = useState<ShortlistSnapshot | null>(null);
  const { sendInvitation } = useContactInvitations(shortlist.job_id);
  const rejectedCount = Math.max(0, totalApplied - snapshots.length);
  const isMock = !shortlist.ai_model_used || shortlist.ai_model_used?.toLowerCase().includes("mock");

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSendInvite = async (message: string) => {
    if (!inviteTarget) return;
    try {
      await sendInvitation({
        candidate_id: inviteTarget.candidate_id,
        employer_id: shortlist.employer_id,
        job_id: shortlist.job_id,
        ai_shortlist_snapshot_id: inviteTarget.id,
        message,
        job_title: (shortlist as any).job_title || "Oferta",
        company_name: (shortlist as any).company_name || "Firma",
      });
    } catch (e: any) {
      toast.error(`Błąd: ${e?.message || "nie udało się wysłać"}`);
    }
  };

  const downloadCV = (snap: ShortlistSnapshot) => {
    void toast; // keep import
    void downloadCandidateProfilePdf(snap.candidate_id);
  };

  return (
    <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-400" />
          <div>
            <h3 className="font-display text-base font-bold text-foreground">
              Shortlista AI — Top 5 kandydatów
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Ukończono {shortlist.completed_at ? new Date(shortlist.completed_at).toLocaleString("pl-PL") : "—"} • Model: {shortlist.ai_model_used || "—"}
            </p>
          </div>
        </div>
      </div>

      {isMock && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>Tryb demo — wyniki wygenerowane losowo. W wersji produkcyjnej AI analizuje profile kandydatów.</span>
        </div>
      )}

      <div className="space-y-2">
        {snapshots.map((snap) => {
          const style = RANK_STYLES[snap.rank];
          const isOpen = expanded.has(snap.id);
          return (
            <div key={snap.id} className="rounded-xl bg-secondary/40 border border-border p-3">
              <div className="flex items-start gap-3">
                <div
                  className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg ${
                    style ? `bg-gradient-to-br ${style.bg}` : "bg-muted"
                  }`}
                  title={`Rank ${snap.rank}`}
                >
                  {style?.label || `#${snap.rank}`}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {snap.snapshot_full_name || "Kandydat"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {snap.snapshot_job_title || "—"} {snap.snapshot_level ? `· ${snap.snapshot_level}` : ""}
                      </p>
                    </div>
                    <div className="px-2 py-1 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold">
                      {snap.shortlist_score}%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-[11px] text-muted-foreground">
                    {snap.snapshot_location && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{snap.snapshot_location}</span>
                    )}
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{(snap.snapshot_experience as any[])?.length || 0} stanowisk</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatSalary(snap.snapshot_salary_min, snap.snapshot_salary_max)}</span>
                  </div>

                  <button
                    onClick={() => toggle(snap.id)}
                    className="mt-2 text-[11px] text-accent hover:underline flex items-center gap-1"
                  >
                    {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Uzasadnienie AI
                  </button>
                  {isOpen && (
                    <p className="mt-1 text-xs text-foreground/90 italic bg-background/50 rounded-lg p-2 border border-border">
                      {snap.ai_justification}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => setInviteTarget(snap)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-accent-foreground hover:opacity-90"
                    >
                      <Mail className="w-3.5 h-3.5" /> Wyślij zaproszenie
                    </button>
                    <button
                      onClick={() => downloadCV(snap)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-muted border border-border"
                    >
                      <Download className="w-3.5 h-3.5" /> Pobierz CV PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {rejectedCount > 0 && (
        <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          Pozostałych <strong className="text-foreground">{rejectedCount}</strong> kandydatów zostało odrzuconych i otrzymało automatyczny feedback.
        </p>
      )}

      {inviteTarget && (
        <ContactInvitationModal
          open={!!inviteTarget}
          candidateName={inviteTarget.snapshot_full_name || "Kandydat"}
          onClose={() => setInviteTarget(null)}
          onSubmit={handleSendInvite}
        />
      )}
    </div>
  );
}
