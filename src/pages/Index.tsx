import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Star, RotateCcw, Loader2 } from "lucide-react";
import { SwipeCardSkeleton, EmptyView } from "@/components/StateViews";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SwipeCard from "@/components/SwipeCard";
import SavedList from "@/components/SavedList";
import ApplicationStatusList from "@/components/ApplicationStatusList";
import JobFilters from "@/components/JobFilters";
import OnboardingModal from "@/components/OnboardingModal";
import JobDetailModal from "@/components/JobDetailModal";
import type { Job } from "@/domain/models";
import { useAuth } from "@/hooks/useAuth"; // kept for potential future use
import { useCandidateApplications } from "@/hooks/useApplications";
import { useJobFeed } from "@/hooks/useJobFeed";
import { useOnboarding } from "@/hooks/useOnboarding";

type Tab = "swipe" | "applied" | "saved";

const Index = () => {
  useAuth(); // ensure auth context is available
  const { applications: dbApplications, loading: appsLoading, refetch: refetchApps } = useCandidateApplications();
  const { showOnboarding, completeOnboarding, dismissOnboarding } = useOnboarding();

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
  } = useJobFeed();

  const [activeTab, setActiveTab] = useState<Tab>("swipe");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [buttonExitDir, setButtonExitDir] = useState<"left" | "right" | null>(null);

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
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">


      <Navbar />

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary text-primary-foreground"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <main className={`flex-1 flex flex-col items-center px-4 py-4 max-w-md mx-auto w-full min-h-0 ${activeTab === "swipe" ? "overflow-hidden" : "overflow-y-auto"}`}>
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
                setSelectedJob(fullJob || dbJob as any);
              }}
            />
          </motion.div>
        ) : activeTab === "saved" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <h2 className="font-display text-lg font-bold text-foreground mb-4">
              Zapisane oferty ({savedJobs.length})
            </h2>
            <SavedList jobs={savedJobs} onApply={handleSavedApply} onJobClick={setSelectedJob} />
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
                {/* Card stack — fills available space, overflow-hidden prevents card bleeding into buttons */}
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
                        onTap={() => setSelectedJob(job)}
                        forcedExitDirection={i === 0 ? buttonExitDir : null}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Action buttons — dedicated fixed-height row, never overlapped */}
                <div className="relative z-10 flex items-center gap-5 shrink-0 py-3">
                  <button
                    onClick={() => handleSwipeWithRefetch("left")}
                    className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                    title="Pomiń"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => handleSwipeWithRefetch("save")}
                    className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-yellow-400 hover:border-yellow-400 transition-colors"
                    title="Zapisz na później"
                  >
                    <Star className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleSwipeWithRefetch("right")}
                    className="w-16 h-16 rounded-full btn-gradient flex items-center justify-center text-primary-foreground shadow-glow hover:scale-110 transition-transform"
                    title="Aplikuj"
                  >
                    <Check className="w-7 h-7" />
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
        onClose={() => setSelectedJob(null)}
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
