import { apiClient } from '@/api/apiClient';
import type {
  AuthCredentials,
  AuthResponse,
  RegisterPayload,
  User,
  UserRole,
} from '@/types/user';
import { unformatCpf } from '@/utils/formatCpf';
import { decodeJwt } from '@/utils/jwt';

interface BackendUserResponse {
  id: number;
  email: string;
  role: UserRole;
  active: boolean;
  customerId?: number;
  fullName?: string;
  cpf?: string;
}

interface BackendLoginResponse {
  token: string;
}

function buildUserFromToken(
  token: string,
  fallbackEmail: string,
  override?: Partial<User>,
): User {
  const claims = decodeJwt(token);
  const email = (claims?.sub as string) ?? claims?.email ?? fallbackEmail;
  const role = (claims?.role as UserRole) ?? 'CLIENT';
  return {
    id: override?.id ?? email,
    email,
    name: override?.name ?? email.split('@')[0] ?? email,
    cpf: override?.cpf,
    role,
    createdAt: new Date().toISOString(),
  };
}

async function fetchMe(token: string): Promise<BackendUserResponse | null> {
  try {
    const { data } = await apiClient.get<BackendUserResponse>('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch {
    return null;
  }
}

function userFromMe(me: BackendUserResponse, token: string): User {
  const claims = decodeJwt(token);
  const role = (claims?.role as UserRole) ?? me.role ?? 'CLIENT';
  const isAdmin = role === 'ADMIN';
  return {
    id: me.customerId
      ? String(me.customerId)
      : isAdmin
        ? String(me.id)
        : me.email,
    email: me.email,
    name: me.fullName ?? me.email.split('@')[0] ?? me.email,
    cpf: me.cpf,
    role,
    createdAt: new Date().toISOString(),
  };
}

export const authApiHttp = {
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    const { data } = await apiClient.post<BackendLoginResponse>(
      '/api/auth/login',
      credentials,
    );
    const me = await fetchMe(data.token);
    const user = me
      ? userFromMe(me, data.token)
      : buildUserFromToken(data.token, credentials.email);
    return { token: data.token, user };
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data: created } = await apiClient.post<BackendUserResponse>(
      '/api/auth/register',
      {
        email: payload.email,
        password: payload.password,
        fullName: payload.name,
        cpf: unformatCpf(payload.cpf),
      },
    );
    const { data: loggedIn } = await apiClient.post<BackendLoginResponse>(
      '/api/auth/login',
      { email: payload.email, password: payload.password },
    );
    return {
      token: loggedIn.token,
      user: buildUserFromToken(loggedIn.token, payload.email, {
        id: created.customerId ? String(created.customerId) : payload.email,
        name: created.fullName ?? payload.name,
        cpf: created.cpf ?? unformatCpf(payload.cpf),
      }),
    };
  },
};
