import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Simple in-memory rate limiter (For single-instance VPS)
// For scalable solutions, use Redis (e.g., upstash/ratelimit)
const rateLimit = new Map<string, { count: number; startTime: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 300; // Limit per user (or per IP when logged out)

function getClientIp(req: Request) {
  // x-forwarded-for may be a comma-separated chain; the first entry is the client
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

function isPrefetch(req: Request) {
  return (
    req.headers.get("next-router-prefetch") === "1" ||
    req.headers.get("purpose") === "prefetch" ||
    req.headers.get("sec-purpose")?.includes("prefetch") === true
  );
}

export default withAuth(
  function middleware(req) {
    // Rate Limiting Logic — prefetches are triggered by the router, not the user
    if (!isPrefetch(req)) {
      const key = req.nextauth.token?.sub
        ? `user:${req.nextauth.token.sub}`
        : `ip:${getClientIp(req)}`;
      const now = Date.now();

      // Drop expired entries so the map doesn't grow unbounded
      if (rateLimit.size > 10000) {
        for (const [k, v] of rateLimit) {
          if (now - v.startTime > WINDOW_MS) rateLimit.delete(k);
        }
      }

      const record = rateLimit.get(key) || { count: 0, startTime: now };

      // Reset if window passed
      if (now - record.startTime > WINDOW_MS) {
        record.count = 1;
        record.startTime = now;
      } else {
        record.count++;
      }

      rateLimit.set(key, record);

      if (record.count > MAX_REQUESTS) {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((record.startTime + WINDOW_MS - now) / 1000)),
          },
        });
      }
    }

    // Custom logic if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Public paths that should not require authentication
        const publicPaths = ["/"];
        if (publicPaths.includes(req.nextUrl.pathname)) {
          return true;
        }
        // Only allow if token exists (user is logged in)
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth (auth API routes)
     * - api/webhook (webhook routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - static assets (.png, .jpg, .jpeg, .svg, .ico, .webp, .gif)
     * - public pages (login, register, etc.)
     * - / (root page)
     *
     * Server Actions (POST with Next-Action header) are intentionally excluded:
     * they have their own session auth via getServerSession() and must not be
     * intercepted by middleware — doing so applies the 1 MB middleware body limit
     * which blocks large ZIP file uploads.
     */
    {
      source:
        "/((?!api/auth|api/webhook|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)|login|register|forgot-password|reset-password|contact|privacy-policy|terms|refund-policy|shipping-policy|$).*)",
      missing: [
        // Skip middleware for Next.js Server Action requests
        { type: "header", key: "next-action" },
      ],
    },
  ],
};
