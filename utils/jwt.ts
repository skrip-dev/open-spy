import { createSigner, createVerifier } from "fast-jwt";
import { env } from "~/config/env";

export interface JWTPayload {
  userId: string;
  email: string;
  role: "admin";
  iat?: number;
  exp?: number;
}

// Create signer with RS256 algorithm (asymmetric)
const signer = createSigner({
  key: env.JWT_PRIVATE_KEY,
  algorithm: "RS256",
  expiresIn: "7d", // Token expires in 7 days
});

// Create verifier
const verifier = createVerifier({
  key: env.JWT_PUBLIC_KEY,
  algorithms: ["RS256"],
});

/**
 * Signs a JWT token with the provided payload
 */
export function signToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return signer(payload);
}

/**
 * Verifies and decodes a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return verifier(token) as JWTPayload;
  } catch {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Extracts token from Authorization header
 */
export function extractTokenFromHeader(
  authHeader: string | null,
): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    return parts[1];
  }

  return null;
}
