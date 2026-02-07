"use server";

import { SSHClient } from "@/lib/ssh-client";
import { generateNginxConfig } from "@/lib/nginx-config";
import prisma from "@/lib/prisma";
import { siteIdSchema, domainSchema } from "@/lib/validations";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface DeployResult {
  success: boolean;
  message?: string;
  error?: string;
  logs?: string[];
}

export async function deploySite(siteId: string, sourcePath: string): Promise<DeployResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized access" };
  }

  // Validate Inputs
  const siteIdResult = siteIdSchema.safeParse(siteId);
  if (!siteIdResult.success) {
    return { success: false, error: "Invalid Site ID" };
  }

  const logs: string[] = [];
  
  // Create initial deployment record
  const deployment = await prisma.deployment.create({
    data: {
      siteId: siteId,
      status: "PENDING",
    }
  });

  const logStep = async (step: string, output: string, status: "SUCCESS" | "FAILED" | "PENDING") => {
    console.log(`[Deploy ${siteId}] ${step}: ${output}`);
    logs.push(`${new Date().toISOString()}: [${step}] ${output}`);
    
    await prisma.deploymentLog.create({
      data: {
        deploymentId: deployment.id,
        step,
        output,
        status,
      }
    });
  };

  const ssh = new SSHClient();

  try {
    // 1. Fetch Site Details
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: { user: true }
    });

    if (!site) {
      await logStep("Init", "Site not found", "FAILED");
      return { success: false, error: "Site not found" };
    }
    
    const domain = site.domain;
    
    // Validate Domain strictly
    const domainResult = domainSchema.safeParse(domain);
    if (!domainResult.success) {
        throw new Error(`Invalid domain format: ${domainResult.error.message}`);
    }

    await logStep("Init", `Starting deployment for ${domain}`, "SUCCESS");
    
    // 2. Connect to VPS
    await logStep("SSH", "Connecting to VPS...", "PENDING");
    await ssh.connect();
    await logStep("SSH", "Connected to VPS", "SUCCESS");

    // 3. Create Remote Directory
    const remoteDir = `/var/www/${domain}`;
    await logStep("Files", `Creating remote directory: ${remoteDir}`, "PENDING");
    // Ensure parent dir exists and set permissions
    await ssh.execCommand(`sudo mkdir -p ${remoteDir}`);
    await ssh.execCommand(`sudo chown -R $USER:$USER ${remoteDir}`);
    await logStep("Files", "Remote directory created", "SUCCESS");
    
    // 4. Upload Files
    await logStep("Upload", `Uploading files from ${sourcePath} to ${remoteDir}...`, "PENDING");
    await ssh.uploadDirectory(sourcePath, remoteDir);
    await logStep("Upload", "Files uploaded successfully", "SUCCESS");

    // 5. Generate and Upload Nginx Config
    await logStep("Nginx", "Generating Nginx configuration...", "PENDING");
    const nginxConfig = generateNginxConfig(domain);
    const configPath = `/etc/nginx/sites-available/${domain}`;
    
    // Upload to tmp first
    const tmpConfigPath = `/tmp/${domain}.conf`;
    await ssh.uploadString(nginxConfig, tmpConfigPath);
    
    // Move with sudo
    await logStep("Nginx", "Applying Nginx config...", "PENDING");
    await ssh.execCommand(`sudo mv ${tmpConfigPath} ${configPath}`);
    await ssh.execCommand(`sudo chown root:root ${configPath}`); 
    await logStep("Nginx", "Nginx config applied", "SUCCESS");

    // 6. Enable Site (Symlink)
    const enabledPath = `/etc/nginx/sites-enabled/${domain}`;
    await logStep("Nginx", `Enabling site (symlinking)...`, "PENDING");
    await ssh.execCommand(`sudo ln -sf ${configPath} ${enabledPath}`);
    await logStep("Nginx", "Site enabled", "SUCCESS");

    // 7. Test Nginx Config
    await logStep("Nginx", "Testing configuration...", "PENDING");
    const testResult = await ssh.execCommand("sudo nginx -t");
    if (testResult.code !== 0) {
      throw new Error(`Nginx test failed: ${testResult.stderr}`);
    }
    await logStep("Nginx", "Configuration valid", "SUCCESS");

    // 8. Reload Nginx
    await logStep("Nginx", "Reloading Nginx...", "PENDING");
    await ssh.execCommand("sudo systemctl reload nginx");
    await logStep("Nginx", "Nginx reloaded successfully", "SUCCESS");

    // 9. Update Deployment Status in DB
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: { status: "DEPLOYED" }
    });

    await prisma.site.update({
      where: { id: siteId },
      data: { serverPath: remoteDir }
    });

    await logStep("Complete", "Deployment completed successfully", "SUCCESS");
    
    return { success: true, message: "Deployment successful", logs };

  } catch (error: any) {
    const errorMsg = error.message || "Unknown error";
    await logStep("Error", `Deployment failed: ${errorMsg}`, "FAILED");
    
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: { status: "FAILED" }
    });

    return { success: false, error: errorMsg, logs };
  } finally {
    ssh.dispose();
  }
}
