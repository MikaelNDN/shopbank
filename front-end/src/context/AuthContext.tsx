import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthHttpRepository } from "@/features/auth/infrastructure/authHttpRepository";
import type { RegisterPayload, User } from "@/features/auth/domain/auth";
import { queryKeys } from "@/shared/lib/queryKeys";
import { useAuthStore, AuthUser, UserRole } from "@/store/auth";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (credentials: { email: string; senha: string }) => Promise<AuthUser>;
  register: (payload: { nome: string; email: string; cpf: string; senha: string }) => Promise<AuthUser>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  updateUser: (patch: Partial<AuthUser>) => void;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    nome: user.name,
    email: user.email,
    cpf: user.cpf,
    role: user.role,
    customerId: user.customerId,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, token, login: setSession, logout: clearSession } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [clearSession, queryClient]);

  const meQuery = useQuery({
    queryKey: queryKeys.auth.detail("me"),
    queryFn: () => AuthHttpRepository.me(token ?? undefined),
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!token || !meQuery.data) return;
    setSession(toAuthUser(meQuery.data), token);
  }, [meQuery.data, setSession, token]);

  useEffect(() => {
    if (token && meQuery.isError) {
      clearSession();
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    }
  }, [clearSession, meQuery.isError, queryClient, token]);

  // BUG-03: usamos refs para obter referência estável ao mutateAsync,
  // evitando que loginMutation/registerMutation (novos objetos a cada render)
  // invalidem o useCallback e causem renders desnecessários.
  const loginMutation = useMutation({
    mutationFn: AuthHttpRepository.login,
    onSuccess: (session) => {
      const authUser = toAuthUser(session.user);
      setSession(authUser, session.token);
      queryClient.setQueryData(queryKeys.auth.detail("me"), session.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: AuthHttpRepository.register,
    onSuccess: (session) => {
      const authUser = toAuthUser(session.user);
      setSession(authUser, session.token);
      queryClient.setQueryData(queryKeys.auth.detail("me"), session.user);
    },
  });

  const loginMutateRef = useRef(loginMutation.mutateAsync);
  loginMutateRef.current = loginMutation.mutateAsync;

  const registerMutateRef = useRef(registerMutation.mutateAsync);
  registerMutateRef.current = registerMutation.mutateAsync;

  const login = useCallback(async (credentials: { email: string; senha: string }) => {
    const session = await loginMutateRef.current({
      email: credentials.email,
      password: credentials.senha,
    });
    return toAuthUser(session.user);
  }, []);

  const register = useCallback(async (payload: { nome: string; email: string; cpf: string; senha: string }) => {
    const session = await registerMutateRef.current({
      name: payload.nome,
      email: payload.email,
      cpf: payload.cpf,
      password: payload.senha,
    } satisfies RegisterPayload);
    return toAuthUser(session.user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    queryClient.removeQueries({ queryKey: queryKeys.auth.all });
  }, [clearSession, queryClient]);

  const hasRole = useCallback((roles: UserRole[]) => {
    return !!user && roles.includes(user.role);
  }, [user]);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    if (user && token) setSession({ ...user, ...patch }, token);
  }, [setSession, token, user]);

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    const freshUser = await queryClient.fetchQuery({
      queryKey: queryKeys.auth.detail("me"),
      queryFn: () => AuthHttpRepository.me(token),
      staleTime: 0,
    });
    const authUser = toAuthUser(freshUser);
    setSession(authUser, token);
    return authUser;
  }, [queryClient, setSession, token]);

  const loading =
    loginMutation.isPending ||
    registerMutation.isPending ||
    (!!token && !user && meQuery.isLoading);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      hasRole,
      updateUser,
      refreshUser,
    }),
    [hasRole, loading, login, logout, refreshUser, register, token, updateUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
