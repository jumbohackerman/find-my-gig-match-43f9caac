import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import type { Job } from "@/data/jobs";

interface Props {
  jobs: Job[];
  onApply: (job: Job) => void;
}

const SavedList = ({ jobs, onApply }: Props) => {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">Brak zapisanych ofert.</p>
        <p className="text-muted-foreground text-xs mt-1">Użyj przycisku ⭐ aby zapisać oferty na później!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {jobs.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-gradient rounded-xl p-4 border border-border flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0">
              {job.logo}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-sm font-semibold text-foreground truncate">{job.title}</h4>
              <p className="text-xs text-muted-foreground">{job.company} · {job.location}</p>
            </div>
            <button
              onClick={() => onApply(job)}
              className="px-3 py-1.5 rounded-lg btn-gradient text-primary-foreground text-xs font-medium hover:scale-105 transition-transform"
            >
              Aplikuj
            </button>
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 shrink-0" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SavedList;
