import type { UserRole } from "../domain/auth";

export interface BackendLoginRequest {
  email: string;
  password: string;
}

export interface BackendLoginResponse {
  token: string;
}

export interface BackendRegisterRequest {
  email: string;
  password: string;
  fullName: string;
  cpf: string;
}

export interface BackendUserResponse {
  id: number;
  email: string;
  role: UserRole;
  active: boolean;
  customerId?: number | null;
  fullName?: string | null;
  cpf?: string | null;
}

