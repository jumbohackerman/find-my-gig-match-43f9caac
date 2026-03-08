import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import RoleGate from "@/components/RoleGate";
import Index from "./pages/Index";
import Profiles from "./pages/Profiles";
import Employer from "./pages/Employer";
import MyProfile from "./pages/MyProfile";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { loading, user } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
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
              path="/profiles"
              element={
                <ProtectedRoute>
                  <RoleGate role="employer" redirectTo="/">
                    <Profiles />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
