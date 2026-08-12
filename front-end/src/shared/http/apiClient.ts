import axios from "axios";
import { appEnv } from "@/shared/config/env";
import { clearAuthToken, getAuthToken } from "./authTokenStorage";
import { normalizeApiError } from "./apiError";

export const apiClient = axios.create({
  baseURL: appEnv.apiBaseUrl,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const normalized = normalizeApiError(error);
    if (normalized.status === 401 || normalized.status === 403) {
      clearAuthToken();
    }
    return Promise.reject(normalized);
  },
);

