import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Plus, Users, Trash2, Eye, ChevronDown, ChevronUp,
  BarChart3, TrendingUp, Zap, Layers, MessageSquare,
} from "lucide-react";
import { jobs as initialJobs, type Job } from "@/data/jobs";
import { seekers, type Seeker } from "@/data/seekers";
import MatchBadge from "@/components/MatchBadge";
import MatchScoreBreakdown, { computeBreakdown } from "@/components/MatchScoreBreakdown";
import CandidateProfileModal from "@/components/CandidateProfileModal";
import type { ExtendedSeeker } from "@/components/CandidateProfileModal";
import { getActivityLabel } from "@/components/CandidateProfileModal";
import { calculateMatch, type CandidateProfile, type MatchResult } from "@/lib/matchScoring";
import StatusBadge from "@/components/employer/StatusBadge";
import SourceLabel from "@/components/employer/SourceLabel";
import StatusPipeline from "@/components/employer/StatusPipeline";
import EmptyState from "@/components/employer/EmptyState";
import ChatPanel from "@/components/employer/ChatPanel";
import EmployerCandidateSwipe from "@/components/employer/EmployerCandidateSwipe";
import type { ApplicationStatus, ApplicationSource, DemoApplication, DemoMessage } from "@/types/application";

const MAX_SHORTLIST = 5;
const MAX_PICKS = 5;

function seekerToProfile(seeker: Seeker): CandidateProfile {
  const expMatch = seeker.experience.match(/(\d+)/);
  return {
    skills: seeker.skills,
    seniority: parseInt(expMatch?.[1] || "3") >= 6 ? "Senior" : parseInt(expMatch?.[1] || "3") >= 3 ? "Mid" : "Junior",
    preferredSalaryMin: seeker.salary_min || 12,
    preferredSalaryMax: seeker.salary_max || 25,
    remotePreference: seeker.work_mode?.toLowerCase().includes("zdaln") ? "Zdalnie" : "Any",
    location: seeker.location,
    experienceYears: parseInt(expMatch?.[1] || "3"),
    title: seeker.title,
  };
}

const generateApplicants = () => {
  const map: Record<string, typeof seekers> = {};
  initialJobs.forEach((job) => {
    const count = Math.floor(Math.random() * 4) + 1;
    const shuffled = [...seekers].sort(() => 0.5 - Math.random());
    map[job.id] = shuffled.slice(0, count);
  });
  return map;
};

const generateMetrics = () => {
  const map: Record<string, { views: number; swipesRight: number; applications: number }> = {};
  initialJobs.forEach((job) => {
    const views = Math.floor(Math.random() * 300) + 50;
    const swipesRight = Math.floor(views * (Math.random() * 0.4 + 0.1));
    const applications = Math.floor(swipesRight * (Math.random() * 0.6 + 0.2));
    map[job.id] = { views, swipesRight, applications };
  });
  return map;
};

function generateDemoApps(applicants: Record<string, Seeker[]>): DemoApplication[] {
  const apps: DemoApplication[] = [];
  Object.entries(applicants).forEach(([jobId, jobSeekers]) => {
    jobSeekers.forEach((s) => {
      apps.push({
        id: `${jobId}-${s.id}`,
        candidateId: s.id,
        jobId,
        status: "applied",
        source: "candidate",
        appliedAt: new Date().toISOString(),
      });
    });
  });
  return apps;
}

type EmployerTab = "listings" | "swipe";

const Employer = () => {
  const [postedJobs, setPostedJobs] = useState<Job[]>(initialJobs);
  const [applicants] = useState(generateApplicants);
  const [metrics] = useState(generateMetrics);
  const [applications, setApplications] = useState<DemoApplication[]>(() => generateDemoApps(applicants));
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [analyzedJob, setAnalyzedJob] = useState<string | null>(null);
  const [swipeJob, setSwipeJob] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<{ seeker: ExtendedSeeker; match: MatchResult } | null>(null);
  const [chatOpen, setChatOpen] = useState<string | null>(null);
  const [swipeIndexes, setSwipeIndexes] = useState<Record<string, number>>({});
  const [picksUsed, setPicksUsed] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<EmployerTab>("listings");

  const [form, setForm] = useState({
    title: "", company: "", logo: "🏢", location: "", salary: "",
    type: "Full-time" as Job["type"], description: "", tags: "",
  });

  const getApp = (jobId: string, candidateId: string) =>
    applications.find((a) => a.jobId === jobId && a.candidateId === candidateId);

  const getJobApps = (jobId: string) =>
    applications.filter((a) => a.jobId === jobId);

  const getShortlisted = (jobId: string) =>
    applications.filter((a) => a.jobId === jobId && a.status === "shortlisted");

  const updateAppStatus = useCallback((appId: string, status: ApplicationStatus) => {
    setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status } : a));
  }, []);

  const handleViewCandidate = useCallback((seeker: Seeker, match: MatchResult, jobId: string) => {
    const app = getApp(jobId, seeker.id);
    if (app && app.status === "applied") {
      updateAppStatus(app.id, "viewed");
    }
    setSelectedCandidate({ seeker: seeker as ExtendedSeeker, match });
  }, [applications]);

  const handleGenerateShortlist = useCallback((jobId: string) => {
    const job = postedJobs.find((j) => j.id === jobId);
    if (!job) return;
    const jobApplicants = applicants[jobId] || [];
    const existing = getShortlisted(jobId).length;
    const slotsAvailable = MAX_SHORTLIST - existing;
    if (slotsAvailable <= 0) return;

    const ranked = jobApplicants
      .map((s) => ({ seeker: s, match: calculateMatch(seekerToProfile(s), job) }))
      .sort((a, b) => b.match.score - a.match.score);

    const toShortlist = ranked
      .filter(({ seeker }) => {
        const app = getApp(jobId, seeker.id);
        return app && app.status !== "shortlisted";
      })
      .slice(0, slotsAvailable);

    setApplications((prev) =>
      prev.map((a) => {
        const found = toShortlist.find((t) => a.jobId === jobId && a.candidateId === t.seeker.id);
        return found ? { ...a, status: "shortlisted" as ApplicationStatus, source: "ai" as ApplicationSource } : a;
      })
    );
  }, [postedJobs, applicants, applications]);

  const handleSwipePick = useCallback((jobId: string, seekerId: string) => {
    const shortlisted = getShortlisted(jobId);
    if (shortlisted.length >= MAX_SHORTLIST) return;

    setApplications((prev) =>
      prev.map((a) =>
        a.jobId === jobId && a.candidateId === seekerId
          ? { ...a, status: "shortlisted" as ApplicationStatus, source: "employer" as ApplicationSource }
          : a
      )
    );
    setPicksUsed((prev) => ({ ...prev, [jobId]: (prev[jobId] || 0) + 1 }));
    setSwipeIndexes((prev) => ({ ...prev, [jobId]: (prev[jobId] || 0) + 1 }));
  }, [applications]);

  const handleSwipeSkip = useCallback((jobId: string) => {
    setSwipeIndexes((prev) => ({ ...prev, [jobId]: (prev[jobId] || 0) + 1 }));
  }, []);

  const handleSendMessage = useCallback((applicationId: string, content: string) => {
    const msg: DemoMessage = {
      id: String(Date.now()),
      applicationId,
      senderId: "employer",
      senderName: "Ty",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleUnlockChat = useCallback((applicationId: string) => {
    setChatOpen(applicationId);
  }, []);

  const handleAdvanceStatus = useCallback((appId: string, newStatus: ApplicationStatus) => {
    updateAppStatus(appId, newStatus);
  }, [updateAppStatus]);

  const rankedApplicants = useMemo(() => {
    if (!analyzedJob) return [];
    const job = postedJobs.find((j) => j.id === analyzedJob);
    const jobApplicants = applicants[analyzedJob] || [];
    if (!job) return [];
    return jobApplicants
      .map((seeker) => ({ seeker, match: calculateMatch(seekerToProfile(seeker), job) }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [analyzedJob, postedJobs, applicants]);

  const swipeCandidates = useMemo(() => {
    if (!swipeJob) return [];
    const job = postedJobs.find((j) => j.id === swipeJob);
    const jobApplicants = applicants[swipeJob] || [];
    if (!job) return [];
    return jobApplicants
      .map((seeker) => ({ seeker, match: calculateMatch(seekerToProfile(seeker), job) }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [swipeJob, postedJobs, applicants]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newJob: Job = {
      id: String(Date.now()),
      title: form.title, company: form.company, logo: form.logo,
      location: form.location, salary: form.salary, type: form.type,
      description: form.description,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      posted: "Właśnie dodano",
    };
    setPostedJobs((prev) => [newJob, ...prev]);
    setForm({ title: "", company: "", logo: "🏢", location: "", salary: "", type: "Full-time", description: "", tags: "" });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setPostedJobs((prev) => prev.filter((j) => j.id !== id));
    setApplications((prev) => prev.filter((a) => a.jobId !== id));
  };

  const getAvgMatchScore = (jobId: string) => {
    const job = postedJobs.find((j) => j.id === jobId);
    const jobApplicants = applicants[jobId] || [];
    if (!job || jobApplicants.length === 0) return 0;
    const total = jobApplicants.reduce(
      (sum, s) => sum + calculateMatch(seekerToProfile(s), job).score, 0
    );
    return Math.round(total / jobApplicants.length);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">JobSwipe</h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link to="/" className="p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">Przeglądaj oferty</span>
          </Link>
          <Link to="/profiles" className="p-2 sm:px-4 sm:py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Znajdź talent</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-6 max-w-2xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Panel pracodawcy</h2>
              <p className="text-muted-foreground text-sm mt-1">Zarządzaj ogłoszeniami, shortlistami i kandydatami.</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" /> Dodaj ogłoszenie
            </button>
          </div>
        </motion.div>

        {/* Post Job Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
              onSubmit={handleSubmit}
            >
              <div className="card-gradient rounded-2xl border border-border p-5 mb-6 space-y-4">
                <h3 className="font-display text-lg font-semibold text-foreground">Nowe ogłoszenie</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Stanowisko *</label>
                    <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="np. Frontend Developer" className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Firma *</label>
                    <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="np. TechNova" className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Lokalizacja *</label>
                    <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="np. Zdalnie" className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Wynagrodzenie</label>
                    <input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="np. 18 000 zł - 25 000 zł" className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Typ</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Job["type"] })} className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Logo (emoji)</label>
                    <input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Tagi (po przecinku)</label>
                    <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="React, TypeScript" className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Opis *</label>
                  <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Opisz rolę…" rows={3} className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">Anuluj</button>
                  <button type="submit" className="px-5 py-2 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform">Opublikuj</button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Job Listings */}
        <div className="space-y-3">
          <AnimatePresence>
            {postedJobs.map((job, i) => {
              const jobApplicants = applicants[job.id] || [];
              const jobApps = getJobApps(job.id);
              const shortlisted = getShortlisted(job.id);
              const isExpanded = expandedJob === job.id;
              const isAnalyzed = analyzedJob === job.id;
              const isSwipe = swipeJob === job.id;
              const m = metrics[job.id] || { views: 0, swipesRight: 0, applications: 0 };
              const avgScore = getAvgMatchScore(job.id);

              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.03 }}
                  className="card-gradient rounded-xl border border-border overflow-hidden"
                >
                  {/* Metrics bar */}
                  <div className="px-4 pt-3 flex gap-4 text-[11px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {m.views} wyśw.</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {m.swipesRight} swipe'ów</span>
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {jobApplicants.length} aplikacji</span>
                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {shortlisted.length}/{MAX_SHORTLIST} shortlista</span>
                    <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {avgScore}% śr. dopasowanie</span>
                  </div>

                  <div className="p-4 pt-2">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0">
                        {job.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-sm font-semibold text-foreground truncate">{job.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{job.company} · {job.location} · {job.posted}</p>
                      </div>
                      <button onClick={() => handleDelete(job.id)} className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleGenerateShortlist(job.id)}
                        disabled={shortlisted.length >= MAX_SHORTLIST}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="AI generuje shortlistę"
                      >
                        <Zap className="w-3.5 h-3.5" /> Generuj shortlistę
                      </button>
                      <button
                        onClick={() => {
                          setSwipeJob(isSwipe ? null : job.id);
                          setExpandedJob(null);
                          setAnalyzedJob(null);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isSwipe ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" /> Picki ({MAX_PICKS - (picksUsed[job.id] || 0)})
                      </button>
                      <button
                        onClick={() => {
                          setAnalyzedJob(isAnalyzed ? null : job.id);
                          setExpandedJob(null);
                          setSwipeJob(null);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isAnalyzed ? "bg-primary text-primary-foreground" : "bg-accent/15 text-accent hover:bg-accent/25"
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" /> Analiza
                      </button>
                      <button
                        onClick={() => {
                          setExpandedJob(isExpanded ? null : job.id);
                          setAnalyzedJob(null);
                          setSwipeJob(null);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {jobApplicants.length}
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Employer Swipe Picks */}
                  <AnimatePresence>
                    {isSwipe && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 border-t border-border pt-3">
                          <h5 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" /> Swipe picki — dodaj do shortlisty
                          </h5>
                          <EmployerCandidateSwipe
                            candidates={swipeCandidates}
                            picksRemaining={MAX_PICKS - (picksUsed[job.id] || 0)}
                            maxPicks={MAX_PICKS}
                            onSwipeRight={(seekerId) => handleSwipePick(job.id, seekerId)}
                            onSkip={() => handleSwipeSkip(job.id)}
                            currentIndex={swipeIndexes[job.id] || 0}
                            onViewProfile={(seeker, match) => handleViewCandidate(seeker, match, job.id)}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Regular applicant list */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 border-t border-border pt-3">
                          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Kandydaci ({jobApplicants.length})
                          </h5>
                          {jobApplicants.length === 0 ? (
                            <EmptyState
                              title="Brak kandydatów"
                              description="Brak kandydatów. Udostępnij ogłoszenie, aby otrzymać aplikacje."
                            />
                          ) : (
                            <div className="space-y-2">
                              {jobApplicants.map((seeker) => {
                                const app = getApp(job.id, seeker.id);
                                const activity = getActivityLabel(undefined);
                                const appMessages = messages.filter((m) => m.applicationId === app?.id);
                                const isChatOpen = chatOpen === app?.id;

                                return (
                                  <div key={seeker.id} className="rounded-lg bg-secondary/50 border border-border overflow-hidden">
                                    <div
                                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/80 transition-colors"
                                      onClick={() => {
                                        const matchResult = calculateMatch(seekerToProfile(seeker), job);
                                        handleViewCandidate(seeker, matchResult, job.id);
                                      }}
                                    >
                                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm">{seeker.avatar}</div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground">{seeker.name}</p>
                                        <p className="text-xs text-muted-foreground">{seeker.title} · {seeker.experience}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className={`text-[10px] font-medium ${activity.color}`}>{activity.label}</span>
                                          {app && <StatusBadge status={app.status} />}
                                          {app && app.source !== "candidate" && <SourceLabel source={app.source} />}
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <div className="flex gap-1 flex-wrap justify-end">
                                          {seeker.skills.slice(0, 2).map((skill) => (
                                            <span key={skill} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{skill}</span>
                                          ))}
                                        </div>
                                        {app && (
                                          <div className="flex gap-1">
                                            {app.status === "applied" && (
                                              <button
                                                onClick={(e) => { e.stopPropagation(); handleAdvanceStatus(app.id, "shortlisted"); }}
                                                className="text-[10px] px-2 py-0.5 rounded bg-accent/15 text-accent hover:bg-accent/25"
                                              >
                                                Shortlista
                                              </button>
                                            )}
                                            {(app.status === "shortlisted" || app.status === "viewed") && (
                                              <button
                                                onClick={(e) => { e.stopPropagation(); handleAdvanceStatus(app.id, "interview"); }}
                                                className="text-[10px] px-2 py-0.5 rounded bg-yellow-400/15 text-yellow-500 hover:bg-yellow-400/25"
                                              >
                                                Rozmowa
                                              </button>
                                            )}
                                            {app.status === "interview" && (
                                              <>
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); handleAdvanceStatus(app.id, "hired"); }}
                                                  className="text-[10px] px-2 py-0.5 rounded bg-accent/15 text-accent hover:bg-accent/25"
                                                >
                                                  Zatrudnij
                                                </button>
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); handleAdvanceStatus(app.id, "closed"); }}
                                                  className="text-[10px] px-2 py-0.5 rounded bg-destructive/15 text-destructive hover:bg-destructive/25"
                                                >
                                                  Zamknij
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {app && (
                                      <div className="px-3 pb-2">
                                        <StatusPipeline currentStatus={app.status} />
                                      </div>
                                    )}

                                    {app && (
                                      <ChatPanel
                                        messages={appMessages}
                                        onSend={(content) => handleSendMessage(app.id, content)}
                                        candidateName={seeker.name}
                                        isUnlocked={isChatOpen || appMessages.length > 0}
                                        onUnlock={() => handleUnlockChat(app.id)}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* AI Analysis view */}
                  <AnimatePresence>
                    {isAnalyzed && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 border-t border-border pt-3">
                          <h5 className="text-xs font-semibold text-accent uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" /> Analiza AI — ranking wg dopasowania
                          </h5>
                          {rankedApplicants.length === 0 ? (
                            <EmptyState
                              title="Brak kandydatów do analizy"
                              description="Udostępnij ogłoszenie, aby otrzymać aplikacje do analizy."
                            />
                          ) : (
                            <div className="space-y-3">
                              {rankedApplicants.map(({ seeker, match }, idx) => {
                                const app = getApp(job.id, seeker.id);
                                return (
                                  <ApplicantAnalysisCard
                                    key={seeker.id}
                                    seeker={seeker}
                                    match={match}
                                    rank={idx + 1}
                                    job={job}
                                    app={app}
                                    onViewProfile={() => handleViewCandidate(seeker, match, job.id)}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      <CandidateProfileModal
        seeker={selectedCandidate?.seeker || null}
        match={selectedCandidate?.match}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
};

function ApplicantAnalysisCard({
  seeker, match, rank, job, app, onViewProfile,
}: {
  seeker: Seeker; match: MatchResult; rank: number; job: Job;
  app?: DemoApplication; onViewProfile: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const activity = getActivityLabel(undefined);
  const profile = seekerToProfile(seeker);
  const breakdown = computeBreakdown(profile, job);

  return (
    <div className="rounded-lg bg-secondary/50 border border-border overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-3 flex items-center gap-3 text-left">
        <span className="text-xs font-bold text-muted-foreground w-5">#{rank}</span>
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm shrink-0">{seeker.avatar}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{seeker.name}</p>
          <p className="text-xs text-muted-foreground">{seeker.title} · {seeker.experience}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-medium ${activity.color}`}>{activity.label}</span>
            {app && <StatusBadge status={app.status} />}
            {app && app.source !== "candidate" && <SourceLabel source={app.source} />}
          </div>
        </div>
        <MatchBadge result={match} compact />
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 pt-0 border-t border-border">
              <div className="pt-3 space-y-3">
                <MatchScoreBreakdown breakdown={breakdown} totalScore={match.score} />
                <MatchBadge result={match} />
                <button
                  onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
                  className="text-xs text-primary hover:underline"
                >
                  Zobacz pełny profil →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Employer;
