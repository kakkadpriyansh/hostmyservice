"use server";

import { getAdminSession } from "@/lib/authz";
import { runSslProvisioning, type SslResult } from "@/lib/ssl";

export async function provisionSSL(siteId: string): Promise<SslResult> {
  if (!(await getAdminSession())) {
    return { success: false, error: "Unauthorized" };
  }
  return runSslProvisioning(siteId);
}
