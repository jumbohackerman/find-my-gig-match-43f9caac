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
import { Link } from "react-router-dom";

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
  // Remove all filter keys first
  FILTER_PARAMS.forEach((k) => next.delete(k));
  // Write only non-default values
  if (f.location !== defaultFilters.location) next.set("loc", f.location);
  if (f.type !== defaultFilters.type) next.set("type", f.type);
  if (f.salaryMin > 0) next.set("salary", String(f.salaryMin));
  if (f.remote !== defaultFilters.remote) next.set("remote", f.remote);
  if (f.seniority !== defaultFilters.seniority) next.set("seniority", f.seniority);
  if (f.requiredSkills.length > 0) next.set("skills", f.requiredSkills.join(","));
  return next;
}

const Index = () => {
  useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { candidate } = useCandidateProfile();
  const { applications: dbApplications, loading: appsLoading, refetch: refetchApps } = useCandidateApplications();
  const { showOnboarding, completeOnboarding, dismissOnboarding } = useOnboarding();
  const [hideSuggestion, setHideSuggestion] = useState(false);
  const { recentEntries, trackView, clear: clearRecent, count: recentCount } = useRecentlyViewed();

  const {
    allJobs,
    filteredJobs,
    remainingJobs,
    savedJobs,
    savedJobIds,
    currentIndex,
    isFinished,
    jobsLoading,
    filters,
    matchResults,
    handleSwipe,
    applyFromSaved,
    applyToJob,
    resetFeed,
    updateFilters,
    actionPending,
  } = useJobFeed();

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

  // ── Sync filter changes → URL ─────────────────────────────────────────────
  const handleFiltersChange = useCallback((newFilters: JobFiltersState) => {
    updateFilters(newFilters);
    setSearchParams((prev) => filtersToParams(newFilters, prev), { replace: true });
  }, [updateFilters, setSearchParams]);

  // ── Deep-link: tab ────────────────────────────────────────────────────────
  const tabParam = searchParams.get("tab") as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : "swipe"
  );

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
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [buttonExitDir, setButtonExitDir] = useState<"left" | "right" | null>(null);

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

  // Restore job modal from URL on data load
  useEffect(() => {
    if (jobsLoading || allJobs.length === 0) return;
    const jobId = searchParams.get("job");
    if (jobId && !selectedJob) {
      const found = allJobs.find((j) => j.id === jobId);
      if (found) setSelectedJob(found);
      else {
        // Invalid job id — clean up URL
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("job");
          return next;
        }, { replace: true });
      }
    }
  }, [jobsLoading, allJobs, searchParams, selectedJob, setSearchParams]);

  // Refetch applications after apply (swipe triggers applyToJob inside useJobFeed)
  const handleSwipeWithRefetch = async (direction: "left" | "right" | "save") => {
    // Set exit direction for button-triggered actions before the card unmounts
    if (direction === "left") setButtonExitDir("left");
    else if (direction === "right") setButtonExitDir("right");
    else setButtonExitDir(null); // save keeps default
    await handleSwipe(direction);
    if (direction === "right") refetchApps();
    // Reset after animation completes
    setTimeout(() => setButtonExitDir(null), 400);
  };

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

  if (jobsLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col">
        <Navbar />
        <div className="px-3 sm:px-6 pt-4 flex gap-1">
          {["Przeglądaj", "Moje aplikacje", "Zapisane"].map((l) => (
            <div key={l} className="px-3 sm:px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs sm:text-sm font-medium opacity-50">{l}</div>
          ))}
        </div>
        <main className="flex-1 flex flex-col items-center px-3 sm:px-4 py-4 w-full max-w-lg lg:max-w-xl mx-auto">
          <SwipeCardSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-x-clip overflow-y-hidden safe-bottom">


      <Navbar />

      {/* Tabs */}
      <div className="px-4 sm:px-6 pt-4 flex gap-1 overflow-x-auto scrollbar-none" role="tablist" aria-label="Sekcje przeglądania">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => changeTab(tab.key)}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`panel-${tab.key}`}
            data-testid={`tab-${tab.key}`}
            className={`relative px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary text-primary-foreground"
              }`} aria-label={`${tab.count} elementów`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <main className={`flex-1 flex flex-col items-center px-3 sm:px-4 lg:px-6 py-2 sm:py-4 w-full max-w-lg lg:max-w-xl mx-auto min-h-0 ${activeTab === "swipe" ? "" : "overflow-y-auto"}`}>
        <LocalErrorBoundary label="Panel">
        {activeTab === "applied" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <h2 className="font-display text-lg font-bold text-foreground mb-4">
              Moje aplikacje ({dbApplications.length})
            </h2>
            <ApplicationStatusList
              applications={dbApplications}
              loading={appsLoading}
              onJobClick={(dbJob) => {
                if (!dbJob) return;
                const fullJob = allJobs.find(j => j.title === dbJob.title && j.company === dbJob.company);
                openJobModal(fullJob || dbJob as any);
              }}
            />
          </motion.div>
        ) : activeTab === "saved" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <h2 className="font-display text-lg font-bold text-foreground mb-4">
              Zapisane oferty ({savedJobs.length})
            </h2>
            <SavedList jobs={savedJobs} onApply={handleSavedApply} onJobClick={openJobModal} />
          </motion.div>
        ) : activeTab === "recent" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <h2 className="font-display text-lg font-bold text-foreground mb-4">
              Ostatnio przeglądane ({recentCount})
            </h2>
            <RecentlyViewedList entries={recentEntries} onJobClick={openJobModal} onClear={clearRecent} />
          </motion.div>
        ) : isFinished ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center w-full max-w-xs mx-auto">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-4xl">
              🎉
            </div>
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
              <button
                onClick={resetFeed}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-[1.02] transition-transform"
              >
                <RotateCcw className="w-4 h-4" /> Zacznij od nowa
              </button>
              {hasActiveFilters && (
                <button
                  onClick={() => { handleFiltersChange({ ...defaultFilters }); }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Zmień filtry
                </button>
              )}
              {savedJobs.length > 0 && (
                <button
                  onClick={() => changeTab("saved")}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Bookmark className="w-4 h-4" /> Przeglądaj zapisane ({savedJobs.length})
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <>
            <JobFilters filters={filters} onChange={handleFiltersChange} />

            {filteredJobs.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12 w-full max-w-xs mx-auto">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-3xl">
                  🔍
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-1">Brak pasujących ofert</h3>
                <p className="text-muted-foreground text-sm mb-5">Spróbuj zmienić kryteria wyszukiwania.</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleFiltersChange({ ...defaultFilters })}
                    className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-[1.02] transition-transform"
                  >
                    <Filter className="w-4 h-4" /> Wyczyść filtry
                  </button>
                  {savedJobs.length > 0 && (
                    <button
                      onClick={() => changeTab("saved")}
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
                    >
                      <Bookmark className="w-4 h-4" /> Zapisane oferty ({savedJobs.length})
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center min-h-0 w-full">
                {/* Contextual Suggestion UX */}
                {!hideSuggestion && (!candidate.cvUrl || savedJobs.length > 0) && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="w-full mb-3 flex items-center justify-between p-3 rounded-xl bg-secondary/60 border border-border">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-medium text-foreground">
                        {!candidate.cvUrl 
                          ? "Zwiększ szanse na odpowiedź. Dodaj CV do profilu." 
                          : `Masz ${savedJobs.length} zapisan${savedJobs.length === 1 ? "ą" : savedJobs.length > 1 && savedJobs.length < 5 ? "e" : "ych"} ofert${savedJobs.length === 1 ? "ę" : "y"}. Zobacz je!`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!candidate.cvUrl ? (
                        <Link to="/profile" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground">Dodaj CV</Link>
                      ) : (
                        <button onClick={() => changeTab("saved")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground">Przejdź</button>
                      )}
                      <button onClick={() => setHideSuggestion(true)} className="p-1 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  </motion.div>
                )}

                {/* Card stack */}
                <div className="relative w-full flex-1 min-h-0 overflow-hidden">
                  <AnimatePresence>
                    {remainingJobs.slice(0, 2).map((job, i) => (
                      <SwipeCard
                        key={job.id}
                        job={job}
                        onSwipe={(dir) => {
                          handleSwipeWithRefetch(dir);
                        }}
                        isTop={i === 0}
                        matchResult={matchResults[job.id]}
                        isSaved={savedJobIds.has(job.id)}
                        onTap={() => openJobModal(job)}
                        forcedExitDirection={i === 0 ? buttonExitDir : null}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Action buttons — below card, never overlapping */}
                <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-5 shrink-0 py-2 sm:py-3" role="group" aria-label="Akcje swipe">
                  <button
                    onClick={() => handleSwipeWithRefetch("left")}
                    disabled={actionPending}
                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    title="Pomiń"
                    data-testid="swipe-skip"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  <button
                    onClick={() => handleSwipeWithRefetch("save")}
                    disabled={actionPending}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-yellow-400 hover:border-yellow-400 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    title="Zapisz na później"
                    data-testid="swipe-save"
                  >
                    <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => handleSwipeWithRefetch("right")}
                    disabled={actionPending}
                    className="w-13 h-13 sm:w-16 sm:h-16 rounded-full btn-gradient flex items-center justify-center text-primary-foreground shadow-glow hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                    title="Aplikuj"
                    data-testid="swipe-apply"
                  >
                    {actionPending ? <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" /> : <Check className="w-6 h-6 sm:w-7 sm:h-7" />}
                  </button>
                </div>

                <p className="text-muted-foreground text-[10px] sm:text-xs shrink-0 pb-0.5">
                  {currentIndex + 1} / {filteredJobs.length}
                </p>
              </div>
            )}
          </>
        )}
        </LocalErrorBoundary>
      </main>

      <OnboardingModal
        open={showOnboarding}
        onComplete={completeOnboarding}
        onClose={dismissOnboarding}
      />

      <JobDetailModal
        job={selectedJob}
        matchResult={selectedJob ? matchResults[selectedJob.id] : undefined}
        onClose={closeJobModal}
        onApply={(job) => {
          applyToJob(job);
          refetchApps();
        }}
      />
      <Footer />
    </div>
  );
};

export default Index;
