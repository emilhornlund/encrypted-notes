// JWT utilities for client-side token handling
export interface JWTPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Decode a JWT token without verification (client-side only)
 * WARNING: This does not verify the token signature - only use for display purposes
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decodedPayload = atob(payload!.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(decodedPayload) as any;

    // Validate the payload has required fields
    if (!parsed.sub || !parsed.email || !parsed.iat || !parsed.exp) {
      return null;
    }

    return parsed as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Get user info from JWT token
 */
export function getUserFromToken(
  token: string
): { id: string; email: string } | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.sub || !payload.email) return null;

  return {
    id: payload.sub,
    email: payload.email,
  };
}
