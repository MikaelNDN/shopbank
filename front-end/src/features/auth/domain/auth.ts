export type UserRole = "CLIENT" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  role: UserRole;
  active: boolean;
  customerId?: string;
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

export interface AuthSession {
  user: User;
  token: string;
}

export interface AuthRepository {
  login(credentials: AuthCredentials): Promise<AuthSession>;
  register(payload: RegisterPayload): Promise<AuthSession>;
  me(token?: string): Promise<User>;
}

