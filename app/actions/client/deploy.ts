"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import * as osModule from "os";
import { safeExtractZip, UnsafeArchiveError } from "@/lib/zip";
import { gitRepoUrlSchema, gitBranchSchema, MAX_UPLOAD_BYTES } from "@/lib/validations";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { uploadToGoogleDrive } from "@/lib/google-drive";

const ALLOWED_TYPES = ["application/zip", "application/x-zip-compressed", "application/x-zip"];

export async function deploySite(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const siteId = formData.get("siteId") as string;
  const deploymentType = formData.get("type") === "GIT" ? "GIT" : "ZIP";
  
  if (!siteId) {
    return { error: "Missing site ID" };
  }

  // Verify ownership
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { subscription: true },
  });

  if (!site || site.deletedAt) return { error: "Site not found" };
  if (site.userId !== session.user.id) return { error: "Unauthorized" };

  // Only sites with a live subscription can be deployed
  if (site.status !== "ACTIVE") {
    return { error: "This site is suspended. Renew your plan or contact support." };
  }
  const subscription = site.subscription;
  // Only an explicit EXPIRED status blocks deploys. The cron sets it for new
  // subscriptions; older ones are never expired automatically.
  if (subscription?.status === "EXPIRED") {
    return { error: "Your subscription has expired. Renew your plan to deploy." };
  }

  // Only a build that is already running blocks a new deployment. Older
  // queued (never started) deployments are replaced by this one below.
  const building = await prisma.deployment.findFirst({
    where: { siteId: site.id, status: "BUILDING", deletedAt: null },
    select: { id: true },
  });
  if (building) {
    return { error: "A deployment for this site is currently running. Try again when it finishes." };
  }

  try {
    console.log(`Starting deployment for site ${siteId} by user ${session.user.id}`);
    
    if (deploymentType === "GIT") {
      const repo = gitRepoUrlSchema.safeParse(formData.get("gitRepoUrl"));
      if (!repo.success) {
        return { error: repo.error.issues[0]?.message || "Invalid Git repository URL" };
      }
      const branch = gitBranchSchema.safeParse(formData.get("gitBranch") || "main");
      if (!branch.success) {
        return { error: branch.error.issues[0]?.message || "Invalid branch name" };
      }
      const gitRepoUrl = repo.data;
      const gitBranch = branch.data;

      await supersedeQueuedDeployments(site.id);
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
      if (file.size > MAX_UPLOAD_BYTES) {
        return { error: `File too large. Maximum size is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.` };
      }

      const uploadId = uuidv4();
      const tempDir = osModule.tmpdir();
      const uploadPath = join(tempDir, "hostmyservice", "deployments", siteId, uploadId);
      const zipFilePath = join(uploadPath, "archive.zip");
      const extractPath = join(uploadPath, "extracted");

      await mkdir(uploadPath, { recursive: true });
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(zipFilePath, buffer);

      try {
        await safeExtractZip(zipFilePath, extractPath);
      } catch (e) {
        await rm(uploadPath, { recursive: true, force: true });
        if (e instanceof UnsafeArchiveError) {
          return { error: e.message };
        }
        console.error("Failed to extract zip:", e);
        return { error: "Could not read the ZIP file. Please check it and upload again." };
      }

      // Upload to Google Drive
      let driveFileId = null;
      try {
        const fileName = `${site.domain}_${uploadId}_${file.name}`;
        driveFileId = await uploadToGoogleDrive(buffer, fileName);
        console.log(`File uploaded to Google Drive: ${driveFileId}`);
      } catch (error) {
        console.error('Google Drive upload failed:', error);
        // Continue with local storage if Google Drive fails
      }

      await supersedeQueuedDeployments(site.id);
      await prisma.deployment.create({
        data: {
          siteId: site.id,
          status: "PENDING",
          type: "ZIP",
          uploadPath: extractPath,
          archivePath: zipFilePath, // Save path to original zip for download
          driveFileId: driveFileId, // Save Google Drive file ID
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

/** The newest upload wins: older deployments that never started leave the admin queue. */
async function supersedeQueuedDeployments(siteId: string) {
  await prisma.deployment.updateMany({
    where: { siteId, status: "PENDING", deletedAt: null },
    data: { deletedAt: new Date() },
  });
}
