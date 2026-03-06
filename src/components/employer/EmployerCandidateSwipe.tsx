import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Users } from "lucide-react";
import type { Seeker } from "@/data/seekers";
import type { MatchResult } from "@/lib/matchScoring";
import MatchBadge from "@/components/MatchBadge";
import EmptyState from "./EmptyState";

interface RankedCandidate {
  seeker: Seeker;
  match: MatchResult;
}

interface Props {
  candidates: RankedCandidate[];
  picksRemaining: number;
  maxPicks: number;
  onSwipeRight: (seekerId: string) => void;
  onSkip: () => void;
  currentIndex: number;
  onViewProfile: (seeker: Seeker, match: MatchResult) => void;
}

const EmployerCandidateSwipe = ({
  candidates,
  picksRemaining,
  maxPicks,
  onSwipeRight,
  onSkip,
  currentIndex,
  onViewProfile,
}: Props) => {
  if (candidates.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-5 h-5 text-muted-foreground" />}
        title="No candidates available"
        description="No candidates yet. Share this job listing to receive applications."
      />
    );
  }

  if (currentIndex >= candidates.length || picksRemaining <= 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">
          {picksRemaining <= 0
            ? "All swipe picks used for this job."
            : "You've reviewed all candidates."}
        </p>
      </div>
    );
  }

  const current = candidates[currentIndex];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Swipe picks remaining: <span className="font-bold text-foreground">{picksRemaining}</span> / {maxPicks}
        </p>
        <p className="text-xs text-muted-foreground">
          {currentIndex + 1} / {candidates.length}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.seeker.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="card-gradient rounded-xl border border-border p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-2xl">
              {current.seeker.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{current.seeker.name}</p>
              <p className="text-xs text-muted-foreground">{current.seeker.title} · {current.seeker.experience}</p>
              <p className="text-xs text-muted-foreground">{current.seeker.location}</p>
            </div>
            <MatchBadge result={current.match} compact />
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {current.seeker.skills.slice(0, 4).map((skill) => {
              const matched = current.match.matchedSkills.includes(skill);
              return (
                <span
                  key={skill}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    matched
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {skill}
                </span>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onSkip}
              className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                onViewProfile(current.seeker, current.match);
              }}
              className="px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-muted transition-colors"
            >
              View Profile
            </button>
            <button
              onClick={() => onSwipeRight(current.seeker.id)}
              className="w-12 h-12 rounded-full btn-gradient flex items-center justify-center text-primary-foreground shadow-glow hover:scale-110 transition-transform"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default EmployerCandidateSwipe;
