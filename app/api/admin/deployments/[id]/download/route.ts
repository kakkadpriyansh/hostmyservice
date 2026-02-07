import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const deploymentId = id;

  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
    include: { site: true },
  });

  if (!deployment) {
    return new NextResponse("Deployment not found", { status: 404 });
  }

  if (deployment.type !== "ZIP" || !deployment.archivePath) {
    return new NextResponse("Not a ZIP deployment or archive missing", { status: 400 });
  }

  if (!existsSync(deployment.archivePath)) {
    return new NextResponse("Archive file not found on server", { status: 404 });
  }

  try {
    const fileBuffer = await readFile(deployment.archivePath);
    
    // Create a safe filename
    const safeDomain = deployment.site.domain.replace(/[^a-z0-9.-]/gi, "_");
    const filename = `${safeDomain}_${deployment.id}.zip`;

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return new NextResponse("Failed to read archive file", { status: 500 });
  }
}
