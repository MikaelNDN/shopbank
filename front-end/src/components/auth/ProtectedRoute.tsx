import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/store/auth";

interface Props {
  allowedRoles?: UserRole[];
  requireAdmin?: boolean; // legado
}

export function ProtectedRoute({ allowedRoles, requireAdmin = false }: Props) {
  const location = useLocation();
  const { user, token, loading } = useAuth();

  const roles = useMemo(
    () => allowedRoles ?? (requireAdmin ? (["ADMIN"] as UserRole[]) : undefined),
    [allowedRoles, requireAdmin],
  );

  useEffect(() => {
    if (token && user && roles && !roles.includes(user.role)) {
      toast.error("Acesso negado para o seu perfil");
    }
  }, [token, user, roles]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Validando sessão
      </div>
    );
  }

  if (!token || !user) {
    const isAdminRoute = roles?.includes("ADMIN") && !roles?.includes("CLIENT");
    return <Navigate
      to={isAdminRoute ? "/admin/login" : "/login"}
      state={{ from: location.pathname }}
      replace
    />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === "ADMIN" ? "/dashboard" : "/"} replace />;
  }
  return <Outlet />;
}

export function AdminRoute() {
  return <ProtectedRoute allowedRoles={["ADMIN"]} />;
}
