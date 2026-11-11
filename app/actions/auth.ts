"use server";

import { registerSchema, changePasswordSchema } from "@/lib/validations";
import { z } from "zod";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { sendPasswordResetEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from "next/headers";
import crypto from "crypto";
import { rateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

// Only a hash of the reset token is stored, so a database leak can't be used to reset passwords
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hashResetToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export async function registerUser(data: z.infer<typeof registerSchema>) {
  const result = registerSchema.safeParse(data);

  if (!result.success) {
    return { success: false, error: "Invalid input data" };
  }

  const { name, email, password } = result.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Something went wrong" };
  }
}

export async function forgotPassword(email: string) {
  // Each call sends an email, so cap it per address and per client IP
  const ip = clientIpFromHeaders(await headers());
  if (
    !rateLimit(`forgot:email:${String(email).toLowerCase()}`, 3, 60 * 60 * 1000) ||
    !rateLimit(`forgot:ip:${ip}`, 10, 60 * 60 * 1000)
  ) {
    return { success: false, error: "Too many requests. Please try again later." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { success: true };
    }

    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { email },
      data: {
        resetToken: hashResetToken(resetToken),
        resetTokenExpiry,
      },
    });

    await sendPasswordResetEmail(email, resetToken);

    return { success: true };
  } catch (error) {
    console.error("Forgot password error:", error);
    return { success: false, error: "Something went wrong" };
  }
}

export async function resetPassword(token: string, password: string) {
  const parsed = registerSchema.shape.password.safeParse(password);
  if (!parsed.success || typeof token !== "string" || !token) {
    return { success: false, error: "Invalid or expired token" };
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        // Links sent before tokens were hashed hold a plain UUID stored as-is (valid
        // for up to 1 hour). Only UUID-shaped input may match a stored value directly,
        // so a leaked hash can never be used as a token.
        resetToken: { in: UUID_REGEX.test(token) ? [hashResetToken(token), token] : [hashResetToken(token)] },
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return { success: false, error: "Invalid or expired token" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Reset password error:", error);
    return { success: false, error: "Something went wrong" };
  }
}

export async function changePassword(data: z.infer<typeof changePasswordSchema>) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { success: false, error: "Not authenticated" };
  }

  const result = changePasswordSchema.safeParse(data);

  if (!result.success) {
    return { success: false, error: "Invalid input data" };
  }

  const { currentPassword, newPassword } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.password) {
      return { success: false, error: "User not found" };
    }

    const isCorrectPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isCorrectPassword) {
      return { success: false, error: "Incorrect current password" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        password: hashedPassword,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Change password error:", error);
    return { success: false, error: "Something went wrong" };
  }
}
