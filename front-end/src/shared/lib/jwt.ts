export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    // Se não conseguir ler o payload ou não tiver expiração, assume como não expirado para não deslogar imediatamente por erro
    // ou assumimos expirado? Como o objetivo é segurança, tokens inválidos devem ser descartados.
    // Porem tokens sem 'exp' podem ser válidos permanentemente no sistema antigo.
    // Assumimos expirado se houver "exp"; sem "exp", o token é considerado válido.
    if (!payload) return true;
    if (typeof payload.exp !== "number") return false; 
  }
  // exp is in seconds, Date.now() is in ms
  return payload.exp * 1000 <= Date.now();
}
