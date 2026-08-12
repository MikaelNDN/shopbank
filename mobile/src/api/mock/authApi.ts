import { StorageKeys, storageService } from '@/services/storageService';
import type { MockUser } from '@/services/mockData';
import type {
  AuthCredentials,
  AuthResponse,
  RegisterPayload,
  User,
} from '@/types/user';

function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function makeFakeToken(user: User): string {
  const payload = JSON.stringify({
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: Date.now(),
  });
  return `mock.${encodeURIComponent(payload)}.signature`;
}

function stripPassword(user: MockUser): User {
  const { password: _password, ...rest } = user;
  return rest;
}

export const authApi = {
  async login({ email, password }: AuthCredentials): Promise<AuthResponse> {
    const users =
      (await storageService.get<MockUser[]>(StorageKeys.USERS)) ?? [];
    const found = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!found || found.password !== password) {
      throw new Error('Credenciais inválidas');
    }
    const user = stripPassword(found);
    return delay({ user, token: makeFakeToken(user) });
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const users =
      (await storageService.get<MockUser[]>(StorageKeys.USERS)) ?? [];
    const exists = users.some(
      (u) => u.email.toLowerCase() === payload.email.trim().toLowerCase(),
    );
    if (exists) {
      throw new Error('E-mail já cadastrado');
    }
    const newUser: MockUser = {
      id: `user-${Date.now()}`,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      cpf: payload.cpf.replace(/\D/g, ''),
      role: 'CLIENT',
      password: payload.password,
      createdAt: new Date().toISOString(),
    };
    const next = [...users, newUser];
    await storageService.set(StorageKeys.USERS, next);
    const user = stripPassword(newUser);
    return delay({ user, token: makeFakeToken(user) });
  },
};
