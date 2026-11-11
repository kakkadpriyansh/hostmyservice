/**
 * One-time migration for MongoDB databases provisioned before November 2026.
 *
 * Those instances run WITHOUT authentication on a public port, so anyone can
 * read or change the data. Every site's connection string already contains a
 * username and password, so turning authentication on doesn't change anything
 * for customer apps that use the string they were given.
 *
 * Default mode (no impact on customers):
 *   1. make sure the site's database user exists and its password matches the
 *      saved connection string (the old provisioner sometimes failed to create it)
 *   2. restart mongod with --auth under PM2 (survives reboots), same port, same
 *      network binding
 *   3. check the saved credentials work; if not, roll back to the old instance
 *
 * --localhost-only (stricter; breaks customers who connect from outside the VPS):
 *   additionally binds to 127.0.0.1, closes the firewall port, rewrites the
 *   connection string and the site's .env to 127.0.0.1 and restarts the app.
 *
 * Also reports MySQL/PostgreSQL users shared between sites.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/secure-existing-databases.ts                 # dry run
 *   npx tsx --env-file=.env scripts/secure-existing-databases.ts --apply         # enable auth
 *   npx tsx --env-file=.env scripts/secure-existing-databases.ts --apply --localhost-only
 */
import { PrismaClient } from "@prisma/client";
import { NodeSSH } from "node-ssh";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const localhostOnly = process.argv.includes("--localhost-only");

const SAFE = /^[A-Za-z0-9_.-]+$/;

async function main() {
  const { VPS_HOST, VPS_USER, VPS_PRIVATE_KEY } = process.env;
  if (!VPS_HOST || !VPS_USER || !VPS_PRIVATE_KEY) {
    throw new Error(
      "VPS_HOST, VPS_USER and VPS_PRIVATE_KEY must be set (use --env-file=.env).",
    );
  }

  const sites = await prisma.site.findMany({
    where: { dbConnection: { not: null }, deletedAt: null },
    select: { id: true, domain: true, dbConnection: true },
  });

  // Shared usernames mean one customer can access another's database
  const byUser = new Map<string, string[]>();
  for (const site of sites) {
    try {
      const url = new URL(site.dbConnection!);
      const key = `${url.protocol}${decodeURIComponent(url.username)}`;
      byUser.set(key, [...(byUser.get(key) || []), site.domain]);
    } catch {
      // Not a URL; reported below
    }
  }
  for (const [user, domains] of byUser) {
    if (domains.length > 1) {
      console.warn(
        `⚠️  Database user ${user} is shared by: ${domains.join(", ")}. Re-provision these databases separately.`,
      );
    }
  }

  const ssh = new NodeSSH();
  await ssh.connect({
    host: VPS_HOST,
    username: VPS_USER,
    privateKey: VPS_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });
  const exec = (cmd: string) => ssh.execCommand(cmd);
  const run = async (cmd: string) => {
    if (!apply) {
      console.log(`   [dry run] ${cmd}`);
      return { code: 0, stdout: "", stderr: "" };
    }
    const r = await exec(cmd);
    if (r.code !== 0) console.log(`   ! ${cmd}\n     ${r.stderr || r.stdout}`);
    return r;
  };
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const hasMongoUser = (
    await exec(`id -u mongodb >/dev/null 2>&1 && echo yes`)
  ).stdout.includes("yes");
  let failures = 0;

  try {
    for (const site of sites) {
      let url: URL;
      try {
        url = new URL(site.dbConnection!);
      } catch {
        console.warn(`Skipping ${site.domain}: dbConnection is not a URL`);
        continue;
      }
      if (url.protocol !== "mongodb:") continue;

      const port = url.port;
      const dbName = url.pathname.replace(/^\//, "");
      const username = decodeURIComponent(url.username);
      const password = decodeURIComponent(url.password);
      if (
        !/^\d+$/.test(port) ||
        ![dbName, username, password, site.domain].every((v) => SAFE.test(v))
      ) {
        console.warn(
          `Skipping ${site.domain}: unexpected connection string format`,
        );
        continue;
      }

      console.log(`\n${site.domain}: MongoDB ${dbName} on port ${port}`);
      const dataDir = `/var/lib/mongodb_instances/${dbName}`;
      const logFile = `/var/log/mongodb/${dbName}.log`;
      const pm2Name = `mongo-${dbName}`;
      const bindIp = localhostOnly ? "127.0.0.1" : "0.0.0.0";
      const canLogin = async () =>
        (
          await exec(
            `mongosh --port ${port} -u ${username} -p ${password} --authenticationDatabase ${dbName} --quiet --eval "db.getName()"`,
          )
        ).code === 0;

      const uid = hasMongoUser ? "--uid mongodb --gid mongodb " : "";
      const startWithAuth = () =>
        run(
          `pm2 start "$(command -v mongod)" --name ${pm2Name} --interpreter none ${uid}-- --port ${port} --dbpath ${dataDir} --logpath ${logFile} --logappend --bind_ip ${bindIp} --auth`,
        );

      // Already migrated by an earlier run?
      const pm2Status = await exec(
        `pm2 describe ${pm2Name} 2>/dev/null | grep -q -- '--auth' && echo migrated`,
      );
      if (pm2Status.stdout.includes("migrated")) {
        if (!localhostOnly) {
          console.log("   already running with --auth, skipping");
          continue;
        }
        // Re-bind to localhost
        await run(`pm2 delete ${pm2Name}`);
        await startWithAuth();
        if (apply) {
          await sleep(3000);
          if (!(await canLogin())) {
            console.error(
              `   ✗ login failed after re-binding; check pm2 logs ${pm2Name}`,
            );
            failures++;
            continue;
          }
        }
      } else {
        // 1. Make sure the user exists with the saved password (instance has no auth yet)
        const userCheck = await exec(
          `mongosh --port ${port} --quiet --eval "JSON.stringify(db.getSiblingDB('${dbName}').getUser('${username}'))"`,
        );
        if (userCheck.code !== 0) {
          console.warn(
            `   ✗ cannot reach mongod on port ${port}: ${userCheck.stderr || userCheck.stdout}. Skipping.`,
          );
          failures++;
          continue;
        }
        if (userCheck.stdout.trim() === "null") {
          console.log(
            `   user ${username} is missing; creating it with the saved password`,
          );
          await run(
            `mongosh --port ${port} --quiet --eval "db.getSiblingDB('${dbName}').createUser({user: '${username}', pwd: '${password}', roles: [{role: 'readWrite', db: '${dbName}'}, {role: 'dbAdmin', db: '${dbName}'}]})"`,
          );
        } else {
          // Reset to the saved password so the customer's connection string keeps working
          await run(
            `mongosh --port ${port} --quiet --eval "db.getSiblingDB('${dbName}').changeUserPassword('${username}', '${password}')"`,
          );
        }
        if (apply && !(await canLogin())) {
          console.warn(
            `   ✗ saved credentials don't work for ${username}; leaving this instance unchanged.`,
          );
          failures++;
          continue;
        }

        // 2. Restart with --auth under PM2 (same port)
        await run(
          `mongod --dbpath ${dataDir} --shutdown || pkill -f "mongod --port ${port} " || true`,
        );
        if (apply) await sleep(2000);
        if (hasMongoUser) {
          await run(`chown -R mongodb:mongodb ${dataDir} /var/log/mongodb`);
        }
        await run(`pm2 delete ${pm2Name} 2>/dev/null || true`);
        await startWithAuth();

        // 3. Verify, or roll back to the previous (unauthenticated) instance
        if (apply) {
          await sleep(3000);
          if (!(await canLogin())) {
            console.error(
              `   ✗ login failed after enabling auth; rolling back ${pm2Name}`,
            );
            await exec(`pm2 delete ${pm2Name} 2>/dev/null || true`);
            await exec(
              `mongod --port ${port} --dbpath ${dataDir} --logpath ${logFile} --logappend --bind_ip 0.0.0.0 --fork`,
            );
            failures++;
            continue;
          }
          console.log("   ✓ authentication enabled; saved credentials work");
        }
      }

      if (localhostOnly) {
        // 4. Close the firewall port
        await run(`ufw delete allow ${port}/tcp 2>/dev/null || true`);
        await run(
          `iptables -D INPUT -p tcp --dport ${port} -j ACCEPT 2>/dev/null || true`,
        );

        // 5. Connection string and .env now point at localhost; restart the app
        const oldHost = url.hostname;
        url.hostname = "127.0.0.1";
        const envFile = `/var/www/${site.domain}/.env`;
        if (SAFE.test(oldHost)) {
          await run(
            `test -f ${envFile} && sed -i 's#@${oldHost}:${port}/#@127.0.0.1:${port}/#g' ${envFile} || true`,
          );
        }
        if (apply) {
          await prisma.site.update({
            where: { id: site.id },
            data: { dbConnection: url.toString() },
          });
        } else {
          console.log(
            `   [dry run] update dbConnection host ${oldHost} -> 127.0.0.1`,
          );
        }
        await run(
          `pm2 restart "${site.domain}" --update-env 2>/dev/null || true`,
        );
      }
    }

    await run(`pm2 save`);
  } finally {
    ssh.dispose();
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to make these changes.");
  } else {
    console.log(
      failures
        ? `\nDone with ${failures} problem(s); see ✗ lines above.`
        : "\nDone.",
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
