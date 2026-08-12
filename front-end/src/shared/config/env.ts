const DEFAULT_API_BASE_URL = "";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function readViteEnv(key: string): string | undefined {
  return import.meta.env[key];
}

export const appEnv = {
  apiBaseUrl: trimTrailingSlash(readViteEnv("VITE_API_BASE_URL")?.trim() || DEFAULT_API_BASE_URL),
};
