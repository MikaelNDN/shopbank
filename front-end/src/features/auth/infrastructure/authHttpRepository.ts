import { apiClient } from "@/shared/http/apiClient";
import type { AuthCredentials, AuthRepository, AuthSession, RegisterPayload, User } from "../domain/auth";
import type { BackendLoginResponse, BackendUserResponse } from "./authDtos";
import { mapLoginSession, mapRegisterRequest, mapUserResponse } from "./authMapper";

async function fetchMe(token?: string): Promise<BackendUserResponse | null> {
  try {
    const { data } = await apiClient.get<BackendUserResponse>("/api/auth/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return data;
  } catch {
    return null;
  }
}

export const AuthHttpRepository: AuthRepository = {
  async login(credentials: AuthCredentials): Promise<AuthSession> {
    const { data } = await apiClient.post<BackendLoginResponse>("/api/auth/login", credentials);
    const me = await fetchMe(data.token);
    return mapLoginSession(data, credentials, me);
  },

  async register(payload: RegisterPayload): Promise<AuthSession> {
  const request = mapRegisterRequest(payload);
  await apiClient.post<BackendUserResponse>("/api/auth/register", request);
  return this.login({ email: payload.email, password: payload.password });
},
  
  async me(token?: string): Promise<User> {
    const { data } = await apiClient.get<BackendUserResponse>("/api/auth/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return mapUserResponse(data);
  },
};
