import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Star, Briefcase, RotateCcw, Users, Building2, LogOut, User, Bell } from "lucide-react";
import SwipeCard from "@/components/SwipeCard";
import SavedList from "@/components/SavedList";
import ApplicationStatusList from "@/components/ApplicationStatusList";
import JobFilters from "@/components/JobFilters";
import OnboardingModal from "@/components/OnboardingModal";
import JobDetailModal from "@/components/JobDetailModal";
import type { Job } from "@/domain/models";
import { useAuth } from "@/hooks/useAuth";
import { useCandidateApplications } from "@/hooks/useApplications";
import { useNotifications } from "@/hooks/useNotifications";
import { useJobFeed } from "@/hooks/useJobFeed";
import { useOnboarding } from "@/hooks/useOnboarding";

type Tab = "swipe" | "applied" | "saved";

const Index = () => {
  const { signOut, user } = useAuth();
  const { applications: dbApplications, loading: appsLoading, refetch: refetchApps } = useCandidateApplications();
  const { notifications, unreadCount, markAllRead } = useNotifications();
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Refetch applications after apply (swipe triggers applyToJob inside useJobFeed)
  const handleSwipeWithRefetch = async (direction: "left" | "right" | "save") => {
    await handleSwipe(direction);
    if (direction === "right") refetchApps();
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Ładowanie ofert...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">JobSwipe</h1>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); markAllRead(); }}
              className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-muted transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-12 w-72 card-gradient rounded-xl border border-border shadow-lg z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-border">
                    <p className="text-xs font-semibold text-foreground">Powiadomienia</p>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Brak powiadomień
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className={`p-3 border-b border-border last:border-0 ${n.read ? "" : "bg-accent/5"}`}>
                          <p className="text-xs font-medium text-foreground">{n.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{n.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            to="/my-profile"
            className="p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Mój profil</span>
          </Link>
          <Link
            to="/employer"
            className="p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Dla firm</span>
          </Link>
          <Link
            to="/profiles"
            className="p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Znajdź talent</span>
          </Link>
          {user && (
            <button
              onClick={signOut}
              className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
              title="Wyloguj się"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

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

      <main className="flex-1 flex flex-col items-center px-4 py-4 max-w-md mx-auto w-full">
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
              <>
                {/* Card stack */}
                <div className="relative w-full" style={{ height: 'clamp(340px, 60vh, 480px)' }}>
                  <AnimatePresence>
                    {remainingJobs.slice(0, 2).map((job, i) => (
                      <SwipeCard
                        key={job.id}
                        job={job}
                        onSwipe={handleSwipeWithRefetch}
                        isTop={i === 0}
                        matchResult={matchResults[job.id]}
                        isSaved={savedJobIds.has(job.id)}
                        onTap={() => setSelectedJob(job)}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-5 mt-4">
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

                <p className="text-muted-foreground text-xs mt-3">
                  {currentIndex + 1} / {filteredJobs.length}
                </p>
              </>
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
    </div>
  );
};

export default Index;
