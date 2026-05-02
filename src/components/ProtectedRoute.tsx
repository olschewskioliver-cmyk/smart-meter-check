import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/lib/database.types";

interface Props {
  children: React.ReactNode;
  role: UserRole;
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

  // If auth is done but profile is still null, the DB row is missing — boot back to login
  if (!profile) return <Navigate to="/login" replace />;

  if (profile.role !== role) {
    return <Navigate to={profile.role === "office" ? "/office" : "/check"} replace />;
  }

  return <>{children}</>;
}
