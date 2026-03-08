/**
 * Domain models — provider-agnostic, single source of truth for all entities.
 * These types are used by UI, repositories, and services.
 * Never import Supabase types or data-layer types into this file.
 *
 * Naming: camelCase fields, no snake_case. DB mappers handle conversion.
 */

// ─── Shared value types ──────────────────────────────────────────────────────

export type Currency = "PLN" | "EUR" | "USD";
export type SalaryPeriod = "month" | "hour" | "year";

export interface SalaryRange {
  min: number;       // in base currency units (e.g. PLN, not thousands)
  max: number;
  currency: Currency;
  period: SalaryPeriod;
}

// ─── Enums / unions ──────────────────────────────────────────────────────────

export type Seniority = "Junior" | "Mid" | "Senior" | "Lead";
export type WorkMode = "Zdalnie" | "Hybrydowo" | "Stacjonarnie";
export type EmploymentType = "Full-time" | "Contract" | "Part-time";
export type JobType = "Full-time" | "Part-time" | "Contract" | "Remote";
export type JobStatus = "active" | "closed" | "draft";
export type UserRole = "candidate" | "employer";

export type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "viewed"
  | "interview"
  | "hired"
  | "not_selected"
  | "position_closed";

export type ApplicationSource = "candidate" | "ai" | "employer";

export type NotificationType =
  | "status_change"
  | "new_message"
  | "shortlisted"
  | "interview_scheduled"
  | "hired";

// ─── Job ─────────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  /** Display string, e.g. "18 000 zł - 25 000 zł". Kept for backward compat. */
  salary: string;
  /** Structured salary — populated when parsing is possible. */
  salaryRange?: SalaryRange;
  type: JobType;
  description: string;
  tags: string[];
  posted: string;
  status?: JobStatus;
  employerId?: string;
  // Extended fields
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  aboutCompany?: string;
  teamSize?: string;
  seniority?: string;
  contractType?: string;
  applyUrl?: string;
}

// ─── Candidate ───────────────────────────────────────────────────────────────
//
// Canonical candidate model. Replaces legacy Seeker, ExtendedSeeker,
// and CandidateProfile types. Contains both DB-backed fields and
// display fields (name, avatar) that come from the profiles table.

export interface Candidate {
  id: string;
  userId: string;
  /** Display name — from profiles.full_name */
  name: string;
  /** Avatar emoji or URL — from profiles.avatar */
  avatar: string;
  title: string;
  location: string;
  bio: string;
  summary: string;
  skills: string[];
  seniority: Seniority;
  experience: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  availability: string;
  salaryMin: number;
  salaryMax: number;
  experienceEntries: ExperienceEntry[];
  links: CandidateLinks;
  cvUrl: string | null;
  lastActive: string;
  /** Future: pgvector embedding for semantic search */
  embedding?: number[];
}

export interface ExperienceEntry {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  description?: string;
  bullets: string[];
}

export interface CandidateLinks {
  portfolio?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}

// ─── Application ─────────────────────────────────────────────────────────────

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  status: ApplicationStatus;
  source: ApplicationSource;
  appliedAt: string;
}

// ─── Profile (auth-adjacent) ─────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  role: UserRole;
  avatar: string | null;
}

// ─── Message ─────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  applicationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

// ─── Notification ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  /** Optional reference to the related entity */
  referenceId?: string;
}

// ─── Match scoring (domain logic) ────────────────────────────────────────────

export interface MatchResult {
  score: number; // 0–100
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  skills: number;
  experience: number;
  salary: number;
  location: number;
  workMode: number;
}

// ─── Enriched types for UI ───────────────────────────────────────────────────

export interface ApplicationWithJob extends Application {
  job?: Job;
}

export interface EnrichedEmployerApplication extends Application {
  candidate?: Candidate;
  job?: Job;
  matchResult?: MatchResult;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse a Polish salary string into a SalaryRange */
export function parseSalaryString(salary: string): SalaryRange | null {
  const plnMatch = salary.match(/(\d[\d\s]*)\s*zł\s*-\s*(\d[\d\s]*)\s*zł/i);
  if (plnMatch) {
    return {
      min: parseInt(plnMatch[1].replace(/\s/g, ""), 10),
      max: parseInt(plnMatch[2].replace(/\s/g, ""), 10),
      currency: "PLN",
      period: "month",
    };
  }
  return null;
}

/** Activity label for a candidate based on lastActive timestamp */
export function getActivityLabel(lastActive?: string): { label: string; color: string } {
  if (!lastActive) return { label: "Nieznane", color: "text-muted-foreground" };
  const diff = Date.now() - new Date(lastActive).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return { label: "Aktywny dziś", color: "text-accent" };
  if (days <= 3) return { label: `Aktywny ${days} dni temu`, color: "text-yellow-400" };
  if (days <= 7) return { label: "Aktywny tydzień temu", color: "text-muted-foreground" };
  return { label: `Aktywny ${days} dni temu`, color: "text-muted-foreground" };
}
