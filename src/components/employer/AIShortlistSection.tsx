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
import { Loader2 } from "lucide-react";
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-display text-sm font-bold text-foreground">Kandydaci ({jobApps.length})</h3>
          <p className="text-[11px] text-muted-foreground">
            Pełne profile odblokujesz po wygenerowaniu shortlisty AI.
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
          Shortlista nie powiodła się: {shortlist as any} — skontaktuj się z supportem.
        </div>
      )}
    </div>
  );
}
