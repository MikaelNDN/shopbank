export type Numeric = number | string;

export function toNumber(value: Numeric | null | undefined, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function toId(value: Numeric): string {
  return String(value);
}

