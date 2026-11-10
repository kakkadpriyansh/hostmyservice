import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { downloadFromGoogleDrive } from "@/lib/google-drive";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== DOWNLOAD ROUTE DEBUG ===");
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    const session = await getServerSession(authOptions);
    console.log("Full session object:", JSON.stringify(session, null, 2));

    if (!session) {
      console.log("❌ No session found");
      return new NextResponse("No session found", { status: 401 });
    }

    if (!session.user) {
      console.log("❌ No user in session");
      return new NextResponse("No user in session", { status: 401 });
    }

    if (!session.user.id) {
      console.log("❌ No user ID in session");
      return new NextResponse("No user ID in session", { status: 401 });
    }

    console.log(`✅ User found: ${session.user.id}, Role: ${session.user.role}`);

    if (session.user.role !== "ADMIN") {
      console.log(`❌ User role is ${session.user.role}, expected ADMIN`);
      return new NextResponse(`Access denied. User role: ${session.user.role}`, { status: 403 });
    }

    console.log("✅ Admin access granted for user:", session.user.id);

    const { id } = await params;
    const deploymentId = id;

    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: { site: true },
    });

    if (!deployment) {
      return new NextResponse("Deployment not found", { status: 404 });
    }

    if (deployment.type !== "ZIP" || (!deployment.archivePath && !deployment.driveFileId)) {
      return new NextResponse("Not a ZIP deployment or archive missing", { status: 400 });
    }

    let fileBuffer: Buffer;
    
    // Try Google Drive first, then fallback to local file
    if (deployment.driveFileId) {
      try {
        console.log(`Downloading from Google Drive: ${deployment.driveFileId}`);
        fileBuffer = await downloadFromGoogleDrive(deployment.driveFileId);
      } catch (error) {
        console.error("Google Drive download failed:", error);
        return new NextResponse("Failed to download from Google Drive", { status: 500 });
      }
    } else if (deployment.archivePath && existsSync(deployment.archivePath)) {
      try {
        fileBuffer = await readFile(deployment.archivePath);
      } catch (error) {
        console.error("Local file read error:", error);
        return new NextResponse("Failed to read local archive file", { status: 500 });
      }
    } else {
      return new NextResponse("Archive file not found on server", { status: 404 });
    }

    // Create a safe filename
    const safeDomain = deployment.site.domain.replace(/[^a-z0-9.-]/gi, "_");
    const filename = `${safeDomain}_${deployment.id}.zip`;

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("Download error:", error);
    return new NextResponse("Failed to process archive file", { status: 500 });
  }
}