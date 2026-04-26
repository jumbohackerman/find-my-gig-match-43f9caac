import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Loader2 } from "lucide-react";
import type { Job } from "@/domain/models";

interface Props {
  jobs: Job[];
  onApply: (job: Job) => Promise<void> | void;
  onJobClick?: (job: Job) => void;
}

const SavedList = ({ jobs, onApply, onJobClick }: Props) => {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleApply = async (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    if (pendingId) return;
    setPendingId(job.id);
    try {
      await onApply(job);
    } finally {
      setPendingId(null);
    }
  };

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
        {jobs.map((job, i) => {
          const isClosed = job.status === "closed";
          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card-gradient rounded-xl p-4 border flex items-center gap-3 cursor-pointer transition-colors ${
                isClosed ? "border-border opacity-75" : "border-border hover:border-primary/30"
              }`}
              onClick={() => onJobClick?.(job)}
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0 overflow-hidden">
                {job.logo?.startsWith("http") ? (
                  <img src={job.logo} alt={job.company} className="w-full h-full object-contain" />
                ) : (
                  <span>{job.logo}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-display text-sm font-semibold text-foreground truncate">{job.title}</h4>
                  {isClosed && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/15 text-destructive border border-destructive/20 shrink-0">
                      Zamknięta
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{job.company} · {job.location}</p>
              </div>
              <button
                onClick={(e) => handleApply(e, job)}
                disabled={pendingId === job.id || isClosed}
                className="px-3 py-1.5 rounded-lg btn-gradient text-primary-foreground text-xs font-medium hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-1.5"
                title={isClosed ? "Rekrutacja zakończona" : undefined}
              >
                {pendingId === job.id ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Aplikuję…</>
                ) : (
                  "Aplikuj"
                )}
              </button>
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 shrink-0" />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default SavedList;
