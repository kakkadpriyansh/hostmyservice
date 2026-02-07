"use server";

import { registerSchema, changePasswordSchema } from "@/lib/validations";
import { z } from "zod";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { sendPasswordResetEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
        resetToken,
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
  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
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
