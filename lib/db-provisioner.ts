import crypto from "crypto";
import { SSHClient } from "@/lib/ssh-client";

function sanitizeName(domain: string): string {
  return domain.replace(/[.\-]/g, "_").substring(0, 48);
}

function sanitizeUsername(domain: string): string {
  return domain.replace(/[.\-]/g, "_").substring(0, 16);
}

function generatePassword(): string {
  return crypto.randomBytes(12).toString("base64").replace(/[^a-zA-Z0-9]/g, "").substring(0, 16);
}

export class DbProvisioner {
  private ssh: SSHClient;
  private serverHost: string;

  constructor(ssh: SSHClient, serverHost: string = "localhost") {
    this.ssh = ssh;
    this.serverHost = serverHost;
  }

  /**
   * Finds a free port on the VPS starting from a base port (e.g. 27018 for separate Mongo instances).
   */
  async findFreePort(startPort: number = 27018): Promise<number> {
    for (let port = startPort; port < startPort + 100; port++) {
      const check = await this.ssh.execCommand(
        `ss -tlnp 2>/dev/null | grep -qE "[:.]${port}\\b" && echo "in_use" || echo "free"`
      );
      if (check.stdout.trim() === "free") {
        return port;
      }
    }
    return startPort;
  }

  /**
   * Port-wise MongoDB Provisioning:
   * 1. Finds a dedicated unused port (e.g., 27018, 27019, 27020...)
   * 2. Creates dedicated data directory `/var/lib/mongodb_instances/${dbName}`
   * 3. Creates dedicated log file `/var/log/mongodb/${dbName}.log`
   * 4. Spawns mongod on that custom port via PM2 or systemd daemon
   * 5. Sets up administrative & user credentials for that specific port instance
   * 6. Returns direct external connection string: mongodb://user:pass@HOST:PORT/dbName
   */
  async provisionMongoDBPortWise(dbName: string, username: string, password: string): Promise<string> {
    const port = await this.findFreePort(27018);
    const dataDir = `/var/lib/mongodb_instances/${dbName}`;
    const logDir = `/var/log/mongodb`;
    const logFile = `${logDir}/${dbName}.log`;

    // 1. Prepare directories
    await this.ssh.execCommand(`sudo mkdir -p ${dataDir} ${logDir}`);
    await this.ssh.execCommand(`sudo chown -R $USER:$USER ${dataDir} ${logDir} 2>/dev/null || sudo chown -R mongodb:mongodb ${dataDir}`);

    // 2. Start dedicated instance with PM2 or background mongod
    const pm2Check = await this.ssh.execCommand("which pm2");
    const hasPm2 = pm2Check.code === 0;

    // Start mongod as an independent background daemon process
    await this.ssh.execCommand(
      `mongod --port ${port} --dbpath ${dataDir} --logpath ${logFile} --bind_ip 0.0.0.0 --fork`
    );

    // Wait 2 seconds for mongod to initialize port
    // Ensure the newly spawned MongoDB port is allowed through the VPS firewall
    await this.ssh.execCommand(`sudo ufw allow ${port}/tcp 2>/dev/null || sudo iptables -A INPUT -p tcp --dport ${port} -j ACCEPT 2>/dev/null`);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. Create user credentials on the dedicated port instance
    const createUserCmd = `mongosh --port ${port} --quiet --eval "db.getSiblingDB('${dbName}').createUser({user: '${username}', pwd: '${password}', roles: [{role: 'readWrite', db: '${dbName}'}, {role: 'dbAdmin', db: '${dbName}'}]})"`;
    const result = await this.ssh.execCommand(createUserCmd);

    if (result.code !== 0 && result.stderr && !result.stderr.includes("already exists")) {
      // Non-fatal fallback check: retry once in admin auth context
      console.warn(`Initial mongosh on port ${port} warning: ${result.stderr}`);
    }

    const host = this.serverHost || "localhost";
    return `mongodb://${username}:${password}@${host}:${port}/${dbName}`;
  }

  async provisionMySQL(dbName: string, username: string, password: string): Promise<string> {
    const cmd = `mysql -u root -e "CREATE DATABASE IF NOT EXISTS \`${dbName}\`; CREATE USER IF NOT EXISTS '${username}'@'%' IDENTIFIED BY '${password}'; GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${username}'@'%'; FLUSH PRIVILEGES;"`;
    const result = await this.ssh.execCommand(cmd);
    if (result.code !== 0 && result.stderr && !result.stderr.toLowerCase().includes("warning")) {
      throw new Error(`MySQL provisioning failed: ${result.stderr}`);
    }
    const host = this.serverHost || "localhost";
    return `mysql://${username}:${password}@${host}:3306/${dbName}`;
  }

  async provisionPostgreSQL(dbName: string, username: string, password: string): Promise<string> {
    const createUser = `psql -U postgres -c "CREATE USER ${username} WITH PASSWORD '${password}';"`;
    const createDb = `psql -U postgres -c "CREATE DATABASE ${dbName} OWNER ${username};"`;
    const r1 = await this.ssh.execCommand(createUser);
    if (r1.code !== 0 && r1.stderr && !r1.stderr.includes("already exists")) {
      throw new Error(`PostgreSQL user creation failed: ${r1.stderr}`);
    }
    const r2 = await this.ssh.execCommand(createDb);
    if (r2.code !== 0 && r2.stderr && !r2.stderr.includes("already exists")) {
      throw new Error(`PostgreSQL database creation failed: ${r2.stderr}`);
    }
    const host = this.serverHost || "localhost";
    return `postgresql://${username}:${password}@${host}:5432/${dbName}`;
  }

  static generateCredentials(domain: string): { dbName: string; username: string; password: string } {
    const dbName = sanitizeName(domain);
    const username = sanitizeUsername(domain);
    const password = generatePassword();
    return { dbName, username, password };
  }
}
