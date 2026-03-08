/**
 * Role-aware route guard hook.
 *
 * Usage:
 *   const { allowed, loading } = useRequireRole("employer");
 *   if (loading) return <Spinner />;
 *   if (!allowed) return <Navigate to="/" />;
 *
 * Also exported: <RoleGate role="employer"> wrapper component.
 */

import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/domain/models";

interface RoleCheck {
  /** true when the profile role matches the required role */
  allowed: boolean;
  /** true while auth or profile is still loading */
  loading: boolean;
  /** the current user's role (null if not loaded yet) */
  currentRole: string | null;
}

export function useRequireRole(requiredRole: UserRole): RoleCheck {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return { allowed: false, loading: true, currentRole: null };
  }

  if (!user || !profile) {
    return { allowed: false, loading: false, currentRole: null };
  }

  return {
    allowed: profile.role === requiredRole,
    loading: false,
    currentRole: profile.role,
  };
}
