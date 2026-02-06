"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import * as osModule from "os";
import AdmZip from "adm-zip";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ["application/zip", "application/x-zip-compressed", "application/x-zip"];

export async function deploySite(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const siteId = formData.get("siteId") as string;
  const file = formData.get("file") as File | null;

  if (!siteId || !file) {
    return { error: "Missing site ID or file" };
  }

  // Verify ownership
  const site = await prisma.site.findUnique({
    where: { id: siteId },
  });

  if (!site) return { error: "Site not found" };
  if (site.userId !== session.user.id) return { error: "Unauthorized" };

  // Validate File
  if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".zip")) {
    return { error: "Invalid file type. Only ZIP files are allowed." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "File too large. Maximum size is 50MB." };
  }

  const uploadId = uuidv4();
  // We'll store deployments in a persistent area if possible, or temp for now
  // Given the environment, let's use a project-relative 'storage' folder if we can, or /tmp
  // Using /tmp is safer for stateless containers, but we want persistence?
  // User said "upload their repositories".
  // For now, let's stick to /tmp as per existing pattern, but create a Deployment record.
  
  const tempDir = osModule.tmpdir();
  const uploadPath = join(tempDir, "hostmyservice", "deployments", siteId, uploadId);
  const zipFilePath = join(uploadPath, "archive.zip");
  const extractPath = join(uploadPath, "extracted");

  try {
    await mkdir(uploadPath, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(zipFilePath, buffer);

    const zip = new AdmZip(zipFilePath);
    zip.extractAllTo(extractPath, true);

    // Validate index.html
    const entries = zip.getEntries();
    const hasIndex = entries.some(e => e.entryName.toLowerCase().endsWith("index.html") && !e.entryName.startsWith("__MACOSX"));
    
    if (!hasIndex) {
      await rm(uploadPath, { recursive: true, force: true });
      return { error: "Invalid archive. 'index.html' not found." };
    }

    // Create Deployment Record
    await prisma.deployment.create({
      data: {
        siteId: site.id,
        status: "PENDING", // Pending Admin Action
      }
    });

    revalidatePath("/dashboard/sites");
    return { success: true, message: "Deployment queued successfully" };

  } catch (error) {
    console.error("Deploy error:", error);
    return { error: "Deployment failed" };
  }
}
