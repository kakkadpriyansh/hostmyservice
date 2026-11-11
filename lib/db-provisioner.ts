import crypto from "crypto";
import { SSHClient } from "@/lib/ssh-client";
import { shortHash } from "@/lib/shell";

/**
 * Database provisioning for customer sites.
 *
 * Security model:
 * - Every database listens on 127.0.0.1 only. Customer apps run on the same
 *   VPS, so they connect locally; nothing is exposed to the internet.
 * - Every database requires a username and password.
 * - Names include a hash of the full domain, so two domains can never map to
 *   the same database or user (e.g. priyansh.prnexgen.in vs priyansh.prnexgen.com).
 *
 * Generated names and passwords only contain [a-z0-9_] / [A-Za-z0-9], so they
 * are safe to interpolate into the shell commands below.
 */

const DB_HOST = "127.0.0.1";

function generatePassword(): string {
  // 24 alphanumeric chars (~143 bits)
  return crypto.randomBytes(32).toString("base64").replace(/[^a-zA-Z0-9]/g, "").substring(0, 24);
}

export class DbProvisioner {
  private ssh: SSHClient;

  constructor(ssh: SSHClient) {
    this.ssh = ssh;
  }

  static generateCredentials(domain: string): { dbName: string; username: string; password: string } {
    const hash = shortHash(domain, 10);
    const readable = domain.replace(/[^a-z0-9]/g, "_").substring(0, 20);
    return {
      dbName: `${readable}_${hash}`, // <= 31 chars
      username: `u_${hash}`, // 12 chars, fits MySQL's 32-char limit
      password: generatePassword(),
    };
  }

  /** Finds a port nothing is listening on, starting from `startPort`. */
  async findFreePort(startPort: number = 27018): Promise<number> {
    for (let port = startPort; port < startPort + 200; port++) {
      const check = await this.ssh.execCommand(
        `ss -tlnH 2>/dev/null | awk '{print $4}' | grep -qE "[:.]${port}$" && echo "in_use" || echo "free"`
      );
      if (check.stdout.trim() === "free") {
        return port;
      }
    }
    throw new Error(`No free port found between ${startPort} and ${startPort + 199}`);
  }

  /**
   * Dedicated mongod instance per site, managed by PM2 so it survives reboots.
   * 1. Start a temporary instance without auth, bound to localhost only
   * 2. Create the site's user, then shut the temporary instance down
   * 3. Start the permanent instance with --auth under PM2
   */
  async provisionMongoDBPortWise(dbName: string, username: string, password: string): Promise<string> {
    const port = await this.findFreePort(27018);
    const dataDir = `/var/lib/mongodb_instances/${dbName}`;
    const logDir = `/var/log/mongodb`;
    const logFile = `${logDir}/${dbName}.log`;
    const pm2Name = `mongo-${dbName}`;

    await this.ssh.execCommand(`sudo mkdir -p ${dataDir} ${logDir}`);

    // Run mongod as the `mongodb` system user when it exists, never as root
    const hasMongoUser = (await this.ssh.execCommand(`id -u mongodb >/dev/null 2>&1 && echo yes`)).stdout.includes("yes");
    if (hasMongoUser) {
      await this.ssh.execCommand(`sudo chown -R mongodb:mongodb ${dataDir} ${logDir}`);
    }
    const asMongo = hasMongoUser ? "sudo -u mongodb " : "";

    // 1. Temporary instance (localhost only, no auth) to create the first user
    const start = await this.ssh.execCommand(
      `${asMongo}mongod --port ${port} --dbpath ${dataDir} --logpath ${logFile} --bind_ip 127.0.0.1 --fork`
    );
    if (start.code !== 0) {
      throw new Error(`Failed to start MongoDB on port ${port}: ${start.stderr || start.stdout}`);
    }

    try {
      // 2. Create the site's user
      const createUser = await this.ssh.execCommand(
        `mongosh --port ${port} --quiet --eval "db.getSiblingDB('${dbName}').createUser({user: '${username}', pwd: '${password}', roles: [{role: 'readWrite', db: '${dbName}'}, {role: 'dbAdmin', db: '${dbName}'}]})"`
      );
      if (createUser.code !== 0 && !`${createUser.stderr}${createUser.stdout}`.includes("already exists")) {
        throw new Error(`Failed to create MongoDB user: ${createUser.stderr || createUser.stdout}`);
      }
    } finally {
      await this.ssh.execCommand(`${asMongo}mongod --dbpath ${dataDir} --shutdown`);
    }

    // 3. Permanent instance with authentication, managed by PM2
    const pm2Uid = hasMongoUser ? "--uid mongodb --gid mongodb " : "";
    await this.ssh.execCommand(`pm2 delete ${pm2Name} 2>/dev/null || true`);
    const pm2Start = await this.ssh.execCommand(
      `pm2 start "$(command -v mongod)" --name ${pm2Name} --interpreter none ${pm2Uid}-- --port ${port} --dbpath ${dataDir} --logpath ${logFile} --logappend --bind_ip 127.0.0.1 --auth`
    );
    if (pm2Start.code !== 0) {
      throw new Error(`Failed to start MongoDB under PM2: ${pm2Start.stderr || pm2Start.stdout}`);
    }
    await this.ssh.execCommand(`pm2 save`);

    return `mongodb://${username}:${password}@${DB_HOST}:${port}/${dbName}?authSource=${dbName}`;
  }

  async provisionMySQL(dbName: string, username: string, password: string): Promise<string> {
    // ALTER USER makes this safe to re-run: the returned password is always the active one
    const sql = [
      `CREATE DATABASE IF NOT EXISTS \\\`${dbName}\\\``,
      ...["localhost", "127.0.0.1"].flatMap((host) => [
        `CREATE USER IF NOT EXISTS '${username}'@'${host}' IDENTIFIED BY '${password}'`,
        `ALTER USER '${username}'@'${host}' IDENTIFIED BY '${password}'`,
        `GRANT ALL PRIVILEGES ON \\\`${dbName}\\\`.* TO '${username}'@'${host}'`,
      ]),
      `FLUSH PRIVILEGES`,
    ].join("; ");

    const result = await this.ssh.execCommand(`sudo mysql -u root -e "${sql};"`);
    if (result.code !== 0) {
      throw new Error(`MySQL provisioning failed: ${result.stderr || result.stdout}`);
    }
    return `mysql://${username}:${password}@${DB_HOST}:3306/${dbName}`;
  }

  async provisionPostgreSQL(dbName: string, username: string, password: string): Promise<string> {
    const psql = (sql: string) =>
      this.ssh.execCommand(`sudo -u postgres psql -v ON_ERROR_STOP=1 -c "${sql}"`);

    // Create the role, or reset its password if it already exists
    const createUser = await psql(`CREATE ROLE ${username} WITH LOGIN PASSWORD '${password}';`);
    if (createUser.code !== 0) {
      if (!createUser.stderr.includes("already exists")) {
        throw new Error(`PostgreSQL user creation failed: ${createUser.stderr}`);
      }
      const alter = await psql(`ALTER ROLE ${username} WITH LOGIN PASSWORD '${password}';`);
      if (alter.code !== 0) {
        throw new Error(`PostgreSQL password update failed: ${alter.stderr}`);
      }
    }

    const createDb = await psql(`CREATE DATABASE ${dbName} OWNER ${username};`);
    if (createDb.code !== 0 && !createDb.stderr.includes("already exists")) {
      throw new Error(`PostgreSQL database creation failed: ${createDb.stderr}`);
    }

    // Other tenants must not be able to connect to this database
    await psql(`REVOKE ALL ON DATABASE ${dbName} FROM PUBLIC;`);

    return `postgresql://${username}:${password}@${DB_HOST}:5432/${dbName}`;
  }
}
