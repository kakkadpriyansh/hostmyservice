"use server";

import { SSHClient } from "@/lib/ssh-client";
import prisma from "@/lib/prisma";
import { siteIdSchema, domainSchema } from "@/lib/validations";
import { env } from "@/lib/env";
import { SslStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

interface SslResult {
  success: boolean;
  message?: string;
  error?: string;
  logs?: string[];
}

export async function provisionSSL(siteId: string): Promise<SslResult> {
  // Validate Site ID
  const siteIdResult = siteIdSchema.safeParse(siteId);
  if (!siteIdResult.success) {
    return { success: false, error: "Invalid Site ID" };
  }

  const logs: string[] = [];
  const log = (msg: string) => {
    logger.info(msg, { siteId, context: "SSL Provisioning" });
    logs.push(`${new Date().toISOString()}: ${msg}`);
  };

  const ssh = new SSHClient();

  // 1. Fetch Site
  const site = await prisma.site.findUnique({
    where: { id: siteId },
  });

  if (!site) {
    return { success: false, error: "Site not found" };
  }

  const rawDomain = site.customDomain || `${site.subdomain}.hostmyservice.com`;
  
  // Validate Domain to prevent shell injection
  const domainResult = domainSchema.safeParse(rawDomain);
  if (!domainResult.success) {
    return { success: false, error: `Invalid domain: ${domainResult.error.message}` };
  }
  const domain = domainResult.data;
  
  const adminEmail = env.ADMIN_EMAIL || "admin@hostmyservice.com";

  try {
    // Update status to PENDING
    await prisma.site.update({
      where: { id: siteId },
      data: { sslStatus: SslStatus.PENDING },
    });

    log(`Starting SSL provisioning for ${domain}`);

    // 2. Connect to VPS
    log("Connecting to VPS...");
    await ssh.connect();
    log("Connected.");

    // 3. Check if Nginx config exists
    const checkConfig = await ssh.execCommand(`test -f /etc/nginx/sites-available/${domain} && echo "exists"`);
    if (!checkConfig.stdout.includes("exists")) {
      throw new Error("Nginx configuration not found. Please deploy the site first.");
    }

    // 4. Run Certbot
    // --nginx: Use Nginx plugin
    // --non-interactive: No prompts
    // --agree-tos: Agree to terms
    // --email: Required for registration
    // --redirect: Configure 301 redirect to HTTPS
    // --expand: If cert exists, expand it (useful if adding subdomains)
    log("Running Certbot...");
    const certbotCmd = `sudo certbot --nginx -d ${domain} --non-interactive --agree-tos --email ${adminEmail} --redirect`;
    
    // Note: This command can take time
    const result = await ssh.execCommand(certbotCmd);

    if (result.code !== 0) {
      log(`Certbot failed: ${result.stderr}`);
      // Check for common errors
      if (result.stderr.includes("NXDOMAIN") || result.stderr.includes("Challenge failed")) {
        throw new Error("DNS verification failed. Please ensure the domain points to the server IP.");
      }
      throw new Error(`Certbot execution failed: ${result.stderr}`);
    }

    log("Certbot completed successfully.");
    log(result.stdout);

    // 5. Verify Nginx Config again (Certbot modifies it)
    log("Verifying Nginx configuration...");
    const testResult = await ssh.execCommand("sudo nginx -t");
    if (testResult.code !== 0) {
      // Rollback? Certbot usually backs up.
      // For now, just report error.
      throw new Error(`Nginx test failed after SSL setup: ${testResult.stderr}`);
    }

    // 6. Reload Nginx
    await ssh.execCommand("sudo systemctl reload nginx");
    log("Nginx reloaded.");

    // 7. Update DB Status
    await prisma.site.update({
      where: { id: siteId },
      data: { sslStatus: "ACTIVE" },
    });
    
    // Log success to Deployment history too?
    await prisma.deployment.create({
      data: {
        siteId: site.id,
        status: "DEPLOYED",
        logs: logs.join("\n"),
        commitHash: "ssl-provision"
      }
    });

    return { success: true, message: "SSL provisioned successfully", logs };

  } catch (error: any) {
    const errorMsg = error.message || "Unknown error";
    log(`SSL Provisioning failed: ${errorMsg}`);

    // Update DB Status to FAILED
    await prisma.site.update({
      where: { id: siteId },
      data: { sslStatus: "FAILED" },
    });

    // Log failure
    await prisma.deployment.create({
      data: {
        siteId: site.id,
        status: "FAILED",
        logs: logs.join("\n"),
        commitHash: "ssl-provision-failed"
      }
    });

    return { success: false, error: errorMsg, logs };
  } finally {
    ssh.dispose();
  }
}
