/**
 * MarketResearchPanel — employer-side READ-ONLY browsing of other companies' public jobs.
 *
 * - Classic listing UI (cards + detail modal). NOT a swipe feed.
 * - Strictly excludes the requester's own jobs.
 * - No edit / hide / delete / shortlist / candidate / messaging actions.
 * - Uses ONLY the publicJobListings provider (narrow public projection).
 */

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Briefcase, Clock, Building2, X, Tag, Loader2, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  usePublicJobListings,
  usePublicJobListingDetail,
  type PublicJobListingFilters,
} from "@/hooks/usePublicJobListings";
import { timeAgo } from "@/lib/timeAgo";
import EmptyState from "@/components/employer/EmptyState";

const PAGE_SIZE = 24;

const SelectInput = ({
  value, onChange, options, ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) => (
  <select
    aria-label={ariaLabel}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{ padding: "4px 24px 4px 10px", fontSize: 12, height: 32 }}
    className="rounded-md bg-secondary border border-border text-foreground max-w-[180px] truncate focus:outline-none focus:ring-1 focus:ring-primary"
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

export default function MarketResearchPanel() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [seniority, setSeniority] = useState("");
  const [sort, setSort] = useState<"newest" | "salary_desc" | "salary_asc">("newest");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters: PublicJobListingFilters = useMemo(
    () => ({
      search: search || undefined,
      location: location || undefined,
      workMode: workMode || undefined,
      employmentType: employmentType || undefined,
      seniority: seniority || undefined,
      sort,
      excludeEmployerId: user?.id,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [search, location, workMode, employmentType, seniority, sort, user?.id, page],
  );

  const { items, loading, error, refetch } = usePublicJobListings(filters);
  const { detail, loading: detailLoading } = usePublicJobListingDetail(selectedId, user?.id);

  const resetFilters = () => {
    setSearch(""); setLocation(""); setWorkMode(""); setEmploymentType(""); setSeniority("");
    setSort("newest"); setPage(0);
  };

  const hasActiveFilters =
    !!search || !!location || !!workMode || !!employmentType || !!seniority || sort !== "newest";

  return (
    <section className="mb-6" aria-label="Przegląd rynku — publiczne oferty innych pracodawców">
      {/* Header — clearly separated from "Moje ogłoszenia" */}
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <h3 className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-accent" />
            Przegląd rynku
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Tylko do researchu — publiczne oferty innych pracodawców. Bez akcji administracyjnych.
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground/70 px-2 py-1 rounded-md bg-secondary/50 border border-border whitespace-nowrap">
          read-only
        </span>
      </div>

      {/* Filter bar */}
      <div className="space-y-2 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Szukaj po stanowisku, firmie, opisie…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Lokalizacja"
              value={location}
              onChange={(e) => { setLocation(e.target.value); setPage(0); }}
              style={{ height: 32, padding: "4px 10px 4px 28px", fontSize: 12 }}
              className="rounded-md bg-secondary border border-border text-foreground max-w-[180px] focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <SelectInput
            ariaLabel="Tryb pracy"
            value={workMode}
            onChange={(v) => { setWorkMode(v); setPage(0); }}
            options={[
              { value: "", label: "Tryb: wszystkie" },
              { value: "Remote", label: "Zdalna" },
              { value: "Hybrid", label: "Hybryda" },
              { value: "On-site", label: "Stacjonarna" },
            ]}
          />
          <SelectInput
            ariaLabel="Forma zatrudnienia"
            value={employmentType}
            onChange={(v) => { setEmploymentType(v); setPage(0); }}
            options={[
              { value: "", label: "Forma: wszystkie" },
              { value: "Full-time", label: "Pełny etat" },
              { value: "Part-time", label: "Część etatu" },
              { value: "Contract", label: "Kontrakt B2B" },
              { value: "Internship", label: "Staż" },
            ]}
          />
          <SelectInput
            ariaLabel="Seniority"
            value={seniority}
            onChange={(v) => { setSeniority(v); setPage(0); }}
            options={[
              { value: "", label: "Poziom: wszystkie" },
              { value: "Junior", label: "Junior" },
              { value: "Mid", label: "Mid" },
              { value: "Senior", label: "Senior" },
              { value: "Lead", label: "Lead" },
            ]}
          />
          <SelectInput
            ariaLabel="Sortowanie"
            value={sort}
            onChange={(v) => { setSort(v as any); setPage(0); }}
            options={[
              { value: "newest", label: "Sortuj: najnowsze" },
              { value: "salary_desc", label: "Stawka: malejąco" },
              { value: "salary_asc", label: "Stawka: rosnąco" },
            ]}
          />

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              Wyczyść filtry
            </button>
          )}
        </div>
      </div>

      {/* Listing */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-gradient rounded-xl border border-border p-4 space-y-2 animate-pulse">
              <div className="h-4 w-2/3 rounded bg-secondary" />
              <div className="h-3 w-1/2 rounded bg-secondary" />
              <div className="h-3 w-3/4 rounded bg-secondary" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card-gradient rounded-xl border border-destructive/30 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-foreground font-medium">Nie udało się pobrać ofert</p>
            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
            <button
              onClick={refetch}
              className="mt-2 text-xs px-2 py-1 rounded-md bg-secondary border border-border hover:bg-muted"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Brak ofert do wyświetlenia"
          description={
            hasActiveFilters
              ? "Żadna publiczna oferta nie pasuje do filtrów. Spróbuj je zmienić."
              : "Aktualnie nie ma żadnych publicznych ofert innych pracodawców."
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((job) => (
              <motion.button
                key={job.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedId(job.id)}
                className="text-left card-gradient rounded-xl border border-border p-4 hover:border-primary/40 hover-lift transition-colors group"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0 overflow-hidden">
                    {job.logo?.startsWith("http") ? (
                      <img src={job.logo} alt={job.company} className="w-full h-full object-contain" />
                    ) : (
                      <span>{job.logo}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {job.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {job.company || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground mb-2">
                  {job.location && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                  )}
                  {job.workMode && (
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.workMode}</span>
                  )}
                  {job.seniority && (
                    <span className="px-1.5 py-0.5 rounded bg-secondary/60 text-foreground/80">{job.seniority}</span>
                  )}
                </div>

                {job.summary && (
                  <p className="text-xs text-muted-foreground/90 line-clamp-2 mb-2">{job.summary}</p>
                )}

                {job.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {job.tags.slice(0, 4).map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/60 text-foreground/70">
                        {t}
                      </span>
                    ))}
                    {job.tags.length > 4 && (
                      <span className="text-[10px] text-muted-foreground/60">+{job.tags.length - 4}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                  <span className="text-xs font-medium text-foreground">
                    {job.salary || (job.salaryFrom > 0 ? `${job.salaryFrom.toLocaleString("pl-PL")}–${job.salaryTo.toLocaleString("pl-PL")} ${job.salaryCurrency}` : "—")}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{timeAgo(job.postedAt)}
                  </span>
                </div>

                <div className="mt-2 text-[11px] text-primary font-medium">Zobacz szczegóły →</div>
              </motion.button>
            ))}
          </div>

          {/* Pagination — simple prev/next */}
          {(page > 0 || items.length === PAGE_SIZE) && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-xs px-3 py-1.5 rounded-md bg-secondary border border-border hover:bg-muted disabled:opacity-40"
              >
                ← Poprzednie
              </button>
              <span className="text-[11px] text-muted-foreground">Strona {page + 1}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={items.length < PAGE_SIZE}
                className="text-xs px-3 py-1.5 rounded-md bg-secondary border border-border hover:bg-muted disabled:opacity-40"
              >
                Następne →
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail modal — portal so it isn't clipped by transformed ancestors */}
      {selectedId && createPortal(
        <AnimatePresence>
          <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm sm:px-4"
            onClick={() => setSelectedId(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Szczegóły publicznej oferty"
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              className="w-full max-w-2xl max-h-[92vh] overflow-y-auto card-gradient sm:rounded-2xl rounded-t-2xl border border-border p-5 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-lg p-1"
                aria-label="Zamknij"
              >
                <X className="w-5 h-5" />
              </button>

              {detailLoading || !detail ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                </div>
              ) : (
                <DetailView detail={detail} />
              )}

              <div className="mt-4 pt-3 border-t border-border text-[10px] text-muted-foreground/70 text-center">
                Widok read-only · publiczne dane oferty · brak akcji administracyjnych
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body,
      )}
    </section>
  );
}

// ── Detail view (read-only) ──────────────────────────────────────────────────

function DetailView({ detail }: { detail: import("@/hooks/usePublicJobListings").PublicJobListingDetail }) {
  return (
    <div>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-2xl shrink-0 overflow-hidden">
          {detail.logo?.startsWith("http") ? (
            <img src={detail.logo} alt={detail.company} className="w-full h-full object-contain" />
          ) : (
            <span>{detail.logo}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold text-foreground">{detail.title}</h3>
          <p className="text-xs text-muted-foreground">
            {detail.company || "—"} · {timeAgo(detail.postedAt)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground mb-3">
        {detail.location && <Chip icon={<MapPin className="w-3 h-3" />}>{detail.location}</Chip>}
        {detail.workMode && <Chip icon={<Briefcase className="w-3 h-3" />}>{detail.workMode}</Chip>}
        {detail.employmentType && <Chip>{detail.employmentType}</Chip>}
        {detail.contractType && <Chip>{detail.contractType}</Chip>}
        {detail.seniority && <Chip>{detail.seniority}</Chip>}
        {detail.experienceLevel && detail.experienceLevel !== detail.seniority && (
          <Chip>{detail.experienceLevel}</Chip>
        )}
      </div>

      {(detail.salary || detail.salaryFrom > 0) && (
        <div className="mb-3 p-2.5 rounded-lg bg-secondary/40 border border-border text-sm">
          <span className="text-muted-foreground text-xs mr-2">Wynagrodzenie:</span>
          <span className="text-foreground font-semibold">
            {detail.salary || `${detail.salaryFrom.toLocaleString("pl-PL")}–${detail.salaryTo.toLocaleString("pl-PL")} ${detail.salaryCurrency}`}
          </span>
        </div>
      )}

      {detail.summary && (
        <Section title="Skrót">
          <p className="text-sm text-foreground/90 whitespace-pre-line">{detail.summary}</p>
        </Section>
      )}

      {detail.aboutRole && (
        <Section title="O roli">
          <p className="text-sm text-foreground/90 whitespace-pre-line">{detail.aboutRole}</p>
        </Section>
      )}

      {detail.responsibilities?.length > 0 && (
        <Section title="Obowiązki">
          <BulletList items={detail.responsibilities} />
        </Section>
      )}

      {detail.requirements?.length > 0 && (
        <Section title="Wymagania">
          <BulletList items={detail.requirements} />
        </Section>
      )}

      {detail.niceToHave?.length > 0 && (
        <Section title="Mile widziane">
          <BulletList items={detail.niceToHave} />
        </Section>
      )}

      {detail.benefits?.length > 0 && (
        <Section title="Benefity">
          <BulletList items={detail.benefits} />
        </Section>
      )}

      {detail.aboutCompany && (
        <Section title="O firmie">
          <p className="text-sm text-foreground/90 whitespace-pre-line">{detail.aboutCompany}</p>
          {detail.teamSize && (
            <p className="text-xs text-muted-foreground mt-1">Wielkość zespołu: {detail.teamSize}</p>
          )}
        </Section>
      )}

      {detail.tags?.length > 0 && (
        <Section title="Tagi / skille">
          <div className="flex flex-wrap gap-1.5">
            {detail.tags.map((t) => (
              <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-secondary/60 text-foreground/80 flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />{t}
              </span>
            ))}
          </div>
        </Section>
      )}

      {!detail.summary && !detail.aboutRole && !detail.description && (
        <p className="text-sm text-muted-foreground italic">Brak szczegółowego opisu.</p>
      )}
    </div>
  );
}

const Chip = ({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) => (
  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-secondary/60 text-foreground/80">
    {icon}{children}
  </span>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-3">
    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{title}</h4>
    {children}
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="text-sm text-foreground/90 space-y-1">
    {items.map((it, i) => (
      <li key={i} className="flex items-start gap-2">
        <span className="text-primary mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
        <span>{it}</span>
      </li>
    ))}
  </ul>
);
