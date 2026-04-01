import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trash2 } from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";
import type { Job } from "@/domain/models";

interface ViewedEntry {
  job: Job;
  viewedAt: string;
}

interface Props {
  entries: ViewedEntry[];
  onJobClick?: (job: Job) => void;
  onClear?: () => void;
}

const RecentlyViewedList = ({ entries, onJobClick, onClear }: Props) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">Brak ostatnio przeglądanych ofert.</p>
        <p className="text-muted-foreground text-xs mt-1">Otwórz szczegóły oferty, aby pojawiła się tutaj.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.length > 3 && onClear && (
        <div className="flex justify-end">
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Wyczyść historię
          </button>
        </div>
      )}
      <AnimatePresence>
        {entries.map((entry, i) => (
          <motion.div
            key={entry.job.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="card-gradient rounded-xl p-4 border border-border flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => onJobClick?.(entry.job)}
          >
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0 overflow-hidden">
              {entry.job.logo?.startsWith("http") ? (
                <img src={entry.job.logo} alt={entry.job.company} className="w-full h-full object-contain" />
              ) : (
                <span>{entry.job.logo}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-sm font-semibold text-foreground truncate">{entry.job.title}</h4>
              <p className="text-xs text-muted-foreground">{entry.job.company} · {entry.job.location}</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70 shrink-0">
              <Clock className="w-3 h-3" />
              {timeAgo(entry.viewedAt)}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RecentlyViewedList;
