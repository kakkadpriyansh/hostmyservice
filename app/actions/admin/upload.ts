"use server";

import { writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import * as osModule from "os";
import AdmZip from "adm-zip";
import { v4 as uuidv4 } from "uuid";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ["application/zip", "application/x-zip-compressed"];

export async function uploadSiteArchive(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Unauthorized access" };
  }

  const file = formData.get("file") as File | null;

  if (!file) {
    return { error: "No file provided" };
  }

  // 1. Validate File Type
  if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".zip")) {
    return { error: "Invalid file type. Only ZIP files are allowed." };
  }

  // 2. Validate File Size
  if (file.size > MAX_FILE_SIZE) {
    return { error: "File too large. Maximum size is 50MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadId = uuidv4();
  const tempDir = osModule.tmpdir();
  const uploadPath = join(tempDir, "hostmyservice", "uploads", uploadId);
  const zipFilePath = join(uploadPath, "archive.zip");
  const extractPath = join(uploadPath, "extracted");

  try {
    // 3. Create Temp Directory
    await mkdir(uploadPath, { recursive: true });

    // 4. Save ZIP file
    await writeFile(zipFilePath, buffer);

    // 5. Extract Files
    const zip = new AdmZip(zipFilePath);
    zip.extractAllTo(extractPath, true);

    // 6. Validate Structure (Must contain index.html)
    const entries = zip.getEntries();
    const indexHtmlEntries = entries.filter((entry) => 
      entry.entryName.toLowerCase().endsWith("index.html") && !entry.entryName.startsWith("__MACOSX")
    );

    if (indexHtmlEntries.length === 0) {
      // Cleanup if invalid
      await rm(uploadPath, { recursive: true, force: true });
      return { error: "Invalid archive structure. 'index.html' not found." };
    }

    // Find the best candidate for root (shortest path)
    // sort by depth (number of slashes)
    indexHtmlEntries.sort((a, b) => {
      const depthA = (a.entryName.match(/\//g) || []).length;
      const depthB = (b.entryName.match(/\//g) || []).length;
      return depthA - depthB;
    });

    const rootIndex = indexHtmlEntries[0];
    const rootDir = rootIndex.entryName.substring(0, rootIndex.entryName.lastIndexOf('/'));
    
    // If rootDir is empty string, it means index.html is at root
    const effectivePath = rootDir ? join(extractPath, rootDir) : extractPath;

    return {
      success: true,
      message: "File uploaded and extracted successfully.",
      path: effectivePath,
      fileCount: entries.length,
      uploadId: uploadId
    };

  } catch (error) {
    console.error("Upload error:", error);
    // Attempt cleanup
    try {
      await rm(uploadPath, { recursive: true, force: true });
    } catch (e) {
      console.error("Cleanup error:", e);
    }
    return { error: "Failed to process upload." };
  }
}
