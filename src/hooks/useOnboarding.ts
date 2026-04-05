/**
 * useOnboarding — manages onboarding state through the provider registry.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import { useCandidateProfile } from "@/hooks/useCandidateProfile";
import type { Candidate } from "@/domain/models";

export interface OnboardingData {
  title: string;
  skills: string[];
  salaryMin: number;
  salaryMax: number;
  remotePreference: string;
  seniority: string;
}

export function useOnboarding() {
  const { user, profile } = useAuth();
  const { get: getPref, set: setPref } = usePreferences();
  const { updateProfile } = useCandidateProfile();

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && profile?.role === "candidate") {
      getPref(`onboarded_${user.id}`).then((val) => {
        if (!val) setShowOnboarding(true);
      });
    }
  }, [user, profile, getPref]);

  const completeOnboarding = useCallback(
    async (data: OnboardingData) => {
      updateProfile({
        title: data.title,
        skills: { advanced: data.skills, intermediate: [], beginner: [] },
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        workMode: data.remotePreference as Candidate["workMode"],
        seniority: data.seniority as Candidate["seniority"],
      });
      if (user) {
        await setPref(`onboarded_${user.id}`, "true");
      }
      setShowOnboarding(false);
    },
    [user, setPref, updateProfile],
  );

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  return { showOnboarding, completeOnboarding, dismissOnboarding };
}
