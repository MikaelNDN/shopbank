import axios, { AxiosError, type AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { StorageKeys, storageService } from '@/services/storageService';
import type { AuthResponse } from '@/types/user';

const DEFAULT_API_BASE_URL = 'http://localhost:8080';
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

function getExpoDevHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.platform?.hostUri;
  const host = hostUri?.split(':')[0];
  if (!host || LOCAL_HOSTNAMES.has(host)) return null;
  return host;
}

function normalizeApiBaseUrl(baseUrl: string): string {
  if (Platform.OS === 'web') return baseUrl;

  const match = baseUrl.match(/^(https?:\/\/)([^/:]+)(:\d+)?(\/.*)?$/i);
  if (!match) return baseUrl;

  const [, protocol, hostname, port = '', path = ''] = match;
  if (!LOCAL_HOSTNAMES.has(hostname)) return baseUrl;

  const deviceHost =
    getExpoDevHost() ?? (Platform.OS === 'android' ? '10.0.2.2' : hostname);

  return `${protocol}${deviceHost}${port}${path}`.replace(/\/$/, '');
}

export const API_BASE_URL =
  normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL);

export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const auth = await storageService.get<AuthResponse>(StorageKeys.AUTH);
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

function getErrorMessage(error: AxiosError): string | null {
  const data = error.response?.data;
  if (!data || typeof data !== 'object') return null;

  const message = (data as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }

  const errorText = (data as { error?: unknown }).error;
  if (typeof errorText === 'string' && errorText.trim().length > 0) {
    return errorText;
  }

  return null;
}

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await storageService.remove(StorageKeys.AUTH);
      onUnauthorized?.();
    }
    return Promise.reject(new Error(getErrorMessage(error) ?? error.message));
  },
);
