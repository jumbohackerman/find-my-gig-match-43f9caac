/**
 * Repository interfaces — define data access contracts.
 * Implementations can be mock (demo), Supabase, or any other backend.
 * UI code depends ONLY on these interfaces, never on a specific provider.
 */

import type {
  Job,
  Candidate,
  Application,
  ApplicationStatus,
  ApplicationSource,
  ApplicationWithJob,
  EnrichedEmployerApplication,
  UserProfile,
  Message,
  Notification,
} from "@/domain/models";
import type {
  ShortlistJobBalance,
  ShortlistEvent,
  PackageSize,
} from "@/domain/shortlist";

// ─── Jobs ────────────────────────────────────────────────────────────────────

export interface JobRepository {
  /** List all active jobs, optionally filtered */
  list(filters?: JobFilters): Promise<Job[]>;
  /** List jobs owned by employer + system-seeded jobs */
  listForEmployer(employerId: string): Promise<Job[]>;
  /** Get a single job by ID */
  getById(id: string): Promise<Job | null>;
  /** Create a new job posting (employer) */
  create(job: Omit<Job, "id" | "posted">): Promise<Job>;
  /** Update an existing job posting */
  update(id: string, data: Partial<Omit<Job, "id" | "posted">>): Promise<Job>;
  /** Archive/close a job (sets status to "closed") */
  archive(id: string): Promise<void>;
  /** Permanently delete a job posting */
  delete(id: string): Promise<void>;
}

export interface JobFilters {
  location?: string;
  type?: string;
  salaryMin?: number;
  salaryMax?: number;
  tags?: string[];
  search?: string;
}

// ─── Candidates ──────────────────────────────────────────────────────────────

export interface CandidateRepository {
  /** List all candidates (talent pool) */
  list(filters?: CandidateFilters): Promise<Candidate[]>;
  /** Get candidate by user ID */
  getByUserId(userId: string): Promise<Candidate | null>;
  /** Create or update candidate profile */
  upsert(userId: string, data: Partial<Candidate>): Promise<Candidate>;
}

export interface CandidateFilters {
  search?: string;
  skills?: string[];
  location?: string;
  seniority?: string;
}

// ─── Applications ────────────────────────────────────────────────────────────

export interface ApplicationRepository {
  /** Candidate-side: list own applications with job data */
  listForCandidate(candidateId: string): Promise<ApplicationWithJob[]>;
  /**
   * Employer-side: list enriched applications for employer's jobs.
   * matchResult is NOT populated — the hook computes it.
   */
  listForEmployer(employerId: string): Promise<EnrichedEmployerApplication[]>;
  /**
   * Apply to a job — compound operation.
   * For static/demo jobs, the implementation may upsert the job row
   * before creating the application (e.g. via the apply_to_job RPC).
   */
  apply(job: Job, candidateId: string, source?: ApplicationSource): Promise<Application>;
  /** Update application status (with optional source tracking) */
  updateStatus(applicationId: string, status: ApplicationStatus, source?: ApplicationSource): Promise<void>;
  /** Subscribe to candidate's application changes. Returns unsubscribe fn. */
  subscribeForCandidate(candidateId: string, onPayload: (payload: any) => void): () => void;
  /** Subscribe to application changes for employer's jobs. Returns unsubscribe fn. */
  subscribeForEmployer(employerId: string, onChange: () => void): () => void;
  /** Count applications by status for a specific job */
  countByStatus(jobId: string): Promise<Record<ApplicationStatus, number>>;
}

// ─── Messages ────────────────────────────────────────────────────────────────

export interface MessageRepository {
  /** List messages for an application */
  listByApplication(applicationId: string): Promise<Message[]>;
  /** Send a message */
  send(applicationId: string, senderId: string, content: string): Promise<Message>;
  /** Subscribe to new messages (returns unsubscribe fn) */
  subscribe(applicationId: string, onMessage: (msg: Message) => void): () => void;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface NotificationRepository {
  /** List notifications for a user */
  listForUser(userId: string): Promise<Notification[]>;
  /** Mark a notification as read */
  markRead(notificationId: string): Promise<void>;
  /** Mark all notifications as read */
  markAllRead(userId: string): Promise<void>;
  /** Get unread count for a user */
  countUnread(userId: string): Promise<number>;
  /** Subscribe to new notifications. Returns unsubscribe fn. */
  subscribe(userId: string, onNotification: (notification: Notification) => void): () => void;
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export interface ProfileRepository {
  getByUserId(userId: string): Promise<UserProfile | null>;
  update(userId: string, data: Partial<UserProfile>): Promise<UserProfile>;
}

// ─── Saved Jobs ──────────────────────────────────────────────────────────────

export interface SavedJobRepository {
  /** List saved job IDs for a user */
  listIds(userId: string): Promise<string[]>;
  /** Save a job */
  save(userId: string, jobId: string): Promise<void>;
  /** Remove a saved job */
  remove(userId: string, jobId: string): Promise<void>;
  /** Check if a job is saved */
  isSaved(userId: string, jobId: string): Promise<boolean>;
}

// ─── Swipe Events ────────────────────────────────────────────────────────────

export type SwipeDirection = "left" | "right" | "save";

export interface SwipeEventRepository {
  /** Record a swipe event */
  record(userId: string, jobId: string, direction: SwipeDirection): Promise<void>;
  /** Get all swiped job IDs (to exclude from feed) */
  listSwipedJobIds(userId: string): Promise<string[]>;
  /** Clear all swipe history (reset feed) */
  clear(userId: string): Promise<void>;
}

// ─── Preferences (localStorage / DB adapter) ─────────────────────────────────

export interface PreferencesRepository {
  /** Get a preference value by key */
  get(userId: string, key: string): Promise<string | null>;
  /** Set a preference value */
  set(userId: string, key: string, value: string): Promise<void>;
  /** Delete a preference */
  delete(userId: string, key: string): Promise<void>;
}

// ─── Shortlist (paid monetization) ───────────────────────────────────────────

export interface ShortlistRepository {
  /** Per-job slot balances for an employer */
  getBalances(employerId: string): Promise<Record<string, ShortlistJobBalance>>;
  /** Buy a 5/10/20 slot package for a job */
  purchasePackage(jobId: string, size: PackageSize): Promise<string>;
  /** Atomic shortlist (consumes 1 slot, snapshots, audits). Idempotent. */
  shortlistCandidate(applicationId: string): Promise<{
    event_id: string;
    status: "shortlisted" | "already_shortlisted";
    slot_consumed: boolean;
    slots_after?: number;
    package_size?: number;
  }>;
  /** Audit trail for a job */
  listEventsForJob(jobId: string): Promise<ShortlistEvent[]>;
  /** Set of application IDs already shortlisted for a job */
  listShortlistedApplicationIds(jobId: string): Promise<Set<string>>;
}

// ─── Candidate notes (employer-internal) ─────────────────────────────────────

export interface CandidateNote {
  id: string;
  employerId: string;
  applicationId: string;
  candidateId: string;
  jobId: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateNotesRepository {
  listForApplication(applicationId: string): Promise<CandidateNote[]>;
  create(params: {
    employerId: string;
    applicationId: string;
    candidateId: string;
    jobId: string;
    note: string;
  }): Promise<CandidateNote>;
  delete(noteId: string): Promise<void>;
}
