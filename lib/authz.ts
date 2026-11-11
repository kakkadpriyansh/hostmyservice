import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Authorization helpers for Server Actions, route handlers and server components.
 *
 * Server Actions are public HTTP endpoints and the middleware deliberately skips
 * them (see middleware.ts), so EVERY action must check the session itself.
 */

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Returns the session if the caller is a logged-in ADMIN, otherwise null. */
export async function getAdminSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") return null;
  return session;
}

/** Returns the session if the caller is logged in, otherwise null. */
export async function getUserSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session;
}

/** Throws UnauthorizedError unless the caller is a logged-in ADMIN. */
export async function requireAdmin(): Promise<Session> {
  const session = await getAdminSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

/**
 * Fields of User that are safe to return to the admin UI.
 * Never include password, resetToken or resetTokenExpiry in query results
 * that leave the server.
 */
export const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  image: true,
  phoneNumber: true,
  address: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  createdAt: true,
} as const;
