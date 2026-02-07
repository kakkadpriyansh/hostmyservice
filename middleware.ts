import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Simple in-memory rate limiter (For single-instance VPS)
// For scalable solutions, use Redis (e.g., upstash/ratelimit)
const rateLimit = new Map<string, { count: number; startTime: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // Limit per IP

export default withAuth(
  function middleware(req) {
    // Rate Limiting Logic
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    
    const record = rateLimit.get(ip) || { count: 0, startTime: now };
    
    // Reset if window passed
    if (now - record.startTime > WINDOW_MS) {
      record.count = 1;
      record.startTime = now;
    } else {
      record.count++;
    }
    
    rateLimit.set(ip, record);
    
    if (record.count > MAX_REQUESTS) {
      return new NextResponse("Too Many Requests", { status: 429 });
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
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - login (login page)
     * - register (register page)
     * - / (root page)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|register|forgot-password|reset-password|$).*)",
  ],
};
