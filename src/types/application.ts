export type ApplicationStatus = "applied" | "shortlisted" | "viewed" | "interview" | "hired" | "closed";
export type ApplicationSource = "candidate" | "ai" | "employer";

export interface DemoApplication {
  id: string;
  candidateId: string;
  jobId: string;
  status: ApplicationStatus;
  source: ApplicationSource;
  appliedAt: string;
}

export interface DemoMessage {
  id: string;
  applicationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export const STATUS_ORDER: ApplicationStatus[] = ["applied", "shortlisted", "viewed", "interview", "hired"];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Aplikowano",
  shortlisted: "Shortlista",
  viewed: "Wyświetlono",
  interview: "Rozmowa",
  hired: "Zatrudniony",
  closed: "Stanowisko zamknięte",
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  applied: "bg-secondary text-secondary-foreground",
  shortlisted: "bg-accent/15 text-accent border border-accent/30",
  viewed: "bg-primary/15 text-primary border border-primary/30",
  interview: "bg-yellow-400/15 text-yellow-500 border border-yellow-400/30",
  hired: "bg-accent/20 text-accent border border-accent/40",
  closed: "bg-muted text-muted-foreground",
};
