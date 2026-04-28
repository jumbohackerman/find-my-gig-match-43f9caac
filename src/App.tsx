import { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import RoleGate from "@/components/RoleGate";
import CookieBanner from "@/components/CookieBanner";
import SplashScreen from "@/components/SplashScreen";
import WelcomeTutorial from "@/components/WelcomeTutorial";
import { TutorialProvider, useTutorial } from "@/hooks/useTutorial";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Employer from "./pages/Employer";
import MyProfile from "./pages/MyProfile";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { loading, user } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const TutorialHost = () => {
  const { showTutorial, tutorialRole, completeTutorial } = useTutorial();
  if (!showTutorial) return null;
  return <WelcomeTutorial role={tutorialRole} onComplete={completeTutorial} />;
};

/** Show Landing to guests, redirect employer to /employer, candidates see Index */
const HomeRedirect = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Landing />;
  if (profile?.role === "employer") return <Navigate to="/employer" replace />;
  return <>{children}</>;
};

const App = () => {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashFinish = useCallback(() => setSplashDone(true), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TutorialProvider>
          <TooltipProvider>
            {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/" element={<HomeRedirect><Index /></HomeRedirect>} />
                <Route path="/browse" element={<Navigate to="/" replace />} />
                <Route
                  path="/my-profile"
                  element={
                    <ProtectedRoute>
                      <RoleGate role="candidate" redirectTo="/employer">
                        <MyProfile />
                      </RoleGate>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/employer"
                  element={
                    <ProtectedRoute>
                      <RoleGate role="employer" redirectTo="/">
                        <Employer />
                      </RoleGate>
                    </ProtectedRoute>
                  }
                />
                <Route path="/profile" element={<Navigate to="/my-profile" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <CookieBanner />
              <TutorialHost />
            </BrowserRouter>
          </TooltipProvider>
        </TutorialProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
