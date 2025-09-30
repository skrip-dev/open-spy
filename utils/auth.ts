import { extractTokenFromHeader, JWTPayload, verifyToken } from "~/utils/jwt";

/**
 * Verifies admin authentication from request headers
 * Returns the decoded JWT payload if valid, null otherwise
 */
export function verifyAdminAuth(authHeader: string | null): JWTPayload | null {
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);

    // Ensure the token is for an admin
    if (payload.role !== "admin") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Middleware function to protect API routes
 * Usage in API routes:
 *
 * const authResult = requireAdminAuth(c.req.header("authorization"));
 * if (!authResult.authenticated) {
 *   return c.json({ error: authResult.error }, 401);
 * }
 * // Use authResult.user to access admin info
 */
export function requireAdminAuth(
  authHeader: string | null,
):
  | { authenticated: true; user: JWTPayload }
  | { authenticated: false; error: string } {
  const user = verifyAdminAuth(authHeader);

  if (!user) {
    return {
      authenticated: false,
      error: "Não autenticado. Token inválido ou ausente.",
    };
  }

  return {
    authenticated: true,
    user,
  };
}
