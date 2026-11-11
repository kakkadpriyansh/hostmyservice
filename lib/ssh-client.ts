import { NodeSSH } from "node-ssh";
import { env } from "@/lib/env";
import { writeFile, rm } from "fs/promises";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

export class SSHClient {
  private ssh: NodeSSH;

  constructor() {
    this.ssh = new NodeSSH();
  }

  async connect() {
    if (!env.VPS_HOST || !env.VPS_USER || !env.VPS_PRIVATE_KEY) {
      throw new Error(
        "VPS_HOST, VPS_USER, and VPS_PRIVATE_KEY must be set to use SSH features."
      );
    }
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

  /** Writes `content` to `remotePath` via a temporary local file and SFTP. */
  async uploadString(content: string, remotePath: string) {
    const tempFile = path.join(os.tmpdir(), `hms-upload-${randomUUID()}`);
    try {
      await writeFile(tempFile, content, { mode: 0o600 });
      await this.ssh.putFile(tempFile, remotePath);
    } catch (error) {
      console.error(`Failed to upload string to ${remotePath}`, error);
      throw error;
    } finally {
      await rm(tempFile, { force: true });
    }
  }

  dispose() {
    this.ssh.dispose();
  }
}
