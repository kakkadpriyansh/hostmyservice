import crypto from "crypto";

/** Quotes a value as a single POSIX shell word. */
export function shQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/** Short, stable hex hash of a string (used to derive per-site names). */
export function shortHash(value: string, length = 10): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, length);
}

/**
 * Linux user that owns a site's files and runs its processes.
 * Derived from the domain so it is stable across redeploys.
 */
export function siteUserName(domain: string): string {
  return `hms_${shortHash(domain, 12)}`;
}

/** Hides the password in a connection string before it is logged. */
export function maskConnectionString(conn: string): string {
  return conn.replace(/(:\/\/[^:/@]+:)[^@]*@/, "$1****@");
}
