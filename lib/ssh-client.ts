import { NodeSSH } from "node-ssh";
import { env } from "@/lib/env";

export class SSHClient {
  private ssh: NodeSSH;

  constructor() {
    this.ssh = new NodeSSH();
  }

  async connect() {
    try {
      await this.ssh.connect({
        host: env.VPS_HOST,
        username: env.VPS_USER,
        privateKey: env.VPS_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle env var newlines
      });
      console.log("SSH Connected");
    } catch (error) {
      console.error("SSH Connection Failed:", error);
      throw error;
    }
  }

  async execCommand(command: string) {
    try {
      const result = await this.ssh.execCommand(command);
      if (result.stderr && !result.stdout) {
         // Some commands write to stderr even on success (like git), but usually this is an error
         console.warn(`Command '${command}' warning/error:`, result.stderr);
      }
      return { stdout: result.stdout, stderr: result.stderr, code: result.code };
    } catch (error) {
      console.error(`Command execution failed: ${command}`, error);
      throw error;
    }
  }

  async uploadDirectory(localPath: string, remotePath: string) {
    try {
      // Ensure remote directory exists first
      await this.execCommand(`mkdir -p ${remotePath}`);
      
      const status = await this.ssh.putDirectory(localPath, remotePath, {
        recursive: true,
        concurrency: 10,
        validate: (itemPath) => {
          const baseName = itemPath.split('/').pop()!;
          return baseName.substr(0, 1) !== '.' && // ignore hidden files
                 baseName !== 'node_modules'; // ignore node_modules
        },
        tick: (localPath, remotePath, error) => {
          if (error) {
            console.error(`Failed to upload ${localPath}`);
          }
        }
      });
      
      if (!status) {
        throw new Error("Directory upload failed");
      }
      console.log(`Uploaded ${localPath} to ${remotePath}`);
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  }

  async uploadString(content: string, remotePath: string) {
     try {
         // Use a temporary file approach or echo (careful with escaping)
         // node-ssh doesn't have putString directly, but we can write to a temp file locally and upload, 
         // or use execCommand with cat.
         // Safer: scp a temp file.
         
         // Actually, node-ssh usually wraps sftp. Let's see if we can use sftp directly or just execCommand.
         // Echo is risky for complex configs.
         // Let's use sftp writeStream if available, or just save locally and upload.
         
         // Implementation: Write to temp local file then upload.
         const fs = require('fs');
         const path = require('path');
         const os = require('os');
         const tempFile = path.join(os.tmpdir(), `nginx-${Date.now()}.conf`);
         fs.writeFileSync(tempFile, content);
         
         await this.ssh.putFile(tempFile, remotePath);
         fs.unlinkSync(tempFile);
         
     } catch (error) {
         console.error(`Failed to upload string to ${remotePath}`, error);
         throw error;
     }
  }

  dispose() {
    this.ssh.dispose();
  }
}
