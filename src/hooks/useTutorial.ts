import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";

export function useTutorial() {
  const { user, profile } = useAuth();
  const { get: getPref, set: setPref } = usePreferences();
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialRole, setTutorialRole] = useState<"candidate" | "employer">("candidate");

  useEffect(() => {
    if (!user || !profile?.role) return;
    if (profile.role !== "candidate" && profile.role !== "employer") return;
    const role = profile.role as "candidate" | "employer";
    setTutorialRole(role);
    getPref(`tutorial_seen_${role}_${user.id}`).then((val) => {
      if (!val) setShowTutorial(true);
    });
  }, [user, profile, getPref]);

  const completeTutorial = useCallback(async () => {
    setShowTutorial(false);
    if (user && profile?.role) {
      await setPref(`tutorial_seen_${profile.role}_${user.id}`, "true");
    }
  }, [user, profile, setPref]);

  const replayTutorial = useCallback(() => {
    if (profile?.role === "candidate" || profile?.role === "employer") {
      setTutorialRole(profile.role as "candidate" | "employer");
      setShowTutorial(true);
    }
  }, [profile]);

  return { showTutorial, tutorialRole, completeTutorial, replayTutorial };
}
