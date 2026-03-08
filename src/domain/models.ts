/**
 * Domain models — provider-agnostic, single source of truth for all entities.
 * These types are used by UI, repositories, and services.
 * Never import Supabase types into this file.
 */

// ─── Job ─────────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  salary: string;
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

export type JobType = "Full-time" | "Part-time" | "Contract" | "Remote";
export type JobStatus = "active" | "closed" | "draft";

// ─── Candidate ───────────────────────────────────────────────────────────────

export interface Candidate {
  id: string;
  userId: string;
  title: string;
  location: string;
  bio: string;
  summary: string;
  skills: string[];
  seniority: Seniority;
  experience: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  salaryMin: number;
  salaryMax: number;
  availability: string;
  experienceEntries: ExperienceEntry[];
  links: CandidateLinks;
  cvUrl: string | null;
  lastActive: string;
}

export type Seniority = "Junior" | "Mid" | "Senior" | "Lead";
export type WorkMode = "Zdalnie" | "Hybrydowo" | "Stacjonarnie";
export type EmploymentType = "Full-time" | "Contract" | "Part-time";

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

export type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "viewed"
  | "interview"
  | "hired"
  | "not_selected"
  | "position_closed";

export type ApplicationSource = "candidate" | "ai" | "employer";

// ─── Profile (auth-adjacent) ─────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  role: UserRole;
  avatar: string | null;
}

export type UserRole = "candidate" | "employer";

// ─── Message ─────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  applicationId: string;
  senderId: string;
  content: string;
  createdAt: string;
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
  candidateProfile?: UserProfile;
  job?: Job;
  matchResult?: MatchResult;
}
