/**
 * AIShortlistSection — wires Block 5 into the expanded job panel.
 * Two states:
 *  - No shortlist yet → "Generuj Shortlistę AI" + limited candidate list
 *  - Shortlist completed → results view (top 5 ranked)
 */
import { useAIShortlist } from "@/hooks/useAIShortlist";
import AIShortlistButton from "./AIShortlistButton";
import AIShortlistResults from "./AIShortlistResults";
import LimitedCandidateCard from "./LimitedCandidateCard";
import EmptyState from "./EmptyState";
import { Loader2, AlertTriangle } from "lucide-react";
import type { EnrichedEmployerApplication } from "@/domain/models";

interface Props {
  jobId: string;
  jobApps: EnrichedEmployerApplication[];
}

export default function AIShortlistSection({ jobId, jobApps }: Props) {
  const { shortlist, snapshots, loading, running, run } = useAIShortlist(jobId);

  if (loading) {
    return (
      <div className="px-4 pb-4 border-t border-border pt-3 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (shortlist && shortlist.status === "completed") {
    return (
      <AIShortlistResults
        shortlist={shortlist}
        snapshots={snapshots}
        totalApplied={shortlist.total_candidates_analyzed ?? jobApps.length}
      />
    );
  }

  const appliedCount = jobApps.filter((a) => a.status === "applied").length;

  return (
    <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
      <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-xs text-amber-200">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-100">Tryb testowy (mock)</p>
          <p>
            Shortlista AI działa obecnie w trybie demonstracyjnym — wyniki są generowane losowo i nie powinny być używane jako finalna decyzja rekrutacyjna. Statusy aplikacji kandydatów nie są zmieniane, a żadne wiadomości nie są wysyłane.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-display text-sm font-bold text-foreground">Kandydaci ({jobApps.length})</h3>
          <p className="text-[11px] text-muted-foreground">
            Pełne profile odblokujesz po wygenerowaniu shortlisty AI (demo).
          </p>
        </div>
        <AIShortlistButton applicationsCount={appliedCount} running={running} onRun={run} />
      </div>

      {jobApps.length === 0 ? (
        <EmptyState
          title="Brak aplikacji"
          description="Ogłoszenie jest aktywne, ale nikt jeszcze nie zaaplikował."
        />
      ) : (
        <div className="space-y-2">
          {jobApps.map((app) => (
            <LimitedCandidateCard key={app.id} app={app} />
          ))}
        </div>
      )}

      {shortlist?.status === "processing" && (
        <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-3 text-xs text-orange-300 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Shortlista AI jest przetwarzana…
        </div>
      )}
      {shortlist?.status === "failed" && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
          Shortlista nie powiodła się — skontaktuj się z supportem.
        </div>
      )}
    </div>
  );
}
