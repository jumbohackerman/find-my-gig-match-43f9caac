import { useState, useCallback, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Star, Briefcase, RotateCcw, Users, Building2, LogOut } from "lucide-react";
import SwipeCard from "@/components/SwipeCard";
import AppliedList from "@/components/AppliedList";
import SavedList from "@/components/SavedList";
import JobFilters, { filterJobs, defaultFilters, type JobFiltersState } from "@/components/JobFilters";
import OnboardingModal from "@/components/OnboardingModal";
import DemoBanner from "@/components/DemoBanner";
import { jobs, type Job } from "@/data/jobs";
import { useAuth } from "@/hooks/useAuth";
import { calculateMatch, DEMO_CANDIDATE, type CandidateProfile, type MatchResult } from "@/lib/matchScoring";

type Tab = "swipe" | "applied" | "saved";

const Index = () => {
  const { signOut, user, profile } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [skippedJobs, setSkippedJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("swipe");
  const [filters, setFilters] = useState<JobFiltersState>({ ...defaultFilters });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile>(DEMO_CANDIDATE);

  // Check if onboarding needed (first login as candidate)
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

  const filteredJobs = useMemo(() => filterJobs(jobs, filters), [filters]);

  const matchResults = useMemo(() => {
    const map: Record<string, MatchResult> = {};
    filteredJobs.forEach((job) => {
      map[job.id] = calculateMatch(candidateProfile, job);
    });
    return map;
  }, [filteredJobs, candidateProfile]);

  const remainingJobs = filteredJobs.slice(currentIndex);
  const isFinished = currentIndex >= filteredJobs.length;

  const handleSwipe = useCallback(
    (direction: "left" | "right" | "save") => {
      const job = filteredJobs[currentIndex];
      if (!job) return;

      if (direction === "right") {
        setAppliedJobs((prev) => (prev.some((j) => j.id === job.id) ? prev : [job, ...prev]));
      } else if (direction === "save") {
        setSavedJobs((prev) => (prev.some((j) => j.id === job.id) ? prev : [job, ...prev]));
      } else {
        setSkippedJobs((prev) => [job, ...prev]);
      }
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, filteredJobs]
  );

  const handleSavedApply = (job: Job) => {
    setSavedJobs((prev) => prev.filter((j) => j.id !== job.id));
    setAppliedJobs((prev) => (prev.some((j) => j.id === job.id) ? prev : [job, ...prev]));
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

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "swipe", label: "Browse" },
    { key: "applied", label: "My Applications", count: appliedJobs.length },
    { key: "saved", label: "Saved Jobs", count: savedJobs.length },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DemoBanner />

      {/* Header */}
      <header className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">JobSwipe</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/employer"
            className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Building2 className="w-4 h-4" />
            For Companies
          </Link>
          <Link
            to="/profiles"
            className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            Find Talent
          </Link>
          {user && (
            <button
              onClick={signOut}
              className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
              title="Sign out"
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
              My Applications ({appliedJobs.length})
            </h2>
            <AppliedList jobs={appliedJobs} />
          </motion.div>
        ) : activeTab === "saved" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            <h2 className="font-display text-lg font-bold text-foreground mb-4">
              Saved Jobs ({savedJobs.length})
            </h2>
            <SavedList jobs={savedJobs} onApply={handleSavedApply} />
          </motion.div>
        ) : isFinished ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-4xl">
              🎉
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">All caught up!</h2>
            <p className="text-muted-foreground text-sm mb-2">
              You applied to {appliedJobs.length} job{appliedJobs.length !== 1 ? "s" : ""}, saved {savedJobs.length}, and skipped {skippedJobs.length}.
            </p>
            <div className="flex gap-3 mt-6 justify-center">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Start Over
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <JobFilters filters={filters} onChange={handleFiltersChange} />

            {filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">No jobs match your filters.</p>
              </div>
            ) : (
              <>
                {/* Card stack */}
                <div className="relative w-full mb-4" style={{ minHeight: '360px' }}>
                  <AnimatePresence>
                    {remainingJobs.slice(0, 2).map((job, i) => (
                      <SwipeCard
                        key={job.id}
                        job={job}
                        onSwipe={handleSwipe}
                        isTop={i === 0}
                        matchResult={matchResults[job.id]}
                        isSaved={savedJobs.some((j) => j.id === job.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Action buttons: Skip / Save / Apply */}
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => handleSwipe("left")}
                    className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                    title="Skip"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <button
                    onClick={() => handleSwipe("save")}
                    className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-yellow-400 hover:border-yellow-400 transition-colors"
                    title="Save for later"
                  >
                    <Star className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleSwipe("right")}
                    className="w-16 h-16 rounded-full btn-gradient flex items-center justify-center text-primary-foreground shadow-glow hover:scale-110 transition-transform"
                    title="Apply"
                  >
                    <Check className="w-7 h-7" />
                  </button>
                </div>

                {/* Counter */}
                <p className="text-muted-foreground text-xs mt-4">
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
    </div>
  );
};

export default Index;
