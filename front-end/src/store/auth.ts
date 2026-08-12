import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isTokenExpired } from "@/shared/lib/jwt";
import type { UserRole } from "@/features/auth/domain/auth";

export type { UserRole };

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  role: UserRole;
  customerId?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

type LegacyUserRole = UserRole | "CLIENTE" | "VENDEDOR";
type PersistedAuthState = {
  user?: (Omit<AuthUser, "role"> & { role: LegacyUserRole }) | null;
  token?: string | null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      isAuthenticated: () => {
        const token = get().token;
        if (!token) return false;
        if (isTokenExpired(token)) {
          set({ user: null, token: null });
          return false;
        }
        return true;
      },
      isAdmin: () => get().user?.role === "ADMIN",
    }),
    {
      name: "shopbank-auth",
      // Migra papéis antigos (CLIENTE/VENDEDOR) para o novo modelo (CLIENT/ADMIN)
      migrate: (persisted: unknown) => {
        const state = persisted as PersistedAuthState;
        if (state.user?.role === "CLIENTE" || state.user?.role === "VENDEDOR") {
          state.user.role = "CLIENT";
        }
        return state;
      },
      version: 2,
    },
  ),
);
