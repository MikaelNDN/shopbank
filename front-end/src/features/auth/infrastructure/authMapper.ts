import type { AuthCredentials, AuthSession, RegisterPayload, User, UserRole } from "../domain/auth";
import type { BackendLoginResponse, BackendRegisterRequest, BackendUserResponse } from "./authDtos";

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

import { decodeJwtPayload } from "@/shared/lib/jwt";

function isUserRole(value: unknown): value is UserRole {
  return value === "CLIENT" || value === "ADMIN";
}

function readTextClaim(claims: Record<string, unknown> | null, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = claims?.[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function buildFallbackUser(token: string, credentials: AuthCredentials): User {
  const claims = decodeJwtPayload(token);
  const email = readTextClaim(claims, ["email", "sub"]) ?? credentials.email;
  const roleClaim = claims?.role;
  const role = isUserRole(roleClaim) ? roleClaim : "CLIENT";
  const id = readTextClaim(claims, ["customerId", "id", "sub"]) ?? email;
  const name = readTextClaim(claims, ["fullName", "name"]) ?? email.split("@")[0] ?? email;
  const cpf = readTextClaim(claims, ["cpf"]);

  return {
    id,
    name,
    email,
    cpf,
    role,
    active: true,
    customerId: readTextClaim(claims, ["customerId"]),
  };
}

export function mapUserResponse(dto: BackendUserResponse): User {
  return {
    id: dto.customerId ? String(dto.customerId) : String(dto.id),
    name: dto.fullName ?? dto.email.split("@")[0] ?? dto.email,
    email: dto.email,
    cpf: dto.cpf ?? undefined,
    role: dto.role,
    active: dto.active,
    customerId: dto.customerId ? String(dto.customerId) : undefined,
  };
}

export function mapRegisterRequest(payload: RegisterPayload): BackendRegisterRequest {
  return {
    email: payload.email.trim(),
    password: payload.password,
    fullName: payload.name.trim(),
    cpf: digits(payload.cpf),
  };
}

export function mapLoginSession(
  response: BackendLoginResponse,
  credentials: AuthCredentials,
  me?: BackendUserResponse | null,
): AuthSession {
  return {
    token: response.token,
    user: me ? mapUserResponse(me) : buildFallbackUser(response.token, credentials),
  };
}
