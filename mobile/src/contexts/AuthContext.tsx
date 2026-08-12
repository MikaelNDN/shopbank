import { router } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { authApi } from '@/api/authApi';
import { apiClient, setUnauthorizedHandler, USE_MOCK } from '@/api/apiClient';
import { StorageKeys, storageService } from '@/services/storageService';
import type {
  AuthCredentials,
  AuthResponse,
  RegisterPayload,
  User,
  UserRole,
} from '@/types/user';
import { isJwtValidShape } from '@/utils/jwt';

interface BackendMe {
  id: number;
  email: string;
  role: UserRole;
  active: boolean;
  customerId?: number;
  fullName?: string;
  cpf?: string;
}

async function fetchMeRefresh(token: string): Promise<User | null> {
  try {
    const { data } = await apiClient.get<BackendMe>('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const isAdmin = data.role === 'ADMIN';
    return {
      id: data.customerId
        ? String(data.customerId)
        : isAdmin
          ? String(data.id)
          : data.email,
      email: data.email,
      name: data.fullName ?? data.email.split('@')[0] ?? data.email,
      cpf: data.cpf,
      role: data.role,
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthCredentials) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await storageService.get<AuthResponse>(StorageKeys.AUTH);
      if (stored?.user && stored?.token) {
        const tokenOk = USE_MOCK ? true : isJwtValidShape(stored.token);
        if (tokenOk) {
          if (USE_MOCK) {
            setUser(stored.user);
            setToken(stored.token);
          } else {
            const freshUser = await fetchMeRefresh(stored.token);
            if (freshUser) {
              setUser(freshUser);
              setToken(stored.token);
              await storageService.set(StorageKeys.AUTH, {
                user: freshUser,
                token: stored.token,
              });
            } else {
              await storageService.remove(StorageKeys.AUTH);
            }
          }
        } else {
          await storageService.remove(StorageKeys.AUTH);
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const persist = useCallback(async (response: AuthResponse) => {
    await storageService.set(StorageKeys.AUTH, response);
    setUser(response.user);
    setToken(response.token);
  }, []);

  const login = useCallback<AuthContextValue['login']>(
    async (credentials) => {
      const response = await authApi.login(credentials);
      await persist(response);
      return response.user;
    },
    [persist],
  );

  const register = useCallback<AuthContextValue['register']>(
    async (payload) => {
      const response = await authApi.register(payload);
      await persist(response);
      return response.user;
    },
    [persist],
  );

  const logout = useCallback<AuthContextValue['logout']>(async () => {
    await storageService.remove(StorageKeys.AUTH);
    setUser(null);
    setToken(null);
    router.replace('/(auth)/login');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setToken(null);
      router.replace('/(auth)/login');
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, token, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
