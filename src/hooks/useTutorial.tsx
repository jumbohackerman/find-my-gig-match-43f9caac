// Tutorial context — single shared state across Navbar, pages and TutorialHost
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";

interface TutorialCtx {
  showTutorial: boolean;
  tutorialRole: "candidate" | "employer";
  completeTutorial: () => Promise<void>;
  replayTutorial: () => void;
}

const Ctx = createContext<TutorialCtx>({
  showTutorial: false,
  tutorialRole: "candidate",
  completeTutorial: async () => {},
  replayTutorial: () => {},
});

export const TutorialProvider = ({ children }: { children: ReactNode }) => {
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

  return (
    <Ctx.Provider value={{ showTutorial, tutorialRole, completeTutorial, replayTutorial }}>
      {children}
    </Ctx.Provider>
  );
};

export const useTutorial = () => useContext(Ctx);
