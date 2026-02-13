"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
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
  const deploymentType = formData.get("type") as "ZIP" | "GIT" || "ZIP";
  
  if (!siteId) {
    return { error: "Missing site ID" };
  }

  // Verify ownership
  const site = await prisma.site.findUnique({
    where: { id: siteId },
  });

  if (!site) return { error: "Site not found" };
  if (site.userId !== session.user.id) return { error: "Unauthorized" };

  try {
    console.log(`Starting deployment for site ${siteId} by user ${session.user.id}`);
    
    if (deploymentType === "GIT") {
      const gitRepoUrl = formData.get("gitRepoUrl") as string;
      const gitBranch = formData.get("gitBranch") as string || "main";

      if (!gitRepoUrl) {
        return { error: "Git Repository URL is required" };
      }

      await prisma.deployment.create({
        data: {
          siteId: site.id,
          status: "PENDING",
          type: "GIT",
          gitRepoUrl,
          gitBranch,
        }
      });

      revalidatePath("/dashboard/sites");
      return { success: true, message: "Git deployment queued successfully" };
    } 
    else {
      // ZIP Deployment
      const file = formData.get("file") as File | null;
      
      if (!file) {
        return { error: "Missing file" };
      }

      if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".zip")) {
        return { error: "Invalid file type. Only ZIP files are allowed." };
      }
      if (file.size > MAX_FILE_SIZE) {
        return { error: "File too large. Maximum size is 50MB." };
      }

      const uploadId = uuidv4();
      const tempDir = osModule.tmpdir();
      const uploadPath = join(tempDir, "hostmyservice", "deployments", siteId, uploadId);
      const zipFilePath = join(uploadPath, "archive.zip");
      const extractPath = join(uploadPath, "extracted");

      await mkdir(uploadPath, { recursive: true });
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(zipFilePath, buffer);

      // Extraction logic (Optional - just for admin convenience)
      try {
        const zip = new AdmZip(zipFilePath);
        zip.extractAllTo(extractPath, true);
      } catch (e) {
        console.warn("Failed to extract zip, but proceeding with upload:", e);
      }

      await prisma.deployment.create({
        data: {
          siteId: site.id,
          status: "PENDING",
          type: "ZIP",
          uploadPath: extractPath,
          archivePath: zipFilePath, // Save path to original zip for download
        }
      });

      revalidatePath("/dashboard/sites");
      return { success: true, message: "Deployment queued successfully" };
    }

  } catch (error) {
    console.error("Deploy error:", error);
    return { error: "Deployment failed" };
  }
}
