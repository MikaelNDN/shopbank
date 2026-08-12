import type { AxiosError } from "axios";

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export class ApiError extends Error {
  status?: number;
  details: ApiErrorDetail[];

  constructor(message: string, status?: number, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function detailFromObject(value: Record<string, unknown>): ApiErrorDetail | null {
  const message = asText(value.message) ?? asText(value.defaultMessage);
  if (!message) return null;

  const field = asText(value.field) ?? asText(value.property);
  return field ? { field, message } : { message };
}

function collectDetails(data: unknown): ApiErrorDetail[] {
  if (!isRecord(data)) return [];

  const candidates = [data.errors, data.fieldErrors, data.violations];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .filter(isRecord)
        .map(detailFromObject)
        .filter((detail): detail is ApiErrorDetail => detail !== null);
    }

    if (isRecord(candidate)) {
      return Object.entries(candidate)
        .map<ApiErrorDetail | null>(([field, value]) => {
          const message = Array.isArray(value) ? asText(value[0]) : asText(value);
          return message ? { field, message } : null;
        })
        .filter((detail): detail is ApiErrorDetail => detail !== null);
    }
  }

  return [];
}

export function getApiErrorMessage(data: unknown, fallback = "Erro ao comunicar com o servidor."): string {
  if (isRecord(data)) {
    const message = asText(data.message) ?? asText(data.error) ?? asText(data.title);
    if (message) return message;

    const details = collectDetails(data);
    if (details.length > 0) {
      return details.map((detail) => (detail.field ? `${detail.field}: ${detail.message}` : detail.message)).join("; ");
    }
  }

  return fallback;
}

export function normalizeApiError(error: unknown): ApiError {
  const axiosError = error as AxiosError<unknown>;
  const status = axiosError.response?.status;
  const data = axiosError.response?.data;

  if (data !== undefined) {
    return new ApiError(getApiErrorMessage(data), status, collectDetails(data));
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return new ApiError(error.message, status);
  }

  return new ApiError("Erro ao comunicar com o servidor.", status);
}
