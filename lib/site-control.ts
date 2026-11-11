import prisma from "@/lib/prisma";
import { SSHClient } from "@/lib/ssh-client";
import { domainSchema } from "@/lib/validations";
import { SUSPEND_DIR, suspendInclude } from "@/lib/nginx-config";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

export type SuspendReason = "EXPIRED" | "ADMIN";

/**
 * Makes sure the site's nginx config contains the suspension include.
 * Configs created before suspension support existed get it inserted after
 * every `server_name` line (covers the HTTPS block certbot adds).
 */
async function ensureSuspendInclude(ssh: SSHClient, domain: string) {
  const configPath = `/etc/nginx/sites-available/${domain}`;
  const include = suspendInclude(domain);
  await ssh.execCommand(
    `sudo test -f ${configPath} && (sudo grep -qF '${include}' ${configPath} || sudo sed -i '/server_name/a\\    ${include}' ${configPath})`
  );
}

/** Stops the app and makes nginx answer 503 for the domain. */
async function suspendOnServer(ssh: SSHClient, domain: string) {
  await ensureSuspendInclude(ssh, domain);
  await ssh.execCommand(`sudo mkdir -p ${SUSPEND_DIR}`);
  await ssh.execCommand(`echo 'return 503;' | sudo tee ${SUSPEND_DIR}/${domain}.conf >/dev/null`);
  const test = await ssh.execCommand("sudo nginx -t");
  if (test.code !== 0) {
    await ssh.execCommand(`sudo rm -f ${SUSPEND_DIR}/${domain}.conf`);
    throw new Error(`nginx config test failed while suspending ${domain}: ${test.stderr}`);
  }
  await ssh.execCommand("sudo systemctl reload nginx");
  await ssh.execCommand(`pm2 stop "${domain}" 2>/dev/null || true`);
  await ssh.execCommand(`pm2 save`);
}

/** Removes the 503 and starts the app again (if it is a PM2 app). */
async function resumeOnServer(ssh: SSHClient, domain: string) {
  await ssh.execCommand(`sudo rm -f ${SUSPEND_DIR}/${domain}.conf`);
  const test = await ssh.execCommand("sudo nginx -t");
  if (test.code !== 0) {
    throw new Error(`nginx config test failed while resuming ${domain}: ${test.stderr}`);
  }
  await ssh.execCommand("sudo systemctl reload nginx");
  await ssh.execCommand(`pm2 describe "${domain}" >/dev/null 2>&1 && pm2 restart "${domain}" --update-env || true`);
  await ssh.execCommand(`pm2 save`);
}

async function withSsh<T>(fn: (ssh: SSHClient) => Promise<T>): Promise<T> {
  const ssh = new SSHClient();
  try {
    await ssh.connect();
    return await fn(ssh);
  } finally {
    ssh.dispose();
  }
}

/**
 * Suspends a site in the database and on the server.
 * Sites that were never deployed (no serverPath) are only updated in the database.
 */
export async function suspendSite(siteId: string, reason: SuspendReason): Promise<void> {
  const site = await prisma.site.findUniqueOrThrow({ where: { id: siteId } });
  const domain = domainSchema.parse(site.domain);

  if (site.serverPath) {
    await withSsh((ssh) => suspendOnServer(ssh, domain));
  }

  await prisma.site.update({
    where: { id: siteId },
    data: { status: "SUSPENDED", suspendReason: reason },
  });
  logger.info(`Site suspended`, { siteId, domain, reason });
}

/** Resumes a suspended site in the database and on the server. */
export async function resumeSite(siteId: string): Promise<void> {
  const site = await prisma.site.findUniqueOrThrow({ where: { id: siteId } });
  const domain = domainSchema.parse(site.domain);

  if (site.serverPath) {
    await withSsh((ssh) => resumeOnServer(ssh, domain));
  }

  await prisma.site.update({
    where: { id: siteId },
    data: { status: "ACTIVE", suspendReason: null },
  });
  logger.info(`Site resumed`, { siteId, domain });
}

/**
 * After a subscription is renewed or extended, bring back its site if it was
 * suspended for expiry. Sites an admin suspended manually stay suspended.
 * Best-effort: failures are logged, not thrown.
 */
export async function resumeSiteIfExpired(subscriptionId: string): Promise<void> {
  const site = await prisma.site.findUnique({ where: { subscriptionId } });
  if (!site || site.status !== "SUSPENDED" || site.suspendReason !== "EXPIRED") return;
  try {
    await resumeSite(site.id);
  } catch (error) {
    logger.error("Failed to resume site after renewal", { siteId: site.id, error });
  }
}

/**
 * Subscriptions created before this date are never expired automatically.
 * Before expiry was enforced, some subscriptions were created with end dates
 * that don't match what customers paid for (e.g. 30 days on a yearly plan),
 * so existing customers are left alone. Admins expire those by hand.
 */
export function expiryEnforcementStart(): Date {
  return new Date(env.EXPIRY_ENFORCEMENT_START || "2026-11-12T00:00:00Z");
}

/**
 * Marks overdue subscriptions EXPIRED and suspends their sites.
 * ACTIVE and CANCELLED subscriptions both keep access until endDate.
 */
export async function enforceSubscriptionExpiry(now = new Date()) {
  const overdue = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "CANCELLED"] },
      endDate: { lt: now },
      createdAt: { gte: expiryEnforcementStart() },
      deletedAt: null,
    },
    include: { site: true },
  });

  const results: { subscriptionId: string; siteId?: string; suspended: boolean; error?: string }[] = [];

  for (const sub of overdue) {
    if (sub.site && sub.site.status === "ACTIVE" && !sub.site.deletedAt) {
      try {
        await suspendSite(sub.site.id, "EXPIRED");
      } catch (error) {
        // Leave the subscription as-is so the next run retries the suspension
        const message = error instanceof Error ? error.message : String(error);
        logger.error("Failed to suspend expired site", { siteId: sub.site.id, error: message });
        results.push({ subscriptionId: sub.id, siteId: sub.site.id, suspended: false, error: message });
        continue;
      }
    }

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "EXPIRED" },
    });
    results.push({ subscriptionId: sub.id, siteId: sub.site?.id, suspended: !!sub.site && sub.site.status === "ACTIVE" });
  }

  return results;
}
