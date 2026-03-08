import { useState, useCallback, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Star, Briefcase, RotateCcw, Users, Building2, LogOut, User, Bell } from "lucide-react";
import SwipeCard from "@/components/SwipeCard";
import SavedList from "@/components/SavedList";
import ApplicationStatusList from "@/components/ApplicationStatusList";
import JobFilters, { filterJobs, defaultFilters, type JobFiltersState } from "@/components/JobFilters";
import OnboardingModal from "@/components/OnboardingModal";
import JobDetailModal from "@/components/JobDetailModal";
import type { Job } from "@/domain/models";
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/hooks/useAuth";
import { useCandidateApplications } from "@/hooks/useApplications";
import { supabase } from "@/integrations/supabase/client";
import { calculateMatch, DEMO_CANDIDATE, type CandidateProfile, type MatchResult } from "@/lib/matchScoring";
import { toast } from "sonner";

type Tab = "swipe" | "applied" | "saved";

interface Notification {
  id: string;
  message: string;
  jobTitle: string;
  read: boolean;
}

const Index = () => {
  const { signOut, user, profile } = useAuth();
  const { applications: dbApplications, loading: appsLoading, refetch: refetchApps } = useCandidateApplications();
  const { jobs: allJobs, loading: jobsLoading } = useJobs();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [skippedJobs, setSkippedJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("swipe");
  const [filters, setFilters] = useState<JobFiltersState>({ ...defaultFilters });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile>(DEMO_CANDIDATE);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    if (user && profile?.role === "candidate") {
      const onboarded = localStorage.getItem(`onboarded_${user.id}`);
      if (!onboarded) setShowOnboarding(true);
    }
  }, [user, profile]);

  const handleOnboardingComplete = (data: {
    title: string;
    skills: string[];
    salaryMin: number;
    salaryMax: number;
    remotePreference: string;
    seniority: string;
  }) => {
    const newProfile: CandidateProfile = {
      ...candidateProfile,
      title: data.title,
      skills: data.skills,
      preferredSalaryMin: data.salaryMin,
      preferredSalaryMax: data.salaryMax,
      remotePreference: data.remotePreference,
      seniority: data.seniority,
    };
    setCandidateProfile(newProfile);
    if (user) localStorage.setItem(`onboarded_${user.id}`, "true");
    setShowOnboarding(false);
  };

  const filteredJobs = useMemo(() => filterJobs(allJobs, filters), [allJobs, filters]);

  const matchResults = useMemo(() => {
    const map: Record<string, MatchResult> = {};
    filteredJobs.forEach((job) => {
      map[job.id] = calculateMatch(candidateProfile, job);
    });
    return map;
  }, [filteredJobs, candidateProfile]);

  const remainingJobs = filteredJobs.slice(currentIndex);
  const isFinished = currentIndex >= filteredJobs.length;

  const applyToJob = useCallback(async (job: Job) => {
    if (!user) return;
    try {
      const { error } = await supabase.rpc("apply_to_job", {
        _static_job_id: job.id,
        _job_title: job.title,
        _job_company: job.company,
        _job_location: job.location,
        _job_logo: job.logo,
        _job_salary: job.salary,
        _job_tags: job.tags,
        _job_type: job.type,
        _job_description: job.description,
      });
      if (error) {
        console.error("Apply error:", error);
        toast.error("Nie udało się zaaplikować");
      } else {
        toast.success(`Zaaplikowano na: ${job.title}`);
        refetchApps();
      }
    } catch (err) {
      console.error("Apply error:", err);
    }
  }, [user, refetchApps]);

  const handleSwipe = useCallback(
    (direction: "left" | "right" | "save") => {
      const job = filteredJobs[currentIndex];
      if (!job) return;

      if (direction === "right") {
        setAppliedJobs((prev) => (prev.some((j) => j.id === job.id) ? prev : [job, ...prev]));
        applyToJob(job);
      } else if (direction === "save") {
        setSavedJobs((prev) => (prev.some((j) => j.id === job.id) ? prev : [job, ...prev]));
      } else {
        setSkippedJobs((prev) => [job, ...prev]);
      }
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, filteredJobs, applyToJob]
  );

  const handleSavedApply = (job: Job) => {
    setSavedJobs((prev) => prev.filter((j) => j.id !== job.id));
    setAppliedJobs((prev) => (prev.some((j) => j.id === job.id) ? prev : [job, ...prev]));
    applyToJob(job);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setAppliedJobs([]);
    setSavedJobs([]);
    setSkippedJobs([]);
  };

  const handleFiltersChange = (newFilters: JobFiltersState) => {
    setFilters(newFilters);
    setCurrentIndex(0);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
                          <p className="text-xs font-medium text-foreground">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{n.jobTitle}</p>
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
              Zaaplikowałeś na {appliedJobs.length} ofert{appliedJobs.length !== 1 ? "" : "ę"}, zapisałeś {savedJobs.length} i pominąłeś {skippedJobs.length}.
            </p>
            <div className="flex gap-3 mt-6 justify-center">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Zacznij od nowa
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <JobFilters filters={filters} onChange={handleFiltersChange} />

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
                        onSwipe={handleSwipe}
                        isTop={i === 0}
                        matchResult={matchResults[job.id]}
                        isSaved={savedJobs.some((j) => j.id === job.id)}
                        onTap={() => setSelectedJob(job)}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-5 mt-4">
                  <button
                    onClick={() => handleSwipe("left")}
                    className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                    title="Pomiń"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => handleSwipe("save")}
                    className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-yellow-400 hover:border-yellow-400 transition-colors"
                    title="Zapisz na później"
                  >
                    <Star className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleSwipe("right")}
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
        onComplete={handleOnboardingComplete}
        onClose={() => setShowOnboarding(false)}
      />

      <JobDetailModal
        job={selectedJob}
        matchResult={selectedJob ? matchResults[selectedJob.id] : undefined}
        onClose={() => setSelectedJob(null)}
        onApply={(job) => {
          setAppliedJobs((prev) => (prev.some((j) => j.id === job.id) ? prev : [job, ...prev]));
          applyToJob(job);
        }}
      />
    </div>
  );
};

export default Index;
