interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const base64 = padded + padding;
  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(base64);
  }
  // Fallback manual
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = '';
  let buffer = 0;
  let bits = 0;
  for (const c of base64) {
    if (c === '=') break;
    const val = chars.indexOf(c);
    if (val === -1) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      str += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return str;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = base64UrlDecode(parts[1]);
    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
}

export function isJwtValidShape(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  if (parts[0].toLowerCase().startsWith('mock')) return false;
  const claims = decodeJwt(token);
  if (!claims) return false;
  if (claims.exp && Date.now() / 1000 >= claims.exp) return false;
  if (!claims.sub && !claims.email) return false;
  return true;
}
