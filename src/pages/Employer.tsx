import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { createFallbackCandidate } from "@/data/defaults";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Plus, Users, Trash2, Eye, ChevronDown, ChevronUp,
  BarChart3, Zap, Layers, UserCheck, ArrowLeftRight, EyeOff,
} from "lucide-react";
import { type Job, type Candidate, type MatchResult, type EnrichedEmployerApplication, getActivityLabel, getAllSkills } from "@/domain/models";
import MatchBadge from "@/components/MatchBadge";
import MatchScoreBreakdown from "@/components/MatchScoreBreakdown";
import CandidateProfileModal from "@/components/CandidateProfileModal";
import { useEmployerDashboardData } from "@/hooks/useEmployerDashboard";
import { useEmployerJobs, type JobFormData } from "@/hooks/useEmployerJobs";
import { JobPostForm, type StructuredJobFormData } from "@/components/employer/JobPostForm";
import { useEmployerShortlist } from "@/hooks/useEmployerShortlist";
import type { ShortlistJobBalance } from "@/domain/shortlist";
import { useEmployerApplicationActions, getCandidateDisplayName, getCandidateAvatar } from "@/hooks/useEmployerApplications";
import PackagePurchaseButton from "@/components/employer/PackagePurchaseButton";
import ShortlistConfirmModal from "@/components/employer/ShortlistConfirmModal";
import CandidateNotesPanel from "@/components/employer/CandidateNotesPanel";
import { useEmployerMessages, type ChatMessage } from "@/hooks/useEmployerMessages";
import StatusBadge from "@/components/employer/StatusBadge";
import SourceLabel from "@/components/employer/SourceLabel";
import StatusPipeline from "@/components/employer/StatusPipeline";
import EmptyState from "@/components/employer/EmptyState";
import ChatPanel from "@/components/employer/ChatPanel";
import SampleJobsPanel from "@/components/employer/SampleJobsPanel";
import LocalErrorBoundary from "@/components/LocalErrorBoundary";
import type { ApplicationStatus } from "@/types/application";
import { useAuth } from "@/hooks/useAuth";
import { hideJob, unhideJob } from "@/lib/moderation";
import { toast } from "sonner";
import { timeAgo } from "@/lib/timeAgo";

import { Progress } from "@/components/ui/progress";

const Employer = () => {
  const { user, profile } = useAuth();
  const { jobs: domainJobs, applicationsByJob, loading, refetch } = useEmployerDashboardData();
  const { createJob, createStructuredJob, deleteJob, submitting, EMPTY_FORM } = useEmployerJobs();
  const shortlist = useEmployerShortlist(user?.id, refetch);
  const appActions = useEmployerApplicationActions(refetch);
  const messaging = useEmployerMessages(user?.id);

  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [analyzedJob, setAnalyzedJob] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<{ candidate: Candidate; match: MatchResult; applicationStatus?: ApplicationStatus } | null>(null);

  // Old form state removed — using JobPostForm component instead

  // ── Actions ─────────────────────────────────────────────────────────────────

  const [hidePending, setHidePending] = useState<string | null>(null);
  const [statusPending, setStatusPending] = useState<string | null>(null);

  const handleAdvanceStatus = async (appId: string, newStatus: ApplicationStatus) => {
    if (statusPending) return;
    setStatusPending(appId);
    try {
      await appActions.advanceStatus(appId, newStatus);
      toast.success("Status zaktualizowany");
    } catch {
      toast.error("Nie udało się zmienić statusu. Spróbuj ponownie.");
    } finally {
      setStatusPending(null);
    }
  };

  const handleViewCandidate = (app: EnrichedEmployerApplication) => {
    const { candidate, shouldAdvance } = appActions.viewCandidate(app);
    if (shouldAdvance) {
      appActions.advanceStatus(app.id, "viewed");
    }
    setSelectedCandidate({ candidate, match: app.matchResult!, applicationStatus: app.status as ApplicationStatus });
  };

  const handleStructuredSubmit = async (formData: StructuredJobFormData) => {
    if (!user) return;
    const job = await createStructuredJob(formData, user.id);
    if (job) {
      setShowForm(false);
      refetch();
    }
  };

  const handleDelete = async (id: string) => {
    await deleteJob(id);
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
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col px-4 py-6 max-w-2xl mx-auto w-full space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-gradient rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-secondary animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-secondary animate-pulse" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-7 w-24 rounded-lg bg-secondary animate-pulse" />
                <div className="h-7 w-16 rounded-lg bg-secondary animate-pulse" />
              </div>
            </div>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col px-4 py-6 max-w-2xl mx-auto w-full" data-testid="employer-dashboard">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">Panel pracodawcy</h2>
              <p className="text-muted-foreground text-sm mt-1">Zarządzaj ogłoszeniami, shortlistami i kandydatami.</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform shrink-0 self-start sm:self-auto"
              data-testid="employer-add-job"
            >
              <Plus className="w-4 h-4" /> Dodaj ogłoszenie
            </button>
          </div>
        </motion.div>

        {/* Employer Setup Completion */}
        {(() => {
          let score = 0;
          const missing = [];
          if (user?.user_metadata?.full_name || profile?.full_name) {
            score++;
          } else {
            missing.push("Dodaj nazwę firmy w zakładce Mój Profil");
          }
          if (domainJobs.length > 0) {
            score++;
          } else {
            missing.push("Opublikuj pierwszą ofertę pracy");
          }
          const finalScore = Math.round((score / 2) * 100);

          if (finalScore === 100) return null;

          return (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-2xl bg-secondary/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Gotowość konta pracodawcy</span>
                <span className={`text-sm font-bold ${finalScore >= 50 ? "text-yellow-400" : "text-muted-foreground"}`}>
                  {finalScore}%
                </span>
              </div>
              <Progress value={finalScore} className="h-2 mb-3" />
              <div className="mt-3">
                <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2">Kolejne kroki:</p>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  {missing.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex gap-2">
                  {!domainJobs.length && (
                    <button onClick={() => setShowForm(true)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium shadow-glow hover:scale-105 transition-transform">
                      Dodaj ogłoszenie
                    </button>
                  )}
                  {!(user?.user_metadata?.full_name || profile?.full_name) && (
                     <Link to="/my-profile" className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium border border-border hover:bg-muted transition-colors">
                        Przejdź do profilu
                     </Link>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* Wzorcowe oferty — inspiracja dla pracodawcy */}
        <SampleJobsPanel />

        {/* Post Job Form */}
        <AnimatePresence>
          {showForm && (
            <JobPostForm
              onSubmit={handleStructuredSubmit}
              onCancel={() => setShowForm(false)}
              submitting={submitting}
            />
          )}
        </AnimatePresence>

        {domainJobs.length === 0 ? (
          <EmptyState
            title="Brak ogłoszeń"
            description="Twoja tablica jest pusta. Dodaj pierwsze ogłoszenie, aby zacząć przyciągać kandydatów."
            action={
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform"
              >
                Dodaj ogłoszenie
              </button>
            }
          />
        ) : (
          <LocalErrorBoundary label="Lista ogłoszeń">
          <div className="space-y-3">
            <AnimatePresence>
              {domainJobs.map((job, i) => {
                const jobApps = applicationsByJob[job.id] || [];
                const shortlisted = jobApps.filter((a) => a.status === "shortlisted");
                const aiCount = jobApps.filter((a) => a.matchResult && a.matchResult.score >= 75 && a.status !== "shortlisted").length;
                const isExpanded = expandedJob === job.id;
                const isAnalyzed = analyzedJob === job.id;
                const avgScore = getAvgMatchScore(job.id);
                const balance = shortlist.getBalance(job.id);
                const noSlots = balance.totalSlots === 0;
                const slotsExhausted = balance.totalSlots > 0 && balance.remainingSlots === 0;

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
                    <div className="px-4 pt-3 flex gap-3 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {jobApps.length} aplikacji</span>
                      <span className={`flex items-center gap-1 ${slotsExhausted ? "text-destructive font-semibold" : balance.remainingSlots > 0 ? "text-accent font-semibold" : ""}`}>
                        <Layers className="w-3 h-3" />
                        {noSlots
                          ? "0 slotów (kup pakiet)"
                          : `${balance.usedSlots}/${balance.totalSlots} shortlista · ${balance.remainingSlots} wolnych`}
                      </span>
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {aiCount} rekomendacji AI</span>
                      <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {avgScore}% śr. match</span>
                      {jobApps.length > 0 && (() => {
                        const newest = jobApps.reduce((latest, a) =>
                          new Date(a.appliedAt) > new Date(latest.appliedAt) ? a : latest
                        );
                        return (
                          <span className="flex items-center gap-1 ml-auto text-muted-foreground/70">
                            Ostatnia: {timeAgo(newest.appliedAt)}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="p-4 pt-2">
                      {/* Contextual Suggestion UX */}
                      {(job.tags.length === 0 || job.description.length < 50) && job.employerId === user?.id && (
                        <div className="mb-3 p-2.5 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-xs text-yellow-500 font-medium">
                          Wskazówka: Dodaj tagi i dłuższy opis, aby poprawić jakość dopasowania kandydatów.
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0 overflow-hidden">
                          {job.logo?.startsWith("http") ? (
                            <img src={job.logo} alt={job.company} className="w-full h-full object-contain" />
                          ) : (
                            <span>{job.logo}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display text-sm font-semibold text-foreground truncate">{job.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">{job.company} · {job.location}</p>
                        </div>
                        {job.employerId === user?.id && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={async () => {
                                if (hidePending) return;
                                setHidePending(job.id);
                                try {
                                  if (job.status === "hidden") {
                                    await unhideJob(job.id);
                                    toast.success("Oferta opublikowana ponownie");
                                  } else {
                                    await hideJob(job.id);
                                    toast.success("Oferta ukryta");
                                  }
                                  refetch();
                                } catch { toast.error("Nie udało się zmienić statusu"); }
                                finally { setHidePending(null); }
                              }}
                              disabled={hidePending === job.id}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                              title={job.status === "hidden" ? "Opublikuj" : "Ukryj"}
                            >
                              {job.status === "hidden" ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleDelete(job.id)} className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <PackagePurchaseButton
                          jobId={job.id}
                          balance={balance}
                          onPurchase={(size) => shortlist.purchasePackage(job.id, size)}
                        />
                        <button
                          onClick={() => {
                            setAnalyzedJob(isAnalyzed ? null : job.id);
                            setExpandedJob(null);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isAnalyzed ? "bg-primary text-primary-foreground" : "bg-accent/15 text-accent hover:bg-accent/25"
                          }`}
                        >
                          <BarChart3 className="w-3.5 h-3.5" /> Rekomendacje AI
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

                    {/* Shortlist section (paid) */}
                    {(shortlisted.length > 0 || (isExpanded && jobApps.length > 0)) && (
                      <div className="px-4 pb-3 border-t border-border pt-3">
                        <h5 className="text-xs font-semibold text-accent uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" /> Shortlista ({shortlisted.length}{balance.totalSlots > 0 ? `/${balance.totalSlots}` : ""})
                        </h5>
                        {shortlisted.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {shortlisted.map((app) => (
                              <ShortlistChip
                                key={app.id}
                                app={app}
                                onRemove={() => handleAdvanceStatus(app.id, "applied")}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="py-2">
                            <EmptyState
                              icon={<Layers className="w-4 h-4 text-muted-foreground" />}
                              title="Pusta shortlista"
                              description={noSlots
                                ? "Aby shortlistować kandydatów dla tej oferty, kup pakiet 5, 10 lub 20 slotów."
                                : "Kliknij „Dodaj do shortlisty” przy kandydacie, aby zużyć 1 slot."}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Regular applicant list */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 border-t border-border pt-3">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Kandydaci ({jobApps.length}) — wg dopasowania
                              </h5>
                            </div>
                            {jobApps.length === 0 ? (
                              <EmptyState
                                title="Brak kandydatów"
                                description="Ogłoszenie jest aktywne, ale nikt jeszcze nie zaaplikował. Upewnij się, że opis i tagi są zachęcające."
                              />
                            ) : (
                              <div className="space-y-2">
                                {jobApps.map((app) => (
                                  <CandidateCard
                                     key={app.id}
                                    app={app}
                                    jobId={job.id}
                                    onView={() => handleViewCandidate(app)}
                                    onAdvanceStatus={handleAdvanceStatus}
                                    onShortlist={() => shortlist.shortlistCandidate(app.id, "employer", jobApps, job.id)}
                                    shortlistFull={shortlistFull}
                                    chatMessages={messaging.getMessages(app.id)}
                                    onSendMessage={(content) => messaging.sendMessage(app.id, content)}
                                    isChatOpen={messaging.isChatOpen(app.id)}
                                    onUnlockChat={() => messaging.unlockChat(app.id)}
                                    currentUserId={user?.id}
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
                              <BarChart3 className="w-3.5 h-3.5" /> Ranking dopasowania
                            </h5>
                            {jobApps.length === 0 ? (
                              <EmptyState 
                                title="Brak kandydatów" 
                                description="Poczekaj na pierwsze aplikacje, aby zobaczyć ranking dopasowania." 
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
          </LocalErrorBoundary>
        )}
      </main>

      <CandidateProfileModal
        candidate={selectedCandidate?.candidate || null}
        match={selectedCandidate?.match}
        applicationStatus={selectedCandidate?.applicationStatus}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
};

// ── Shortlist chip ────────────────────────────────────────────────────────────

function ShortlistChip({
  app,
  onRemove,
  isReplaceTarget,
  onReplace,
}: {
  app: EnrichedEmployerApplication;
  onRemove: () => void;
  isReplaceTarget: boolean;
  onReplace: () => void;
}) {
  const name = getCandidateDisplayName(app);
  const avatar = getCandidateAvatar(app);
  const isAi = app.source === "ai";

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
        isReplaceTarget
          ? "border-destructive/40 bg-destructive/5 cursor-pointer hover:bg-destructive/10"
          : "border-border bg-secondary/50"
      }`}
      onClick={isReplaceTarget ? onReplace : undefined}
    >
      <span className="text-sm">{avatar}</span>
      <span className="font-medium text-foreground max-w-[100px] truncate">{name}</span>
      {app.matchResult && (
        <span className={`text-[10px] font-bold ${
          app.matchResult.score >= 75 ? "text-accent" : app.matchResult.score >= 50 ? "text-yellow-400" : "text-muted-foreground"
        }`}>
          {app.matchResult.score}%
        </span>
      )}
      {isAi ? (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-semibold flex items-center gap-0.5">
          <Zap className="w-2.5 h-2.5" /> Auto
        </span>
      ) : (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold flex items-center gap-0.5">
          <UserCheck className="w-2.5 h-2.5" /> Ręcznie
        </span>
      )}
      {!isReplaceTarget && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-muted-foreground hover:text-destructive ml-0.5"
          title="Usuń z shortlisty"
        >
          ×
        </button>
      )}
      {isReplaceTarget && (
        <span className="text-[9px] text-destructive font-medium">← zamień</span>
      )}
    </div>
  );
}

// ── Candidate card ────────────────────────────────────────────────────────────

function CandidateCard({
  app,
  jobId,
  onView,
  onAdvanceStatus,
  onShortlist,
  shortlistFull,
  chatMessages,
  onSendMessage,
  isChatOpen,
  onUnlockChat,
  currentUserId,
}: {
  app: EnrichedEmployerApplication;
  jobId: string;
  onView: () => void;
  onAdvanceStatus: (appId: string, status: ApplicationStatus) => void;
  onShortlist: () => void;
  shortlistFull: boolean;
  chatMessages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isChatOpen: boolean;
  onUnlockChat: () => void;
  currentUserId?: string;
}) {
  const name = getCandidateDisplayName(app);
  const avatar = getCandidateAvatar(app);
  const candidate = app.candidate;
  const matchResult = app.matchResult;
  const activity = getActivityLabel(candidate?.lastActive);
  const isShortlisted = app.status === "shortlisted";

  return (
    <div className={`rounded-lg border overflow-hidden ${
      isShortlisted ? "bg-accent/5 border-accent/20" : "bg-secondary/50 border-border"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 cursor-pointer hover:bg-secondary/80 transition-colors"
        onClick={onView}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm shrink-0">{avatar}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">
              {candidate?.title || "–"} · {candidate?.seniority || "–"}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] font-medium ${activity.color}`}>{activity.label}</span>
              <StatusBadge status={app.status as ApplicationStatus} />
              {app.source !== "candidate" && <SourceLabel source={app.source as any} />}
              {chatMessages.length > 0 && (
                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                  💬 {chatMessages.length}
                </span>
              )}
            </div>
          </div>
          {matchResult && <MatchBadge result={matchResult} compact />}
        </div>
        <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5 shrink-0 pl-11 sm:pl-0">
          <div className="flex gap-1 flex-wrap">
            {(candidate ? getAllSkills(candidate) : []).slice(0, 2).map((skill) => (
              <span key={skill} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{skill}</span>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {(app.status === "applied" || app.status === "viewed") && (
              <button
                onClick={(e) => { e.stopPropagation(); onShortlist(); }}
                className="text-[10px] px-2 py-0.5 rounded bg-accent/15 text-accent hover:bg-accent/25 flex items-center gap-0.5"
                title={shortlistFull ? "Shortlista pełna — wybierz kandydata do zamiany" : "Dodaj do shortlisty"}
              >
                <UserCheck className="w-3 h-3" />
                {shortlistFull ? "Zamień na shortliście" : "Shortlista"}
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
        currentUserId={currentUserId}
        applicationStatus={app.status as ApplicationStatus}
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
  app: EnrichedEmployerApplication;
  rank: number;
  onViewProfile: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const name = getCandidateDisplayName(app);
  const avatar = getCandidateAvatar(app);
  const matchResult = app.matchResult;
  const activity = getActivityLabel(app.candidate?.lastActive);

  return (
    <div className="rounded-lg bg-secondary/50 border border-border overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-3 flex items-center gap-3 text-left">
        <span className="text-xs font-bold text-muted-foreground w-5">#{rank}</span>
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm shrink-0">{avatar}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{app.candidate?.title || "–"} · {app.candidate?.seniority || "–"}</p>
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
