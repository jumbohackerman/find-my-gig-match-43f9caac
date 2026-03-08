import { motion, AnimatePresence } from "framer-motion";
import StatusPipeline from "@/components/employer/StatusPipeline";
import { STATUS_LABELS, STATUS_COLORS, type ApplicationStatus } from "@/types/application";
import type { ApplicationWithJob } from "@/hooks/useApplications";

interface Props {
  applications: ApplicationWithJob[];
  loading: boolean;
  onJobClick?: (job: ApplicationWithJob["job"]) => void;
}

const ApplicationStatusList = ({ applications, loading, onJobClick }: Props) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">Nie masz jeszcze żadnych aplikacji.</p>
        <p className="text-muted-foreground text-xs mt-1">Przeglądaj oferty i aplikuj jednym gestem!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {applications.map((app, i) => {
          const status = app.status as ApplicationStatus;
          const job = app.job;
          if (!job) return null;

          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-gradient rounded-xl border border-border overflow-hidden cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => onJobClick?.(job)}
            >
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl shrink-0">
                  {job.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-sm font-semibold text-foreground truncate">
                    {job.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {job.company} · {job.location}
                  </p>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[status] || "bg-secondary text-secondary-foreground"}`}
                    >
                      Status: {STATUS_LABELS[status] || status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-4 pb-3">
                <StatusPipeline currentStatus={status} />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ApplicationStatusList;
