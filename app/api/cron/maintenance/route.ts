import { NextRequest, NextResponse } from "next/server";
import { readdir, rm, stat } from "fs/promises";
import os from "os";
import path from "path";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";
import { enforceSubscriptionExpiry } from "@/lib/site-control";
import { logger } from "@/lib/logger";

// Uploads older than this are deleted from the app server's temp folder.
// Archives stored in Google Drive remain downloadable from the admin panel.
const TEMP_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Daily maintenance, called by cron on the VPS (see docs/operations.md):
 *   curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:3000/api/cron/maintenance
 */
export async function POST(req: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization") || "";
  if (!safeEqual(`Bearer ${env.CRON_SECRET}`, auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expiry = await enforceSubscriptionExpiry();
  const cleanup = await cleanupTempUploads();

  logger.info("Maintenance run complete", { expired: expiry.length, removedUploads: cleanup });
  return NextResponse.json({ expiry, removedUploads: cleanup });
}

/** Deletes upload folders (…/deployments/<site>/<upload>, …/uploads/<upload>) older than the retention period. */
async function cleanupTempUploads(): Promise<number> {
  const root = path.join(os.tmpdir(), "hostmyservice");
  const cutoff = Date.now() - TEMP_RETENTION_MS;
  let removed = 0;

  const removeOld = async (dir: string) => {
    let names: string[];
    try {
      names = await readdir(dir);
    } catch {
      return;
    }
    for (const name of names) {
      const full = path.join(dir, name);
      try {
        if ((await stat(full)).mtimeMs < cutoff) {
          await rm(full, { recursive: true, force: true });
          removed++;
        }
      } catch {
        // Ignore entries that disappear or can't be read
      }
    }
  };

  await removeOld(path.join(root, "uploads"));
  try {
    for (const siteDir of await readdir(path.join(root, "deployments"))) {
      await removeOld(path.join(root, "deployments", siteDir));
    }
  } catch {
    // No deployments folder yet
  }

  return removed;
}
