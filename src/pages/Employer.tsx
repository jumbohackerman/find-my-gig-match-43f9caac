import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Plus, Users, Trash2, Eye, ChevronDown, ChevronUp,
  BarChart3, TrendingUp, Zap, Layers,
} from "lucide-react";
import { type Job } from "@/data/jobs";
import MatchBadge from "@/components/MatchBadge";
import MatchScoreBreakdown from "@/components/MatchScoreBreakdown";
import CandidateProfileModal from "@/components/CandidateProfileModal";
import type { ExtendedSeeker } from "@/components/CandidateProfileModal";
import { type MatchResult } from "@/lib/matchScoring";
import { useUpdateApplicationStatus } from "@/hooks/useApplications";
import { useEmployerDashboardData, type EmployerApplication } from "@/hooks/useEmployerDashboard";
import StatusBadge from "@/components/employer/StatusBadge";
import SourceLabel from "@/components/employer/SourceLabel";
import StatusPipeline from "@/components/employer/StatusPipeline";
import EmptyState from "@/components/employer/EmptyState";
import ChatPanel from "@/components/employer/ChatPanel";
import type { ChatMessage } from "@/components/employer/ChatPanel";
import type { ApplicationStatus } from "@/types/application";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const MAX_SHORTLIST = 5;

function getCandidateDisplayName(app: EmployerApplication): string {
  const c = app.candidate;
  if (!c) return "Kandydat";
  return (c as any).full_name || c.title || "Kandydat";
}

function getCandidateAvatar(app: EmployerApplication): string {
  const c = app.candidate;
  if (!c) return "👤";
  return (c as any).avatar || "👤";
}

function appToSeeker(app: EmployerApplication): ExtendedSeeker {
  const c = app.candidate;
  if (!c) {
    return {
      id: app.candidate_id,
      name: "Kandydat",
      title: "",
      avatar: "👤",
      skills: [],
      experience: "",
      location: "",
      bio: "",
    } as ExtendedSeeker;
  }
  return {
    id: c.id,
    name: getCandidateDisplayName(app),
    title: c.title,
    avatar: getCandidateAvatar(app),
    skills: c.skills || [],
    experience: c.experience,
    location: c.location,
    bio: c.bio,
    seniority: c.seniority,
    summary: c.summary,
    work_mode: c.work_mode,
    experience_entries: c.experience_entries as any,
    links: c.links as any,
    cv_url: c.cv_url || undefined,
    last_active: c.last_active,
    salary_min: c.salary_min,
    salary_max: c.salary_max,
  } as ExtendedSeeker;
}

function getActivityLabel(lastActive?: string): { label: string; color: string } {
  if (!lastActive) return { label: "Aktywny", color: "text-accent" };
  const diffMs = Date.now() - new Date(lastActive).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 1) return { label: "Aktywny dziś", color: "text-accent" };
  if (diffDays < 7) return { label: `Aktywny ${Math.floor(diffDays)} dn. temu`, color: "text-yellow-400" };
  return { label: "Nieaktywny", color: "text-muted-foreground" };
}

const Employer = () => {
  const { user } = useAuth();
  const { updateStatus: updateDbStatus } = useUpdateApplicationStatus();
  const { jobs: dbJobs, applicationsByJob, loading, refetch } = useEmployerDashboardData();

  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [analyzedJob, setAnalyzedJob] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<{ seeker: ExtendedSeeker; match: MatchResult } | null>(null);
  const [chatOpen, setChatOpen] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [form, setForm] = useState({
    title: "", company: "", logo: "🏢", location: "", salary: "",
    type: "Full-time" as Job["type"], description: "", tags: "",
  });

  const handleAdvanceStatus = useCallback(async (appId: string, newStatus: ApplicationStatus) => {
    await updateDbStatus(appId, newStatus);
    refetch();
  }, [updateDbStatus, refetch]);

  const handleViewCandidate = useCallback((app: EmployerApplication) => {
    // Mark as viewed if still applied
    if (app.status === "applied") {
      handleAdvanceStatus(app.id, "viewed");
    }
    const seeker = appToSeeker(app);
    setSelectedCandidate({ seeker, match: app.matchResult! });
  }, [handleAdvanceStatus]);

  const handleGenerateShortlist = useCallback(async (jobId: string) => {
    const jobApps = applicationsByJob[jobId] || [];
    const shortlisted = jobApps.filter((a) => a.status === "shortlisted");
    const slotsAvailable = MAX_SHORTLIST - shortlisted.length;
    if (slotsAvailable <= 0) return;

    // Pick top-scored non-shortlisted candidates
    const toShortlist = jobApps
      .filter((a) => a.status !== "shortlisted" && a.matchResult)
      .sort((a, b) => (b.matchResult?.score || 0) - (a.matchResult?.score || 0))
      .slice(0, slotsAvailable);

    for (const app of toShortlist) {
      await supabase
        .from("applications")
        .update({ status: "shortlisted", source: "ai" })
        .eq("id", app.id);
    }
    refetch();
  }, [applicationsByJob, refetch]);

  const handleSendMessage = useCallback((applicationId: string, content: string) => {
    const msg: ChatMessage = {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await supabase.from("jobs").insert({
      title: form.title,
      company: form.company,
      logo: form.logo,
      location: form.location,
      salary: form.salary,
      type: form.type,
      description: form.description,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      employer_id: user.id,
    });
    setForm({ title: "", company: "", logo: "🏢", location: "", salary: "", type: "Full-time", description: "", tags: "" });
    setShowForm(false);
    refetch();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("jobs").delete().eq("id", id);
    refetch();
  };

  const getAvgMatchScore = (jobId: string) => {
    const apps = applicationsByJob[jobId] || [];
    if (apps.length === 0) return 0;
    const total = apps.reduce((sum, a) => sum + (a.matchResult?.score || 0), 0);
    return Math.round(total / apps.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Ładowanie danych...</div>
      </div>
    );
  }

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

        {dbJobs.length === 0 ? (
          <EmptyState
            title="Brak ogłoszeń"
            description="Dodaj swoje pierwsze ogłoszenie lub poczekaj na aplikacje."
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {dbJobs.map((job, i) => {
                const jobApps = applicationsByJob[job.id] || [];
                const shortlisted = jobApps.filter((a) => a.status === "shortlisted");
                const isExpanded = expandedJob === job.id;
                const isAnalyzed = analyzedJob === job.id;
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
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {jobApps.length} aplikacji</span>
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
                          <p className="text-xs text-muted-foreground truncate">{job.company} · {job.location}</p>
                        </div>
                        {job.employer_id === user?.id && (
                          <button onClick={() => handleDelete(job.id)} className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleGenerateShortlist(job.id)}
                          disabled={shortlisted.length >= MAX_SHORTLIST}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Zap className="w-3.5 h-3.5" /> Generuj shortlistę
                        </button>
                        <button
                          onClick={() => {
                            setAnalyzedJob(isAnalyzed ? null : job.id);
                            setExpandedJob(null);
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
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {jobApps.length}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Regular applicant list */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 border-t border-border pt-3">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Kandydaci ({jobApps.length}) — posortowani wg dopasowania
                              </h5>
                            </div>
                            {jobApps.length === 0 ? (
                              <EmptyState
                                title="Brak kandydatów"
                                description="Brak kandydatów. Udostępnij ogłoszenie, aby otrzymać aplikacje."
                              />
                            ) : (
                              <div className="space-y-2">
                                {jobApps.map((app) => (
                                  <CandidateCard
                                    key={app.id}
                                    app={app}
                                    onView={() => handleViewCandidate(app)}
                                    onAdvanceStatus={handleAdvanceStatus}
                                    chatMessages={messages.filter((m) => m.applicationId === app.id)}
                                    onSendMessage={(content) => handleSendMessage(app.id, content)}
                                    isChatOpen={chatOpen === app.id}
                                    onUnlockChat={() => handleUnlockChat(app.id)}
                                  />
                                ))}
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
                            {jobApps.length === 0 ? (
                              <EmptyState
                                title="Brak kandydatów do analizy"
                                description="Udostępnij ogłoszenie, aby otrzymać aplikacje do analizy."
                              />
                            ) : (
                              <div className="space-y-3">
                                {jobApps.map((app, idx) => (
                                  <AnalysisCard
                                    key={app.id}
                                    app={app}
                                    rank={idx + 1}
                                    onViewProfile={() => handleViewCandidate(app)}
                                  />
                                ))}
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
        )}
      </main>

      <CandidateProfileModal
        seeker={selectedCandidate?.seeker || null}
        match={selectedCandidate?.match}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
};

// ── Candidate card with real DB data ──────────────────────────────────────────

function CandidateCard({
  app,
  onView,
  onAdvanceStatus,
  chatMessages,
  onSendMessage,
  isChatOpen,
  onUnlockChat,
}: {
  app: EmployerApplication;
  onView: () => void;
  onAdvanceStatus: (appId: string, status: ApplicationStatus) => void;
  chatMessages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isChatOpen: boolean;
  onUnlockChat: () => void;
}) {
  const name = getCandidateDisplayName(app);
  const avatar = getCandidateAvatar(app);
  const candidate = app.candidate;
  const matchResult = app.matchResult;
  const activity = getActivityLabel(candidate?.last_active);

  return (
    <div className="rounded-lg bg-secondary/50 border border-border overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/80 transition-colors"
        onClick={onView}
      >
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm">{avatar}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">
            {candidate?.title || "–"} · {candidate?.experience || "–"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-medium ${activity.color}`}>{activity.label}</span>
            <StatusBadge status={app.status as ApplicationStatus} />
            {app.source !== "candidate" && <SourceLabel source={app.source as any} />}
          </div>
        </div>
        {matchResult && <MatchBadge result={matchResult} compact />}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex gap-1 flex-wrap justify-end">
            {(candidate?.skills || []).slice(0, 2).map((skill) => (
              <span key={skill} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{skill}</span>
            ))}
          </div>
          <div className="flex gap-1">
            {app.status === "applied" && (
              <button
                onClick={(e) => { e.stopPropagation(); onAdvanceStatus(app.id, "shortlisted"); }}
                className="text-[10px] px-2 py-0.5 rounded bg-accent/15 text-accent hover:bg-accent/25"
              >
                Shortlista
              </button>
            )}
            {(app.status === "shortlisted" || app.status === "viewed") && (
              <button
                onClick={(e) => { e.stopPropagation(); onAdvanceStatus(app.id, "interview"); }}
                className="text-[10px] px-2 py-0.5 rounded bg-primary/15 text-primary hover:bg-primary/25"
              >
                Rozmowa
              </button>
            )}
            {app.status === "interview" && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onAdvanceStatus(app.id, "hired"); }}
                  className="text-[10px] px-2 py-0.5 rounded bg-accent/15 text-accent hover:bg-accent/25"
                >
                  Zatrudnij
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAdvanceStatus(app.id, "not_selected"); }}
                  className="text-[10px] px-2 py-0.5 rounded bg-destructive/15 text-destructive hover:bg-destructive/25"
                >
                  Nie wybrano
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAdvanceStatus(app.id, "position_closed"); }}
                  className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/80"
                >
                  Zamknij
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 pb-2">
        <StatusPipeline currentStatus={app.status as ApplicationStatus} />
      </div>

      <ChatPanel
        messages={chatMessages}
        onSend={onSendMessage}
        candidateName={name}
        isUnlocked={isChatOpen || chatMessages.length > 0}
        onUnlock={onUnlockChat}
      />
    </div>
  );
}

// ── Analysis card with breakdown ──────────────────────────────────────────────

function AnalysisCard({
  app,
  rank,
  onViewProfile,
}: {
  app: EmployerApplication;
  rank: number;
  onViewProfile: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const name = getCandidateDisplayName(app);
  const avatar = getCandidateAvatar(app);
  const matchResult = app.matchResult;
  const activity = getActivityLabel(app.candidate?.last_active);

  return (
    <div className="rounded-lg bg-secondary/50 border border-border overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-3 flex items-center gap-3 text-left">
        <span className="text-xs font-bold text-muted-foreground w-5">#{rank}</span>
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm shrink-0">{avatar}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{app.candidate?.title || "–"} · {app.candidate?.experience || "–"}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-medium ${activity.color}`}>{activity.label}</span>
            <StatusBadge status={app.status as ApplicationStatus} />
            {app.source !== "candidate" && <SourceLabel source={app.source as any} />}
          </div>
        </div>
        {matchResult && <MatchBadge result={matchResult} compact />}
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {expanded && matchResult && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-3 pb-3 pt-0 border-t border-border">
              <div className="pt-3 space-y-3">
                <MatchScoreBreakdown breakdown={matchResult.breakdown} totalScore={matchResult.score} />
                <MatchBadge result={matchResult} />
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
