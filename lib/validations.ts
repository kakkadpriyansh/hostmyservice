import { z } from "zod";

// Strict hostname for NEW domains: one or more labels plus an alphabetic TLD.
// Each label is 1-63 chars of [a-z0-9-] and cannot start or end with a hyphen.
// e.g., example.com, sub.example.com, my-site.co.in
const HOSTNAME_REGEX = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export const hostnameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(HOSTNAME_REGEX, "Invalid domain. Use a hostname like example.com or app.example.com.");

// Check for domains ALREADY stored in the database (deploy, SSL, suspend).
// Kept identical to the original rule so existing sites keep validating and
// keep their /var/www/<domain> path (no lowercasing). It is still shell-safe:
// only letters, digits, dots and hyphens.
export const domainSchema = z
  .string()
  .min(3)
  .max(100)
  .regex(/^[a-zA-Z0-9.-]+$/, "Invalid domain format. Only alphanumeric, dots, and hyphens are allowed.")
  .refine((val) => !val.startsWith("-") && !val.endsWith("-"), "Domain cannot start or end with a hyphen.")
  .refine((val) => !val.startsWith(".") && !val.endsWith("."), "Domain cannot start or end with a dot.")
  .refine((val) => !val.includes(".."), "Domain cannot contain consecutive dots.");

// Upload limit for site archives. Server Actions buffer the whole body in memory,
// so keep this well below PM2's max_memory_restart (see ecosystem.config.cjs).
export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500MB (unchanged from before, so existing customers are not affected)

// Public HTTPS Git repositories only (e.g. https://github.com/user/repo.git).
// The URL is passed to `git clone` in a shell, so the character set is restricted.
export const gitRepoUrlSchema = z
  .string()
  .trim()
  .max(300)
  .regex(
    /^https:\/\/[a-zA-Z0-9.-]+(?::\d{1,5})?\/[A-Za-z0-9._~\/-]+$/,
    "Use a public HTTPS repository URL, e.g. https://github.com/user/repo.git"
  );

export const gitBranchSchema = z
  .string()
  .trim()
  .max(100)
  .regex(/^[A-Za-z0-9._\/-]+$/, "Invalid branch name")
  .refine((b) => !b.startsWith("-") && !b.includes(".."), "Invalid branch name");

export const siteIdSchema = z.string().cuid();
export const planIdSchema = z.string().cuid();
export const userIdSchema = z.string().cuid();

export const paymentVerificationSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

export const planSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  price2Years: z.number().min(0).optional(),
  price3Years: z.number().min(0).optional(),
  duration: z.number().int().min(1),
  description: z.string().optional(),
  features: z.array(z.string()).default([]),
  requiresEnv: z.boolean().default(false),
  providesDb: z.boolean().default(false),
  dbType: z.enum(['NONE', 'MONGODB', 'MYSQL', 'POSTGRESQL']).default('NONE'),
  autoRenew: z.boolean().default(false),
  autoRenewPlanId: z.string().optional().or(z.literal("")),
});

export const subscriptionSchema = z.object({
  userId: z.string().cuid(),
  planId: z.string().cuid(),
  domain: hostnameSchema.optional().or(z.literal("")),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

// ─── Affiliate program ───────────────────────────────────────────────────────

export const affiliateApplicationSchema = z.object({
  website: z
    .string()
    .trim()
    .url("Enter a full URL, e.g. https://github.com/you")
    .max(300)
    .refine((u) => /^https?:\/\//i.test(u), "Use an http(s) link"),
  promotionPlan: z
    .string()
    .trim()
    .min(30, "Tell us a little more (at least 30 characters)")
    .max(2000),
  acceptTerms: z.literal(true, { message: "You must accept the affiliate terms" }),
});

export const payoutDetailsSchema = z.discriminatedUnion("payoutMethod", [
  z.object({
    payoutMethod: z.literal("UPI"),
    upiId: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/, "Invalid UPI ID, e.g. name@okhdfcbank"),
  }),
  z.object({
    payoutMethod: z.literal("BANK"),
    bankAccountName: z.string().trim().min(2, "Account holder name is required").max(100),
    bankAccountNumber: z.string().trim().regex(/^\d{9,18}$/, "Account number must be 9–18 digits"),
    bankIfsc: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC, e.g. HDFC0001234"),
  }),
]);

export const affiliateSettingsSchema = z.object({
  programEnabled: z.boolean(),
  applicationsOpen: z.boolean(),
  defaultCommissionRate: z.number().min(0).max(100),
  commissionScope: z.enum(["FIRST_PAYMENT", "ALL_PAYMENTS"]),
  minPayoutRupees: z.number().int().min(1).max(10_000_000),
  holdDays: z.number().int().min(0).max(365),
  cookieDays: z.number().int().min(1).max(365),
});
