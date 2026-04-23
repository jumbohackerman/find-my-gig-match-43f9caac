import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Star, RotateCcw, Loader2, SlidersHorizontal, Bookmark, Filter } from "lucide-react";
import { SwipeCardSkeleton, EmptyView } from "@/components/StateViews";
import LocalErrorBoundary from "@/components/LocalErrorBoundary";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SwipeCard from "@/components/SwipeCard";
import SavedList from "@/components/SavedList";
import ApplicationStatusList from "@/components/ApplicationStatusList";
import RecentlyViewedList from "@/components/RecentlyViewedList";
import JobFilters from "@/components/JobFilters";
import { defaultFilters, type JobFiltersState } from "@/components/JobFilters";
import OnboardingModal from "@/components/OnboardingModal";
import JobDetailModal from "@/components/JobDetailModal";
import type { Job } from "@/domain/models";
import { useAuth } from "@/hooks/useAuth";
import { useCandidateProfile } from "@/hooks/useCandidateProfile";
import { useCandidateApplications } from "@/hooks/useApplications";
import { useJobFeed } from "@/hooks/useJobFeed";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Tab = "swipe" | "applied" | "saved" | "recent";
const VALID_TABS: Tab[] = ["swipe", "applied", "saved", "recent"];

// ── Filter ↔ URL helpers ────────────────────────────────────────────────────

const FILTER_PARAMS = ["loc", "type", "salary", "remote", "seniority", "skills"] as const;

function filtersFromParams(sp: URLSearchParams): Partial<JobFiltersState> {
  const f: Partial<JobFiltersState> = {};
  const loc = sp.get("loc");
  if (loc) f.location = loc;
  const type = sp.get("type");
  if (type) f.type = type;
  const salary = sp.get("salary");
  if (salary && !isNaN(Number(salary))) f.salaryMin = Number(salary);
  const remote = sp.get("remote");
  if (remote) f.remote = remote;
  const seniority = sp.get("seniority");
  if (seniority) f.seniority = seniority;
  const skills = sp.get("skills");
  if (skills) f.requiredSkills = skills.split(",").filter(Boolean);
  return f;
}

function filtersToParams(f: JobFiltersState, sp: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(sp);
  FILTER_PARAMS.forEach((k) => next.delete(k));
  if (f.location !== defaultFilters.location) next.set("loc", f.location);
  if (f.type !== defaultFilters.type) next.set("type", f.type);
  if (f.salaryMin > 0) next.set("salary", String(f.salaryMin));
  if (f.remote !== defaultFilters.remote) next.set("remote", f.remote);
  if (f.seniority !== defaultFilters.seniority) next.set("seniority", f.seniority);
  if (f.requiredSkills.length > 0) next.set("skills", f.requiredSkills.join(","));
  return next;
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isGuest = !user;
  const [searchParams, setSearchParams] = useSearchParams();
  const { candidate } = useCandidateProfile();
  const { applications: dbApplications, loading: appsLoading, refetch: refetchApps } = useCandidateApplications();
  const { showOnboarding, completeOnboarding, dismissOnboarding } = useOnboarding();
  const [hideSuggestion, setHideSuggestion] = useState(false);
  const { recentEntries, trackView, clear: clearRecent, count: recentCount } = useRecentlyViewed();

  const {
    allJobs, filteredJobs, remainingJobs, savedJobs, savedJobIds,
    currentIndex, isFinished, jobsLoading, filters, matchResults,
    handleSwipe, applyFromSaved, applyToJob, resetFeed, updateFilters, actionPending,
  } = useJobFeed();

  // ── Deep-link: tab ────────────────────────────────────────────────────────
  const tabParam = searchParams.get("tab") as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : "swipe"
  );
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [buttonExitDir, setButtonExitDir] = useState<"left" | "right" | null>(null);

  const requireAuth = useCallback((): boolean => {
    if (isGuest) {
      toast.info("Zaloguj się, aby znaleźć wymarzoną pracę", {
        action: { label: "Zaloguj się", onClick: () => navigate("/auth") },
        duration: 4000,
      });
      return false;
    }
    return true;
  }, [isGuest, navigate]);

  const handleSwipeWithRefetch = useCallback(async (direction: "left" | "right" | "save") => {
    if (!requireAuth()) return;
    // Track current top card as "viewed" — every swipe (left/right/save) counts.
    const currentJob = filteredJobs[currentIndex];
    if (currentJob) trackView(currentJob);
    if (direction === "left") setButtonExitDir("left");
    else if (direction === "right") setButtonExitDir("right");
    else setButtonExitDir(null);
    await handleSwipe(direction);
    if (direction === "right") refetchApps();
    setTimeout(() => setButtonExitDir(null), 650);
  }, [handleSwipe, refetchApps, requireAuth, filteredJobs, currentIndex, trackView]);

  // ── Keyboard arrow controls ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only when on swipe tab, not finished, no modal open, and not in an input
      if (activeTab !== "swipe" || isFinished || selectedJob) return;
      if (actionPending) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleSwipeWithRefetch("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleSwipeWithRefetch("right");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, isFinished, selectedJob, actionPending, handleSwipeWithRefetch]);

  const hasActiveFilters =
    filters.location !== defaultFilters.location ||
    filters.type !== defaultFilters.type ||
    filters.salaryMin > 0 ||
    filters.remote !== defaultFilters.remote ||
    filters.seniority !== defaultFilters.seniority ||
    filters.requiredSkills.length > 0;

  // ── Restore filters from URL on mount ─────────────────────────────────────
  const initializedFilters = useRef(false);
  useEffect(() => {
    if (initializedFilters.current) return;
    initializedFilters.current = true;
    const urlFilters = filtersFromParams(searchParams);
    if (Object.keys(urlFilters).length > 0) {
      updateFilters({ ...defaultFilters, ...urlFilters });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltersChange = useCallback((newFilters: JobFiltersState) => {
    updateFilters(newFilters);
    setSearchParams((prev) => filtersToParams(newFilters, prev), { replace: true });
  }, [updateFilters, setSearchParams]);

  const changeTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === "swipe") next.delete("tab");
      else next.set("tab", tab);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // ── Deep-link: job detail modal ───────────────────────────────────────────
  const openJobModal = useCallback((job: Job | null) => {
    setSelectedJob(job);
    if (job) trackView(job);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (job) next.set("job", job.id);
      else next.delete("job");
      return next;
    }, { replace: true });
  }, [setSearchParams, trackView]);

  const closeJobModal = useCallback(() => openJobModal(null), [openJobModal]);

  useEffect(() => {
    if (jobsLoading || allJobs.length === 0) return;
    const jobId = searchParams.get("job");
    if (jobId && !selectedJob) {
      const found = allJobs.find((j) => j.id === jobId);
      if (found) setSelectedJob(found);
      else {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("job");
          return next;
        }, { replace: true });
      }
    }
  }, [jobsLoading, allJobs, searchParams, selectedJob, setSearchParams]);

  const handleSavedApply = async (job: Job) => {
    await applyFromSaved(job);
    refetchApps();
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "swipe", label: "Przeglądaj" },
    { key: "applied", label: "Moje aplikacje", count: dbApplications.length },
    { key: "saved", label: "Zapisane", count: savedJobs.length },
    { key: "recent", label: "Ostatnie", count: recentCount > 0 ? recentCount : undefined },
  ];

  // ── Guest landing: simplified public view, no private tabs ────────────────
  if (isGuest) {
    const demoJob = allJobs[0];
    return (
      <div className="min-h-screen-dynamic bg-background flex flex-col safe-bottom">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full"
          >
            <div className="w-20 h-20 rounded-2xl btn-gradient flex items-center justify-center mx-auto mb-5 shadow-glow text-4xl">
              💼
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3 leading-tight">
              Znajdź pracę swipując
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base mb-8 leading-relaxed">
              JobSwipe dopasowuje oferty do Twojego profilu. Zaloguj się, aby zobaczyć spersonalizowane dopasowania, zapisywać oferty i śledzić swoje aplikacje.
            </p>

            {demoJob && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="card-gradient rounded-2xl border border-border p-4 mb-6 text-left relative overflow-hidden"
              >
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-secondary text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Podgląd
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0 overflow-hidden">
                    {demoJob.logo && /^https?:\/\//.test(demoJob.logo) ? (
                      <img src={demoJob.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{demoJob.logo || "💼"}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{demoJob.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{demoJob.company} · {demoJob.location}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{demoJob.summary || demoJob.description}</p>
                <div className="flex flex-wrap gap-1">
                  {demoJob.tags.slice(0, 3).map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground">{t}</span>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate("/auth")}
                className="w-full px-5 py-3 rounded-xl btn-gradient text-primary-foreground text-sm font-semibold shadow-glow hover:scale-[1.02] transition-transform"
              >
                Zaloguj się / Zarejestruj
              </button>
              <p className="text-[11px] text-muted-foreground mt-1">
                Bezpłatnie · Tylko zweryfikowani pracodawcy
              </p>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  if (jobsLoading) {
    return (
      <div className="min-h-screen-dynamic bg-background flex flex-col">
        <Navbar />
        <div className="shrink-0 px-4 sm:px-6 pt-3 pb-1">
          <div className="browse-shell overflow-x-auto scrollbar-none">
            <div className="flex min-w-max gap-1">
              {["Przeglądaj", "Moje aplikacje", "Zapisane"].map((label) => (
                <div key={label} className="px-3 sm:px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs sm:text-sm font-medium opacity-50">
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
        <main className="flex-1 px-4 sm:px-6 py-4">
          <div className="browse-shell flex h-full min-h-0 items-center justify-center">
            <div className="browse-column w-full">
              <SwipeCardSkeleton />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col safe-bottom overflow-hidden">
      <Navbar />

      <div className="shrink-0 px-4 sm:px-6 pt-3 pb-1">
        <div className="browse-shell overflow-x-auto scrollbar-none" role="tablist" aria-label="Sekcje przeglądania">
          <div className="flex min-w-max gap-1 p-1 rounded-2xl glass-surface shadow-soft w-fit mx-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => changeTab(tab.key)}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`panel-${tab.key}`}
                data-testid={`tab-${tab.key}`}
                className={`relative px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  activeTab === tab.key
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {activeTab === tab.key && (
                  <motion.span
                    layoutId="active-tab-pill"
                    className="absolute inset-0 btn-gradient rounded-xl shadow-glow"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10 inline-flex items-center">
                  {tab.label}
                  {tab.count != null && tab.count > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activeTab === tab.key ? "bg-primary-foreground/25 text-primary-foreground" : "bg-primary/15 text-primary"
                    }`} aria-label={`${tab.count} elementów`}>
                      {tab.count}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 min-h-0 w-full px-4 sm:px-6 pb-2 pt-2 sm:pt-3 flex flex-col">
        <div className={`browse-shell flex-1 min-h-0 ${activeTab === "swipe" ? "flex flex-col" : "overflow-y-auto overflow-x-hidden"}`}>
          <LocalErrorBoundary label="Panel">
            {activeTab === "applied" ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full" id="panel-applied">
                <h2 className="font-display text-lg font-bold text-foreground mb-4">
                  Moje aplikacje ({dbApplications.length})
                </h2>
                <ApplicationStatusList
                  applications={dbApplications}
                  loading={appsLoading}
                  onJobClick={(dbJob) => {
                    if (!dbJob) return;
                    const fullJob = allJobs.find((job) => job.title === dbJob.title && job.company === dbJob.company);
                    openJobModal(fullJob || dbJob as any);
                  }}
                />
              </motion.div>
            ) : activeTab === "saved" ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full" id="panel-saved">
                <h2 className="font-display text-lg font-bold text-foreground mb-4">
                  Zapisane oferty ({savedJobs.length})
                </h2>
                <SavedList jobs={savedJobs} onApply={handleSavedApply} onJobClick={openJobModal} />
              </motion.div>
            ) : activeTab === "recent" ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full" id="panel-recent">
                <h2 className="font-display text-lg font-bold text-foreground mb-4">
                  Ostatnio przeglądane ({recentCount})
                </h2>
                <RecentlyViewedList entries={recentEntries} onJobClick={openJobModal} onClear={clearRecent} />
              </motion.div>
            ) : isFinished ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="browse-column text-center py-8" id="panel-swipe">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-4xl">🎉</div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">Wszystko przejrzane!</h2>
                <p className="text-muted-foreground text-sm mb-1">
                  Przejrzano {filteredJobs.length} ofert{filteredJobs.length === 1 ? "ę" : ""}.
                </p>
                {(savedJobs.length > 0 || dbApplications.length > 0) && (
                  <p className="text-muted-foreground text-xs mb-4">
                    {savedJobs.length > 0 && `${savedJobs.length} zapisanych`}
                    {savedJobs.length > 0 && dbApplications.length > 0 && " · "}
                    {dbApplications.length > 0 && `${dbApplications.length} aplikacji`}
                  </p>
                )}
                <div className="flex flex-col gap-2 mt-5">
                  <button onClick={resetFeed} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-[1.02] transition-transform">
                    <RotateCcw className="w-4 h-4" /> Zacznij od nowa
                  </button>
                  {hasActiveFilters && (
                    <button onClick={() => handleFiltersChange({ ...defaultFilters })} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
                      <SlidersHorizontal className="w-4 h-4" /> Zmień filtry
                    </button>
                  )}
                  {savedJobs.length > 0 && (
                    <button onClick={() => changeTab("saved")} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
                      <Bookmark className="w-4 h-4" /> Przeglądaj zapisane ({savedJobs.length})
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="browse-column flex flex-1 min-h-0 flex-col gap-2 pb-1" id="panel-swipe">
                <div className="shrink-0 flex items-center gap-2">
                  <div className="shrink-0">
                    <JobFilters filters={filters} onChange={handleFiltersChange} />
                  </div>
                  {!hideSuggestion && (!candidate.cvUrl || savedJobs.length > 0) && (
                    <div className="flex-1 min-w-0 flex items-center gap-2 rounded-lg bg-secondary/60 border border-border px-3 py-1.5">
                      <p className="text-[11px] font-medium text-foreground truncate">
                        {!candidate.cvUrl
                          ? "Dodaj CV do profilu"
                          : `${savedJobs.length} zapisanych ofert`}
                      </p>
                      {!candidate.cvUrl ? (
                        <Link to="/my-profile" className="px-2 py-1 rounded-md text-[11px] font-medium bg-primary text-primary-foreground whitespace-nowrap shrink-0">Dodaj CV</Link>
                      ) : (
                        <button onClick={() => changeTab("saved")} className="px-2 py-1 rounded-md text-[11px] font-medium bg-primary text-primary-foreground whitespace-nowrap shrink-0">Zobacz</button>
                      )}
                      <button onClick={() => setHideSuggestion(true)} className="p-0.5 rounded text-muted-foreground hover:bg-secondary transition-colors shrink-0" aria-label="Zamknij podpowiedź">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {filteredJobs.length === 0 ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12 w-full max-w-xs mx-auto">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-3xl">🔍</div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-1">Brak pasujących ofert</h3>
                    <p className="text-muted-foreground text-sm mb-5">Spróbuj zmienić kryteria wyszukiwania.</p>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => handleFiltersChange({ ...defaultFilters })} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-[1.02] transition-transform">
                        <Filter className="w-4 h-4" /> Wyczyść filtry
                      </button>
                      {savedJobs.length > 0 && (
                        <button onClick={() => changeTab("saved")} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
                          <Bookmark className="w-4 h-4" /> Zobacz zapisane ({savedJobs.length})
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <div className="browse-card-stage">
                      <div className="browse-card-frame">
                        <AnimatePresence initial={false}>
                          {remainingJobs.slice(0, 2).map((job, index) => (
                            <SwipeCard
                              key={job.id}
                              job={job}
                              onSwipe={handleSwipeWithRefetch}
                              isTop={index === 0}
                              matchResult={matchResults[job.id]}
                              isSaved={savedJobIds.has(job.id)}
                              onTap={() => openJobModal(job)}
                              forcedExitDirection={index === 0 ? buttonExitDir : null}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="shrink-0 w-full">
                      <div className="flex items-center justify-center gap-4 sm:gap-5 pt-1" role="group" aria-label="Akcje swipe">
                        <motion.button
                          whileHover={{ scale: 1.08, rotate: -6 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => handleSwipeWithRefetch("left")}
                          disabled={actionPending}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full glass-surface border border-border/60 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/60 hover:shadow-[0_0_24px_-4px_hsl(var(--destructive)/0.5)] transition-all disabled:opacity-40 disabled:pointer-events-none"
                          title="Pomiń"
                          data-testid="swipe-skip"
                        >
                          <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1, y: -2 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => handleSwipeWithRefetch("save")}
                          disabled={actionPending}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full glass-surface border border-border/60 flex items-center justify-center text-muted-foreground hover:text-yellow-400 hover:border-yellow-400/60 hover:shadow-[0_0_20px_-4px_hsl(48_95%_55%/0.5)] transition-all disabled:opacity-40 disabled:pointer-events-none"
                          title="Zapisz na później"
                          data-testid="swipe-save"
                        >
                          <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.12, rotate: 6 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => handleSwipeWithRefetch("right")}
                          disabled={actionPending}
                          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full btn-gradient flex items-center justify-center text-primary-foreground shadow-glow animate-glow-pulse disabled:opacity-50"
                          title="Aplikuj"
                          data-testid="swipe-apply"
                        >
                          <span className="absolute inset-0 rounded-full ring-2 ring-primary/30 ring-offset-2 ring-offset-background/20" />
                          {actionPending ? <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin relative z-10" /> : <Check className="w-6 h-6 sm:w-7 sm:h-7 relative z-10" />}
                        </motion.button>
                      </div>
                      <p className="text-center text-muted-foreground text-[10px] sm:text-xs pt-2.5 tracking-wide">
                        <span className="text-foreground/80 font-semibold">{currentIndex + 1}</span>
                        <span className="opacity-50"> / {filteredJobs.length}</span>
                        <span className="hidden sm:inline ml-3 opacity-50">← → klawisze strzałek</span>
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </LocalErrorBoundary>
        </div>
      </main>

      {/* Onboarding modal temporarily disabled */}
      {/* <OnboardingModal open={showOnboarding} onComplete={completeOnboarding} onClose={dismissOnboarding} /> */}
      <JobDetailModal
        job={selectedJob}
        matchResult={selectedJob ? matchResults[selectedJob.id] : undefined}
        onClose={closeJobModal}
        onApply={(job) => { handleSwipeWithRefetch("right"); }}
      />
      <Footer />
    </div>
  );
};

export default Index;
