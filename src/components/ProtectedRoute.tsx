import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/lib/database.types";

interface Props {
  children: React.ReactNode;
  role: UserRole;
}

function dashboardFor(role: UserRole) {
  if (role === "office" || role === "admin") return "/office";
  return "/check";
}

export function ProtectedRoute({ children, role }: Props) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-office">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-office-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/login" replace />;
  if (!profile.is_active) return <Navigate to="/login" replace />;

  // Admin can access any protected route
  if (profile.role === "admin") return <>{children}</>;

  if (profile.role !== role) {
    return <Navigate to={dashboardFor(profile.role)} replace />;
  }

  return <>{children}</>;
}
