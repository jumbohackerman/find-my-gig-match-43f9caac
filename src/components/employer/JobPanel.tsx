/**
 * JobPanel — expanded view inside an employer job card.
 *
 * Tabs: Aplikacje / Rekomendacje AI / Shortlista / Pipeline
 * + analytics block + filter/sort bar
 *
 * Stays presentational: receives apps + handlers, renders CandidateCard rows.
 */

import { useMemo, useState, type ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Zap, Layers, ArrowRight } from "lucide-react";
import type { EnrichedEmployerApplication } from "@/domain/models";
import type { ShortlistJobBalance } from "@/domain/shortlist";
import EmptyState from "@/components/employer/EmptyState";
import JobAnalyticsBlock from "@/components/employer/JobAnalyticsBlock";
import CandidateFilterBar, {
  DEFAULT_FILTERS,
  applyCandidateFilters,
  type CandidateFilters,
} from "@/components/employer/CandidateFilterBar";

interface Props {
  jobApps: EnrichedEmployerApplication[];
  balance: ShortlistJobBalance;
  /** Render a single candidate row — provided by parent (keeps card logic centralized). */
  renderCandidate: (app: EnrichedEmployerApplication) => ReactNode;
}

const PIPELINE_STATUSES = new Set(["interview", "hired", "not_selected", "position_closed"]);

const JobPanel = ({ jobApps, balance, renderCandidate }: Props) => {
  const [filters, setFilters] = useState<CandidateFilters>(DEFAULT_FILTERS);

  // Bucket apps for tab counts (raw, before filters)
  const buckets = useMemo(() => {
    const applications = jobApps;
    const recommendations = jobApps.filter(
      (a) =>
        (a.matchResult?.score ?? 0) >= 75 &&
        !["shortlisted", "interview", "hired"].includes(a.status),
    );
    const shortlisted = jobApps.filter((a) => a.status === "shortlisted");
    const pipeline = jobApps.filter((a) => PIPELINE_STATUSES.has(a.status));
    return { applications, recommendations, shortlisted, pipeline };
  }, [jobApps]);

  const renderList = (apps: EnrichedEmployerApplication[], emptyTitle: string, emptyDesc: string) => {
    const filtered = applyCandidateFilters(apps, filters);
    if (apps.length === 0) {
      return <EmptyState title={emptyTitle} description={emptyDesc} />;
    }
    return (
      <>
        <CandidateFilterBar
          filters={filters}
          onChange={setFilters}
          total={apps.length}
          visible={filtered.length}
        />
        {filtered.length === 0 ? (
          <EmptyState
            title="Brak wyników"
            description="Zmień filtry lub sortowanie, aby zobaczyć więcej kandydatów."
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((app) => (
              <div key={app.id}>{renderCandidate(app)}</div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
      <JobAnalyticsBlock apps={jobApps} balance={balance} />

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-auto bg-secondary/40">
          <TabsTrigger value="applications" className="flex flex-col gap-0.5 text-[11px] py-1.5">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Aplikacje</span>
            <span className="text-[10px] text-muted-foreground">{buckets.applications.length}</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex flex-col gap-0.5 text-[11px] py-1.5">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Rekom. AI</span>
            <span className="text-[10px] text-muted-foreground">{buckets.recommendations.length}</span>
          </TabsTrigger>
          <TabsTrigger value="shortlist" className="flex flex-col gap-0.5 text-[11px] py-1.5">
            <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> Shortlista</span>
            <span className="text-[10px] text-muted-foreground">
              {buckets.shortlisted.length}{balance.totalSlots > 0 ? `/${balance.totalSlots}` : ""}
            </span>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="flex flex-col gap-0.5 text-[11px] py-1.5">
            <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Pipeline</span>
            <span className="text-[10px] text-muted-foreground">{buckets.pipeline.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          {renderList(
            buckets.applications,
            "Brak aplikacji",
            "Ogłoszenie jest aktywne, ale nikt jeszcze nie zaaplikował.",
          )}
        </TabsContent>

        <TabsContent value="ai">
          {renderList(
            buckets.recommendations,
            "Brak rekomendacji AI",
            "AI nie znalazło jeszcze kandydatów z dopasowaniem ≥ 75% dla tej oferty.",
          )}
        </TabsContent>

        <TabsContent value="shortlist">
          {renderList(
            buckets.shortlisted,
            "Pusta shortlista",
            balance.totalSlots === 0
              ? "Aby shortlistować kandydatów, kup pakiet 5, 10 lub 20 slotów."
              : "Kliknij „Dodaj do shortlisty” przy kandydacie, aby zużyć 1 slot.",
          )}
        </TabsContent>

        <TabsContent value="pipeline">
          {renderList(
            buckets.pipeline,
            "Pusty pipeline",
            "Tu zobaczysz kandydatów z etapami po shortliście (rozmowa, zatrudnienie, niewybrany, zamknięte).",
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobPanel;
