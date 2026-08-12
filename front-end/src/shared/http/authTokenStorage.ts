const AUTH_STORAGE_KEY = "shopbank-auth";

interface PersistedAuthState {
  state?: {
    token?: unknown;
  };
}

function readPersistedAuth(): PersistedAuthState | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PersistedAuthState;
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  const token = readPersistedAuth()?.state?.token;
  return typeof token === "string" && token.length > 0 ? token : null;
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("auth:unauthorized"));
}
