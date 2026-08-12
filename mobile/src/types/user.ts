export type UserRole = 'CLIENT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  cpf: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
