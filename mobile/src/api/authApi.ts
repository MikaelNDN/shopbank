import { USE_MOCK } from '@/api/apiClient';
import { authApi as authMock } from '@/api/mock/authApi';
import { authApiHttp } from '@/api/http/authApi';
import type {
  AuthCredentials,
  AuthResponse,
  RegisterPayload,
} from '@/types/user';

interface AuthApi {
  login: (credentials: AuthCredentials) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
}

export const authApi: AuthApi = USE_MOCK ? authMock : authApiHttp;
