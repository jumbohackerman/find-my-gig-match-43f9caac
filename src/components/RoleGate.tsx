/**
 * Role-aware gate component — renders children only if the user's profile role matches.
 * Shows a redirect or fallback for unauthorized users.
 */

import { Navigate } from "react-router-dom";
import { useRequireRole } from "@/hooks/useRequireRole";
import type { UserRole } from "@/domain/models";

interface RoleGateProps {
  role: UserRole;
  /** Where to redirect unauthorized users. Defaults to "/" */
  redirectTo?: string;
  children: React.ReactNode;
}

const RoleGate = ({ role, redirectTo = "/", children }: RoleGateProps) => {
  const { allowed, loading } = useRequireRole(role);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Ładowanie...</p>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RoleGate;
