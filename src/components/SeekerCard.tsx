import { MapPin, Clock, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import type { Candidate } from "@/domain/models";
import { getActivityLabel, getAllSkills } from "@/domain/models";

interface SeekerCardProps {
  candidate: Candidate;
  index: number;
  onClick?: () => void;
}

const SeekerCard = ({ candidate, index, onClick }: SeekerCardProps) => {
  const activity = getActivityLabel(candidate.lastActive);
  const skills = getAllSkills(candidate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="card-gradient rounded-2xl border border-border shadow-card p-5 cursor-pointer hover:border-primary/30 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-3xl">
          👤
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-bold text-foreground truncate">{candidate.fullName}</h3>
          <p className="text-sm text-primary font-medium">{candidate.title}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
            {candidate.availability}
          </span>
          <span className={`text-[10px] font-medium ${activity.color}`}>
            {activity.label}
          </span>
        </div>
      </div>

      {candidate.summary && (
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">{candidate.summary}</p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          {candidate.location}
        </span>
        {candidate.experienceEntries.length > 0 && (
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-accent" />
            {candidate.experienceEntries.length} pozycji
          </span>
        )}
        {candidate.seniority && (
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            {candidate.seniority}
          </span>
        )}
        {candidate.workMode && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {candidate.workMode}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium"
          >
            {skill}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

export default SeekerCard;
