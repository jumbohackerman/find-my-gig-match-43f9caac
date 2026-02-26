import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Heart, Briefcase, RotateCcw } from "lucide-react";
import SwipeCard from "@/components/SwipeCard";
import AppliedList from "@/components/AppliedList";
import { jobs, type Job } from "@/data/jobs";

const Index = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [skippedJobs, setSkippedJobs] = useState<Job[]>([]);
  const [showApplied, setShowApplied] = useState(false);

  const remainingJobs = jobs.slice(currentIndex);
  const isFinished = currentIndex >= jobs.length;

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      const job = jobs[currentIndex];
      if (!job) return;

      if (direction === "right") {
        setAppliedJobs((prev) => [job, ...prev]);
      } else {
        setSkippedJobs((prev) => [job, ...prev]);
      }
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex]
  );

  const handleReset = () => {
    setCurrentIndex(0);
    setAppliedJobs([]);
    setSkippedJobs([]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">JobSwipe</h1>
        </div>

        <button
          onClick={() => setShowApplied(!showApplied)}
          className="relative px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
        >
          Applied
          {appliedJobs.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full btn-gradient text-primary-foreground text-xs flex items-center justify-center font-bold">
              {appliedJobs.length}
            </span>
          )}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-md mx-auto w-full">
        {showApplied ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-foreground">
                Your Applications ({appliedJobs.length})
              </h2>
              <button
                onClick={() => setShowApplied(false)}
                className="text-sm text-primary hover:underline"
              >
                Back to swiping
              </button>
            </div>
            <AppliedList jobs={appliedJobs} />
          </motion.div>
        ) : isFinished ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-4xl">
              🎉
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">All caught up!</h2>
            <p className="text-muted-foreground text-sm mb-2">
              You applied to {appliedJobs.length} job{appliedJobs.length !== 1 ? "s" : ""} and skipped {skippedJobs.length}.
            </p>
            <div className="flex gap-3 mt-6 justify-center">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Start Over
              </button>
              <button
                onClick={() => setShowApplied(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-gradient text-primary-foreground text-sm font-medium shadow-glow transition-transform hover:scale-105"
              >
                View Applied
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Card stack */}
            <div className="relative w-full h-[420px] mb-8">
              <AnimatePresence>
                {remainingJobs.slice(0, 2).map((job, i) => (
                  <SwipeCard
                    key={job.id}
                    job={job}
                    onSwipe={handleSwipe}
                    isTop={i === 0}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => handleSwipe("left")}
                className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <button
                onClick={() => handleSwipe("right")}
                className="w-16 h-16 rounded-full btn-gradient flex items-center justify-center text-primary-foreground shadow-glow hover:scale-110 transition-transform"
              >
                <Heart className="w-7 h-7" />
              </button>
            </div>

            {/* Counter */}
            <p className="text-muted-foreground text-xs mt-4">
              {currentIndex + 1} / {jobs.length}
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
