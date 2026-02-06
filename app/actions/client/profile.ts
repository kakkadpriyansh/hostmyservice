"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(4, "Postal Code is required"),
  country: z.string().min(2, "Country is required"),
});

export type ProfileData = z.infer<typeof profileSchema>;

export async function updateUserProfile(data: ProfileData) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const result = profileSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: result.data,
    });
    
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Profile update error:", error);
    return { error: "Failed to update profile" };
  }
}

export async function getUserProfile() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      phoneNumber: true,
      address: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
      name: true,
      email: true,
    }
  });

  return { success: true, data: user };
}
