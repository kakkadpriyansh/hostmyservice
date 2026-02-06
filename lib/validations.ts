import { z } from "zod";

// Allow alphanumeric, dots, and hyphens. No spaces, no special chars.
// e.g., example.com, sub.example.com, my-site.com
export const domainSchema = z
  .string()
  .min(3)
  .max(100)
  .regex(/^[a-zA-Z0-9.-]+$/, "Invalid domain format. Only alphanumeric, dots, and hyphens are allowed.")
  .refine((val) => !val.startsWith("-") && !val.endsWith("-"), "Domain cannot start or end with a hyphen.")
  .refine((val) => !val.startsWith(".") && !val.endsWith("."), "Domain cannot start or end with a dot.")
  .refine((val) => !val.includes(".."), "Domain cannot contain consecutive dots.");

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
  duration: z.number().int().min(1),
  description: z.string().optional(),
  features: z.array(z.string()).default([]),
  requiresEnv: z.boolean().default(false),
  providesDb: z.boolean().default(false),
});

export const subscriptionSchema = z.object({
  userId: z.string().cuid(),
  planId: z.string().cuid(),
  domain: domainSchema.optional().or(z.literal("")),
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
