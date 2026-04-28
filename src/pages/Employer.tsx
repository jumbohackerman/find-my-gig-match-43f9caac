import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { createFallbackCandidate } from "@/data/defaults";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Plus, Users, Trash2, Eye, ChevronDown, ChevronUp,
  BarChart3, Zap, Layers, UserCheck, EyeOff, Globe,
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
import JobPanel from "@/components/employer/JobPanel";
import AIShortlistSection from "@/components/employer/AIShortlistSection";
import { useEmployerMessages, type ChatMessage } from "@/hooks/useEmployerMessages";
import StatusBadge from "@/components/employer/StatusBadge";
import SourceLabel from "@/components/employer/SourceLabel";
import StatusPipeline from "@/components/employer/StatusPipeline";
import EmptyState from "@/components/employer/EmptyState";
import ChatPanel from "@/components/employer/ChatPanel";
import SampleJobsPanel from "@/components/employer/SampleJobsPanel";
import MarketResearchPanel from "@/components/employer/MarketResearchPanel";
import LocalErrorBoundary from "@/components/LocalErrorBoundary";
import Footer from "@/components/Footer";
import type { ApplicationStatus } from "@/types/application";
import { useAuth } from "@/hooks/useAuth";
import { hideJob, unhideJob } from "@/lib/moderation";
import { toast } from "sonner";
import { timeAgo } from "@/lib/timeAgo";
import CloseJobModal, { type ClosureReason } from "@/components/employer/CloseJobModal";
import { closeJob } from "@/hooks/useContactInvitations";
import { Lock } from "lucide-react";
import JobDetailModal from "@/components/JobDetailModal";

import { Progress } from "@/components/ui/progress";

const Employer = () => {
  const { user, profile } = useAuth();
  
  const { jobs: domainJobs, applicationsByJob, loading, refetch } = useEmployerDashboardData();
  const { createJob, createStructuredJob, deleteJob, submitting, EMPTY_FORM } = useEmployerJobs();
  const shortlist = useEmployerShortlist(user?.id, refetch);
  const appActions = useEmployerApplicationActions(refetch);
  const messaging = useEmployerMessages(user?.id);

  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<{ candidate: Candidate; match: MatchResult; applicationStatus?: ApplicationStatus } | null>(null);
  const [pendingShortlist, setPendingShortlist] = useState<{ app: EnrichedEmployerApplication; jobId: string; jobTitle: string } | null>(null);
  const [shortlistBusy, setShortlistBusy] = useState(false);
  const [activeView, setActiveView] = useState<"my-jobs" | "market">("my-jobs");

  const requestShortlist = (app: EnrichedEmployerApplication, jobId: string, jobTitle: string) => {
    setPendingShortlist({ app, jobId, jobTitle });
  };

  const confirmShortlist = async () => {
    if (!pendingShortlist) return;
    setShortlistBusy(true);
    const ok = await shortlist.shortlistCandidate(pendingShortlist.app.id, pendingShortlist.jobId);
    setShortlistBusy(false);
    if (ok) setPendingShortlist(null);
  };

  // Old form state removed — using JobPostForm component instead

  // ── Actions ─────────────────────────────────────────────────────────────────

  const [hidePending, setHidePending] = useState<string | null>(null);
  const [statusPending, setStatusPending] = useState<string | null>(null);
  const [closingJob, setClosingJob] = useState<{ id: string; title: string; company: string } | null>(null);
  const [deletingJob, setDeletingJob] = useState<{ id: string; title: string } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const handleCloseJob = async (reason: ClosureReason) => {
    if (!closingJob) return;
    try {
      await closeJob({
        job_id: closingJob.id,
        reason,
        job_title: closingJob.title,
        company_name: closingJob.company,
      });
      refetch();
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (/network|fetch|timeout|offline/i.test(msg)) {
        toast.error("Brak połączenia. Sprawdź internet i spróbuj ponownie.");
      } else {
        toast.error("Nie udało się zamknąć rekrutacji. Spróbuj ponownie.");
      }
    }
  };

  const handleAdvanceStatus = async (appId: string, newStatus: ApplicationStatus) => {
    if (statusPending) return;
    setStatusPending(appId);
    try {
      await appActions.advanceStatus(appId, newStatus);
      toast.success("Status zaktualizowany");
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (/invalid.*transition|state.*machine/i.test(msg)) {
        toast.error("Ta zmiana statusu nie jest dozwolona w tym etapie.");
      } else if (/network|fetch|timeout|offline/i.test(msg)) {
        toast.error("Brak połączenia. Spróbuj ponownie za chwilę.");
      } else {
        toast.error("Nie udało się zmienić statusu. Spróbuj ponownie.");
      }
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

  const confirmDelete = async () => {
    if (!deletingJob) return;
    setDeleteBusy(true);
    try {
      await deleteJob(deletingJob.id);
      refetch();
      toast.success(`Oferta "${deletingJob.title}" usunięta`);
      setDeletingJob(null);
    } catch (e: any) {
      toast.error(`Nie udało się usunąć oferty: ${e?.message || "spróbuj ponownie"}`);
    } finally {
      setDeleteBusy(false);
    }
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

      <main
        className={`flex-1 flex flex-col px-4 py-6 mx-auto w-full ${activeView === "market" ? "max-w-5xl" : "max-w-2xl"}`}
        data-testid="employer-dashboard"
      >
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">Panel pracodawcy</h2>
              <p className="text-muted-foreground text-sm mt-1">Zarządzaj ogłoszeniami, shortlistami i kandydatami.</p>
            </div>
            {activeView === "my-jobs" && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition-transform shrink-0 self-start sm:self-auto"
                data-testid="employer-add-job"
              >
                <Plus className="w-4 h-4" /> Dodaj ogłoszenie
              </button>
            )}
          </div>

          {/* Overview cards — quick at-a-glance metrics */}
          {activeView === "my-jobs" && domainJobs.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                {
                  label: "Aktywne oferty",
                  value: domainJobs.filter((j) => j.status !== "closed").length,
                  icon: "📋",
                },
                {
                  label: "Kandydaci łącznie",
                  value: Object.values(applicationsByJob).reduce((sum, apps) => sum + apps.length, 0),
                  icon: "👥",
                },
                {
                  label: "Gotowe do shortlisty",
                  value: domainJobs.filter((j) => {
                    const apps = applicationsByJob[j.id] || [];
                    return apps.length >= 10 && j.status !== "closed";
                  }).length,
                  icon: "⚡",
                },
                {
                  label: "Shortlisty wykonane",
                  value: domainJobs.filter((j) => {
                    const bal = shortlist.getBalance(j.id);
                    return bal.totalSlots > 0 && bal.remainingSlots < bal.totalSlots;
                  }).length,
                  icon: "✅",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className={`card-gradient rounded-xl border border-border p-3 text-center transition-colors ${
                    card.value > 0 ? "hover:border-primary/30" : "opacity-60"
                  }`}
                >
                  <span className="text-xl mb-1 block" aria-hidden="true">{card.icon}</span>
                  <p className="text-lg sm:text-xl font-bold text-foreground">{card.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{card.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* View tabs — clearly separates own management from read-only market research */}
          <div role="tablist" aria-label="Sekcje panelu pracodawcy" className="inline-flex items-center gap-1 p-1 mb-4 rounded-xl bg-secondary/40 border border-border">
            <button
              role="tab"
              aria-selected={activeView === "my-jobs"}
              onClick={() => setActiveView("my-jobs")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeView === "my-jobs"
                  ? "bg-background text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" /> Moje ogłoszenia
            </button>
            <button
              role="tab"
              aria-selected={activeView === "market"}
              onClick={() => setActiveView("market")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeView === "market"
                  ? "bg-background text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Przegląd rynku
            </button>
          </div>
        </motion.div>

        {activeView === "market" ? (
          <MarketResearchPanel />
        ) : (
        <>

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
                const isExpanded = expandedJob === job.id;
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
                    {/* Top metrics strip — quick at-a-glance numbers */}
                    <div className="px-4 pt-3 flex gap-3 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {jobApps.length} aplikacji</span>
                      <span className={`flex items-center gap-1 ${slotsExhausted ? "text-destructive font-semibold" : balance.remainingSlots > 0 ? "text-accent font-semibold" : ""}`}>
                        <Layers className="w-3 h-3" />
                        {noSlots
                          ? "0 slotów (kup pakiet)"
                          : `${balance.usedSlots}/${balance.totalSlots} shortlista · ${balance.remainingSlots} wolnych`}
                      </span>
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

                    {job.status === "closed" && (
                      <div className="mx-4 mb-1 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <Lock className="w-3 h-3" />
                        Rekrutacja zamknięta
                      </div>
                    )}

                    {jobApps.length < 10 && job.status !== "closed" && (
                      <div className="px-4 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                jobApps.length >= 10
                                  ? "bg-accent"
                                  : jobApps.length >= 7
                                    ? "bg-yellow-500"
                                    : "bg-primary"
                              }`}
                              style={{ width: `${Math.min((jobApps.length / 10) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                            {jobApps.length >= 10
                              ? "✓ Gotowe do shortlisty!"
                              : `${jobApps.length}/10 do shortlisty`}
                          </span>
                        </div>
                      </div>
                    )}

                    {jobApps.length >= 10 && !slotsExhausted && job.status !== "closed" && (
                      <div className="px-4 pb-2">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedJob(job.id);
                            setTimeout(() => {
                              document
                                .getElementById(`shortlist-section-${job.id}`)
                                ?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }, 200);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow hover:scale-[1.02] transition-transform"
                          data-testid={`employer-run-shortlist-${job.id}`}
                        >
                          <Zap className="w-4 h-4" aria-hidden="true" />
                          Uruchom Shortlistę ({jobApps.length} kandydatów)
                        </button>
                      </div>
                    )}

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
                          <h4 className="font-display text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${job.status === "closed" ? "bg-destructive" : "bg-accent"}`}
                              title={job.status === "closed" ? "Zamknięta" : "Aktywna"}
                              aria-hidden="true"
                            />
                            <span className="truncate">{job.title}</span>
                          </h4>
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
                            {job.status !== "closed" && (
                              <button
                                onClick={() => setClosingJob({ id: job.id, title: job.title, company: job.company })}
                                className="p-1.5 rounded-lg hover:bg-orange-500/20 text-muted-foreground hover:text-orange-400 transition-colors"
                                title="Zakończ rekrutację"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeletingJob({ id: job.id, title: job.title })}
                              className="p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                              title="Usuń ofertę"
                              aria-label={`Usuń ofertę ${job.title}`}
                            >
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
                          onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? "Zwiń panel oferty" : "Rozwiń panel oferty"}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {jobApps.length}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded panel: candidate list + analytics + AI shortlist */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          {/* Aplikacje — actionable candidate list (status, shortlist, chat) */}
                          {jobApps.length > 0 && (
                            <div className="px-4 pt-3 pb-2 border-t border-border space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="font-display text-sm font-bold text-foreground">
                                  Aplikacje ({jobApps.length})
                                </h3>
                                {balance.totalSlots > 0 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    Sloty shortlisty: {balance.remainingSlots}/{balance.totalSlots}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-2">
                                {jobApps.map((app) => (
                                  <CandidateCard
                                    key={app.id}
                                    app={app}
                                    jobId={job.id}
                                    employerId={user?.id}
                                    onView={() => handleViewCandidate(app)}
                                    onAdvanceStatus={handleAdvanceStatus}
                                    onShortlist={() => requestShortlist(app, job.id, job.title)}
                                    canShortlist={balance.remainingSlots > 0 && job.status !== "closed"}
                                    chatMessages={messaging.getMessages(app.id)}
                                    onSendMessage={(content) => messaging.sendMessage(app.id, content)}
                                    isChatOpen={messaging.isChatOpen(app.id)}
                                    onUnlockChat={() => {
                                      messaging.unlockChat(app.id);
                                      messaging.loadMessages(app.id);
                                    }}
                                    currentUserId={user?.id}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          <div id={`shortlist-section-${job.id}`}>
                            <AIShortlistSection jobId={job.id} jobApps={jobApps} />
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
        </>
        )}
      </main>

      <CandidateProfileModal
        candidate={selectedCandidate?.candidate || null}
        match={selectedCandidate?.match}
        applicationStatus={selectedCandidate?.applicationStatus}
        onClose={() => setSelectedCandidate(null)}
      />

      {pendingShortlist && (
        <ShortlistConfirmModal
          open={!!pendingShortlist}
          jobTitle={pendingShortlist.jobTitle}
          candidateLabel={getCandidateDisplayName(pendingShortlist.app)}
          balance={shortlist.getBalance(pendingShortlist.jobId)}
          busy={shortlistBusy}
          onConfirm={confirmShortlist}
          onCancel={() => setPendingShortlist(null)}
        />
      )}

      {closingJob && (
        <CloseJobModal
          open={!!closingJob}
          jobTitle={closingJob.title}
          onClose={() => setClosingJob(null)}
          onConfirm={handleCloseJob}
        />
      )}

      {deletingJob && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Potwierdź usunięcie oferty"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
          onClick={() => !deleteBusy && setDeletingJob(null)}
        >
          <div
            className="w-full max-w-md card-gradient rounded-2xl border border-border p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold text-foreground mb-2">Usunąć ofertę?</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Zamierzasz trwale usunąć ofertę:
            </p>
            <p className="text-sm font-semibold text-foreground mb-4 p-2 rounded-lg bg-secondary/50 border border-border break-words">
              {deletingJob.title}
            </p>
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive mb-4">
              <Trash2 className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Operacja jest nieodwracalna. Jeśli chcesz tylko zatrzymać rekrutację, użyj „Zakończ rekrutację”.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingJob(null)}
                disabled={deleteBusy}
                className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteBusy}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleteBusy ? "Usuwanie…" : "Usuń ofertę"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

// ── Candidate card ────────────────────────────────────────────────────────────

function CandidateCard({
  app,
  jobId,
  employerId,
  onView,
  onAdvanceStatus,
  onShortlist,
  canShortlist,
  chatMessages,
  onSendMessage,
  isChatOpen,
  onUnlockChat,
  currentUserId,
}: {
  app: EnrichedEmployerApplication;
  jobId: string;
  employerId?: string;
  onView: () => void;
  onAdvanceStatus: (appId: string, status: ApplicationStatus) => void;
  onShortlist: () => void;
  canShortlist: boolean;
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
  const SHORTLISTED_STATES: ApplicationStatus[] = ["shortlisted", "interview", "hired"];
  const isShortlisted = SHORTLISTED_STATES.includes(app.status as ApplicationStatus);
  const isAiRecommendation =
    !isShortlisted && matchResult !== undefined && matchResult.score >= 75;

  return (
    <div className={`rounded-lg border overflow-hidden ${
      isShortlisted ? "bg-accent/5 border-accent/20" : "bg-secondary/50 border-border"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 cursor-pointer hover:bg-secondary/80 transition-colors"
        onClick={onView}
      >
        <div
          className="flex items-center gap-3 flex-1 min-w-0"
          title={`${candidate?.title || "–"}\n${[
            ...(candidate?.skills?.advanced || []),
            ...(candidate?.skills?.intermediate || []),
          ].slice(0, 5).join(", ")}\n${candidate?.summary?.slice(0, 100) || ""}`}
        >
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
              {isAiRecommendation && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-semibold flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" /> Rekomendacja AI
                </span>
              )}
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
                className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-0.5 ${
                  canShortlist
                    ? "bg-accent/15 text-accent hover:bg-accent/25"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                title={canShortlist ? "Dodaj do shortlisty (1 slot)" : "Brak slotów — kliknij, aby kupić pakiet"}
              >
                <UserCheck className="w-3 h-3" />
                {canShortlist ? "Shortlista" : "Brak slotów"}
              </button>
            )}
            {app.status === "shortlisted" && (
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

      {/* Internal recruiter notes — only after shortlist */}
      {isShortlisted && employerId && (
        <CandidateNotesPanel
          applicationId={app.id}
          candidateId={app.candidateId}
          jobId={jobId}
          employerId={employerId}
        />
      )}
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
