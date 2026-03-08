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
} from "@/domain/models";

// ─── Jobs ────────────────────────────────────────────────────────────────────

export interface JobRepository {
  /** List all active jobs, optionally filtered */
  list(filters?: JobFilters): Promise<Job[]>;
  /** Get a single job by ID */
  getById(id: string): Promise<Job | null>;
  /** Create a new job posting (employer) */
  create(job: Omit<Job, "id" | "posted">): Promise<Job>;
  /** Delete a job posting */
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
  /** Employer-side: list enriched applications for employer's jobs */
  listForEmployer(employerId: string): Promise<EnrichedEmployerApplication[]>;
  /** Apply to a job */
  apply(jobId: string, candidateId: string, source?: ApplicationSource): Promise<Application>;
  /** Update application status */
  updateStatus(applicationId: string, status: ApplicationStatus, source?: ApplicationSource): Promise<void>;
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

// ─── Profiles ────────────────────────────────────────────────────────────────

export interface ProfileRepository {
  getByUserId(userId: string): Promise<UserProfile | null>;
  update(userId: string, data: Partial<UserProfile>): Promise<UserProfile>;
}
