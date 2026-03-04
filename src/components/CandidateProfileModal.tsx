import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, Clock, Globe, Github, Linkedin, ExternalLink,
  FileText, Briefcase,
} from "lucide-react";
import type { Seeker } from "@/data/seekers";
import type { MatchResult } from "@/lib/matchScoring";
import MatchBadge from "@/components/MatchBadge";

interface ExperienceEntry {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

interface Links {
  portfolio?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}

interface ExtendedSeeker extends Seeker {
  seniority?: string;
  summary?: string;
  work_mode?: string;
  experience_entries?: ExperienceEntry[];
  links?: Links;
  cv_url?: string;
  last_active?: string;
  salary_min?: number;
  salary_max?: number;
}

interface Props {
  seeker: ExtendedSeeker | null;
  match?: MatchResult;
  onClose: () => void;
}

function getActivityLabel(lastActive?: string): { label: string; color: string } {
  if (!lastActive) return { label: "Unknown", color: "text-muted-foreground" };
  const diff = Date.now() - new Date(lastActive).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return { label: "Active today", color: "text-accent" };
  if (days <= 3) return { label: `Active ${days}d ago`, color: "text-yellow-400" };
  if (days <= 7) return { label: "Active 1 week ago", color: "text-muted-foreground" };
  return { label: `Active ${days}d ago`, color: "text-muted-foreground" };
}

const CandidateProfileModal = ({ seeker, match, onClose }: Props) => {
  if (!seeker) return null;

  const activity = getActivityLabel(seeker.last_active);
  const coreSkills = seeker.skills.slice(0, 5);
  const additionalSkills = seeker.skills.slice(5);
  const links = seeker.links || {};
  const hasLinks = links.portfolio || links.github || links.linkedin || links.website;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg max-h-[85vh] overflow-y-auto card-gradient rounded-2xl border border-border p-5 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10">
            <X className="w-5 h-5" />
          </button>

          {/* Hero */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center text-4xl">
              {seeker.avatar}
            </div>
            <div className="flex-1">
              <h3 className="font-display text-xl font-bold text-foreground">{seeker.name}</h3>
              <p className="text-sm text-primary font-medium">{seeker.title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {seeker.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {seeker.experience}
                </span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
              {seeker.availability}
            </span>
            {seeker.seniority && (
              <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                {seeker.seniority}
              </span>
            )}
            {seeker.work_mode && (
              <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                {seeker.work_mode}
              </span>
            )}
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${activity.color} bg-secondary`}>
              {activity.label}
            </span>
          </div>

          {/* Match */}
          {match && (
            <div className="mb-4 p-3 rounded-xl bg-secondary/50 border border-border">
              <MatchBadge result={match} />
            </div>
          )}

          {/* Summary */}
          {seeker.summary && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Summary</h4>
              <p className="text-sm text-foreground leading-relaxed">{seeker.summary}</p>
            </div>
          )}

          {/* Skills */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Skills
            </h4>
            {coreSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {coreSkills.map((s) => {
                  const matched = match?.matchedSkills.includes(s);
                  return (
                    <span
                      key={s}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        matched
                          ? "bg-accent/15 text-accent border border-accent/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s}
                    </span>
                  );
                })}
              </div>
            )}
            {additionalSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {additionalSkills.map((s) => (
                  <span key={s} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-muted text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Experience */}
          {seeker.experience_entries && seeker.experience_entries.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Experience</h4>
              <div className="space-y-3">
                {seeker.experience_entries.map((entry, idx) => (
                  <div key={idx} className="pl-3 border-l-2 border-border">
                    <p className="text-sm font-medium text-foreground">
                      {entry.title}{entry.company ? ` — ${entry.company}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mb-1">
                      {entry.startDate} – {entry.endDate}
                    </p>
                    {entry.bullets?.filter(Boolean).map((b, bi) => (
                      <p key={bi} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="mt-0.5">•</span> {b}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Salary */}
          {seeker.salary_min && seeker.salary_min > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Salary Expectation
              </h4>
              <p className="text-sm text-foreground">
                ${seeker.salary_min}k – ${seeker.salary_max || seeker.salary_min}k / year
              </p>
            </div>
          )}

          {/* Links */}
          {hasLinks && (
            <div className="mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Links</h4>
              <div className="flex gap-2">
                {links.portfolio && (
                  <a href={links.portfolio} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
                    <Globe className="w-4 h-4 text-primary" />
                  </a>
                )}
                {links.github && (
                  <a href={links.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
                    <Github className="w-4 h-4 text-primary" />
                  </a>
                )}
                {links.linkedin && (
                  <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
                    <Linkedin className="w-4 h-4 text-primary" />
                  </a>
                )}
                {links.website && (
                  <a href={links.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary hover:bg-muted transition-colors">
                    <ExternalLink className="w-4 h-4 text-primary" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* CV */}
          {seeker.cv_url && (
            <div className="pt-2 border-t border-border">
              <span className="flex items-center gap-1.5 text-xs text-accent">
                <FileText className="w-3.5 h-3.5" /> CV available
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CandidateProfileModal;

export { getActivityLabel };
export type { ExtendedSeeker };
