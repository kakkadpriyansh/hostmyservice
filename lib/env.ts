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

  // Admin
  ADMIN_EMAIL: z.string().email().optional(),
});

export const env = envSchema.parse(process.env);
