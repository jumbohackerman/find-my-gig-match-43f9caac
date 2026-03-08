import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Star, RotateCcw, Loader2 } from "lucide-react";
import { SwipeCardSkeleton, EmptyView } from "@/components/StateViews";
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
import { useCandidateApplications } from "@/hooks/useApplications";
import { useJobFeed } from "@/hooks/useJobFeed";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

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
  const { applications: dbApplications, loading: appsLoading, refetch: refetchApps } = useCandidateApplications();
  const { showOnboarding, completeOnboarding, dismissOnboarding } = useOnboarding();
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
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="px-6 pt-4 flex gap-1">
          {["Przeglądaj", "Moje aplikacje", "Zapisane"].map((l) => (
            <div key={l} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium opacity-50">{l}</div>
          ))}
        </div>
        <main className="flex-1 flex flex-col items-center px-4 py-4 max-w-md mx-auto w-full">
          <SwipeCardSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-y-clip">


      <Navbar />

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-1" role="tablist" aria-label="Sekcje przeglądania">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => changeTab(tab.key)}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`panel-${tab.key}`}
            className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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

      <main className={`flex-1 flex flex-col items-center px-4 py-4 max-w-md mx-auto w-full min-h-0 ${activeTab === "swipe" ? "overflow-y-clip" : "overflow-y-auto"}`}>
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
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-4xl">
              🎉
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Wszystko przejrzane!</h2>
            <p className="text-muted-foreground text-sm mb-2">
              Przejrzano {filteredJobs.length} ofert, zapisano {savedJobs.length}.
            </p>
            <div className="flex gap-3 mt-6 justify-center">
              <button
                onClick={resetFeed}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Zacznij od nowa
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <JobFilters filters={filters} onChange={updateFilters} />

            {filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">Brak ofert pasujących do filtrów.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center min-h-0 w-full">
                {/* Card stack — overflow-visible allows exit animation to fly beyond container */}
                <div className="relative w-full flex-1 min-h-0 overflow-visible">
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

                {/* Action buttons — dedicated fixed-height row, never overlapped */}
                <div className="relative z-10 flex items-center gap-5 shrink-0 py-3" role="group" aria-label="Akcje swipe">
                  <button
                    onClick={() => handleSwipeWithRefetch("left")}
                    disabled={actionPending}
                    className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    title="Pomiń"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => handleSwipeWithRefetch("save")}
                    disabled={actionPending}
                    className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-yellow-400 hover:border-yellow-400 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    title="Zapisz na później"
                  >
                    <Star className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleSwipeWithRefetch("right")}
                    disabled={actionPending}
                    className="w-16 h-16 rounded-full btn-gradient flex items-center justify-center text-primary-foreground shadow-glow hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                    title="Aplikuj"
                  >
                    {actionPending ? <Loader2 className="w-7 h-7 animate-spin" /> : <Check className="w-7 h-7" />}
                  </button>
                </div>

                <p className="text-muted-foreground text-xs shrink-0 pb-1">
                  {currentIndex + 1} / {filteredJobs.length}
                </p>
              </div>
            )}
          </>
        )}
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
