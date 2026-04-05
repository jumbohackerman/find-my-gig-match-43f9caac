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
export type JobStatus = "active" | "closed" | "draft" | "hidden";
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
  salary: string;
  salaryRange?: SalaryRange;
  type: JobType;
  description: string;
  tags: string[];
  posted: string;
  status?: JobStatus;
  employerId?: string;
  summary?: string;
  aboutRole?: string;
  responsibilities?: string[];
  requirements?: string[];
  niceToHave?: string[];
  benefits?: string[];
  aboutCompany?: string;
  recruitmentSteps?: string[];
  highlights?: string[];
  teamSize?: string;
  seniority?: string;
  workMode?: string;
  contractType?: string;
  experienceLevel?: string;
  applyUrl?: string;
}

// ─── Candidate ───────────────────────────────────────────────────────────────

export interface SkillsByLevel {
  advanced: string[];
  intermediate: string[];
  beginner: string[];
}

export interface ExperienceEntry {
  job_title: string;
  company_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description_points: string[];
}

export interface CandidateLinks {
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
  website_url?: string;
}

export interface Language {
  name: string;
  level: string;
}

export interface Candidate {
  id: string;
  userId: string;
  fullName: string;
  title: string;
  location: string;
  summary: string;
  seniority: Seniority;
  workMode: WorkMode;
  employmentType: EmploymentType;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  availability: string;
  skills: SkillsByLevel;
  experienceEntries: ExperienceEntry[];
  links: CandidateLinks;
  languages: Language[];
  primaryIndustry: string;
  profileCompleteness: number;
  cvUrl: string | null;
  lastActive: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Flatten structured skills into a single array (for scoring, search, display) */
export function getAllSkills(candidate: Candidate): string[] {
  const s = candidate.skills;
  return [...(s.advanced || []), ...(s.intermediate || []), ...(s.beginner || [])];
}

/** Default empty skills object */
export function emptySkills(): SkillsByLevel {
  return { advanced: [], intermediate: [], beginner: [] };
}

/** Default empty links object */
export function emptyLinks(): CandidateLinks {
  return { portfolio_url: "", github_url: "", linkedin_url: "", website_url: "" };
}

/** Convert Candidate to ScoringCandidate for match scoring */
export function toScoringCandidate(c: Candidate): {
  skills: string[];
  seniority: string;
  salaryMin: number;
  salaryMax: number;
  workMode: string;
  location: string;
  availability?: string;
} {
  return {
    skills: getAllSkills(c),
    seniority: c.seniority,
    salaryMin: c.salaryMin,
    salaryMax: c.salaryMax,
    workMode: c.workMode,
    location: c.location,
    availability: c.availability,
  };
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
  referenceId?: string;
}

// ─── Match scoring (re-exported from domain/scoring) ─────────────────────────

import type { MatchResult as _MatchResult, ScoreBreakdown as _ScoreBreakdown, DimensionScore as _DimensionScore } from "@/domain/scoring/types";
export type MatchResult = _MatchResult;
export type ScoreBreakdown = _ScoreBreakdown;
export type DimensionScore = _DimensionScore;

// ─── Enriched types for UI ───────────────────────────────────────────────────

export interface ApplicationWithJob extends Application {
  job?: Job;
}

export interface EnrichedEmployerApplication extends Application {
  candidate?: Candidate;
  job?: Job;
  matchResult?: MatchResult;
}

// ─── Legacy helpers ──────────────────────────────────────────────────────────

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
