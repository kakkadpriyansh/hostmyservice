import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),

  // VPS Configuration — optional at build time, required at runtime for deployments
  VPS_HOST: z.string().min(1).optional(),
  VPS_USER: z.string().min(1).optional(),
  VPS_PRIVATE_KEY: z.string().min(1).optional(),

  // Razorpay Configuration
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  // Secret set in Razorpay Dashboard → Webhooks (falls back to RAZORPAY_KEY_SECRET)
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Shared secret for /api/cron/* endpoints (sent as "Authorization: Bearer <secret>")
  CRON_SECRET: z.string().min(16).optional(),

  // Subscriptions created before this ISO date are never auto-expired (default 2026-11-12)
  EXPIRY_ENFORCEMENT_START: z.string().datetime().optional(),

  // Customer apps run as a dedicated unprivileged Linux user per site.
  // Set to "true" only as a temporary escape hatch; it runs customer code as the SSH user.
  DEPLOY_RUN_AS_ROOT: z.enum(["true", "false"]).optional(),

  // Admin
  ADMIN_EMAIL: z.string().email().optional(),
});

export const env = envSchema.parse(process.env);
