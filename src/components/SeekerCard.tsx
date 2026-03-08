import { MapPin, Clock, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import type { Seeker } from "@/data/seekers"; // Legacy type — kept for backward compat
import { getActivityLabel } from "@/components/CandidateProfileModal";

interface SeekerCardProps {
  seeker: Seeker & { last_active?: string; seniority?: string; work_mode?: string };
  index: number;
  onClick?: () => void;
}

const SeekerCard = ({ seeker, index, onClick }: SeekerCardProps) => {
  const activity = getActivityLabel(seeker.last_active);

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
          {seeker.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-bold text-foreground truncate">{seeker.name}</h3>
          <p className="text-sm text-primary font-medium">{seeker.title}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
            {seeker.availability}
          </span>
          <span className={`text-[10px] font-medium ${activity.color}`}>
            {activity.label}
          </span>
        </div>
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed mb-4">{seeker.bio}</p>

      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          {seeker.location}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-accent" />
          {seeker.experience}
        </span>
        {seeker.seniority && (
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            {seeker.seniority}
          </span>
        )}
        {seeker.work_mode && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {seeker.work_mode}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {seeker.skills.map((skill) => (
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
