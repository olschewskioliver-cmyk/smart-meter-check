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

  // Profile not loaded yet — wait (avoids flash-redirect on slow networks)
  if (!profile) return null;

  if (profile.role !== role) {
    return <Navigate to={profile.role === "office" ? "/office" : "/check"} replace />;
  }

  return <>{children}</>;
}
