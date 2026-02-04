"use server";

import { SSHClient } from "@/lib/ssh-client";
import { generateNginxConfig } from "@/lib/nginx-config";
import prisma from "@/lib/prisma";
import { siteIdSchema, domainSchema } from "@/lib/validations";

interface DeployResult {
  success: boolean;
  message?: string;
  error?: string;
  logs?: string[];
}

export async function deploySite(siteId: string, sourcePath: string): Promise<DeployResult> {
  // Validate Inputs
  const siteIdResult = siteIdSchema.safeParse(siteId);
  if (!siteIdResult.success) {
    return { success: false, error: "Invalid Site ID" };
  }

  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(`[Deploy ${siteId}] ${msg}`);
    logs.push(`${new Date().toISOString()}: ${msg}`);
  };

  const ssh = new SSHClient();

  try {
    // 1. Fetch Site Details
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: { user: true } // verify ownership/existence
    });

    if (!site) {
      return { success: false, error: "Site not found" };
    }
    
    // Determine primary domain (custom or subdomain)
    // Assuming customDomain is preferred, fallback to subdomain
    const rawDomain = site.customDomain || `${site.subdomain}.hostmyservice.com`; 
    
    // Validate Domain strictly to prevent shell injection
    const domainResult = domainSchema.safeParse(rawDomain);
    if (!domainResult.success) {
        throw new Error(`Invalid domain format: ${domainResult.error.message}`);
    }
    const domain = domainResult.data;

    log(`Starting deployment for ${domain}`);
    
    // 2. Connect to VPS
    log("Connecting to VPS...");
    await ssh.connect();
    log("Connected to VPS.");

    // 3. Create Remote Directory
    const remoteDir = `/var/www/${domain}`;
    log(`Creating remote directory: ${remoteDir}`);
    // -p ensures it doesn't fail if exists, but we might want to clean it first?
    // Let's clean it to ensure no stale files, but keep the dir.
    // await ssh.execCommand(`rm -rf ${remoteDir}/*`); // Dangerous if path is wrong.
    // Safer: Just overwrite.
    
    // 4. Upload Files
    log(`Uploading files from ${sourcePath} to ${remoteDir}...`);
    await ssh.uploadDirectory(sourcePath, remoteDir);
    log("Files uploaded successfully.");

    // 5. Generate and Upload Nginx Config
    log("Generating Nginx configuration...");
    const nginxConfig = generateNginxConfig(domain);
    const configPath = `/etc/nginx/sites-available/${domain}`;
    
    log(`Uploading Nginx config to ${configPath}...`);
    // Note: Writing to /etc/nginx usually requires sudo. 
    // The SSH user must have sudo privileges or permission to write there.
    // Assuming the SSH user is root or has NOPASSWD sudo for these commands.
    // If not root, we might need to upload to /tmp and then sudo mv.
    
    // Let's try direct upload first (assuming root or proper permissions).
    // If we are not root, we upload to tmp then move.
    const tmpConfigPath = `/tmp/${domain}.conf`;
    await ssh.uploadString(nginxConfig, tmpConfigPath);
    
    // Move with sudo
    log("Applying Nginx config...");
    await ssh.execCommand(`sudo mv ${tmpConfigPath} ${configPath}`);
    await ssh.execCommand(`sudo chown root:root ${configPath}`); // ensure ownership

    // 6. Enable Site (Symlink)
    const enabledPath = `/etc/nginx/sites-enabled/${domain}`;
    log(`Enabling site (symlinking to ${enabledPath})...`);
    await ssh.execCommand(`sudo ln -sf ${configPath} ${enabledPath}`);

    // 7. Test Nginx Config
    log("Testing Nginx configuration...");
    const testResult = await ssh.execCommand("sudo nginx -t");
    if (testResult.code !== 0) {
      throw new Error(`Nginx test failed: ${testResult.stderr}`);
    }

    // 8. Reload Nginx
    log("Reloading Nginx...");
    await ssh.execCommand("sudo systemctl reload nginx");
    log("Nginx reloaded successfully.");

    // 9. Update Deployment Status in DB
    // Create a Deployment record
    await prisma.deployment.create({
      data: {
        siteId: site.id,
        status: "DEPLOYED",
        logs: logs.join("\n"),
        commitHash: "manual-upload" // Since it's a zip upload
      }
    });

    log("Deployment completed successfully.");
    
    return { success: true, message: "Deployment successful", logs };

  } catch (error: any) {
    const errorMsg = error.message || "Unknown error";
    log(`Deployment failed: ${errorMsg}`);
    
    // Log failure to DB
    try {
        await prisma.deployment.create({
            data: {
              siteId: siteId,
              status: "FAILED",
              logs: logs.join("\n"),
              commitHash: "manual-upload"
            }
          });
    } catch (dbError) {
        console.error("Failed to save deployment failure log to DB", dbError);
    }

    return { success: false, error: errorMsg, logs };
  } finally {
    ssh.dispose();
  }
}
