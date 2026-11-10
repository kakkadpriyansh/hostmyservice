import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    console.log("=== DEBUG SESSION API ===");
    console.log("Headers:", Object.fromEntries(req.headers.entries()));
    
    const session = await getServerSession(authOptions);
    
    console.log("Session from API route:", JSON.stringify(session, null, 2));
    
    return NextResponse.json({
      success: true,
      session: session,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      isAdmin: session?.user?.role === "ADMIN"
    });
    
  } catch (error) {
    console.error("Debug session error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}