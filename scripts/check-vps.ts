/**
 * Checks the VPS connection and, optionally, one site.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/check-vps.ts [domain]
 */
import { SSHClient } from "../lib/ssh-client";
import { domainSchema } from "../lib/validations";

async function main() {
  const domainArg = process.argv[2];
  const domain = domainArg ? domainSchema.parse(domainArg) : null;

  const ssh = new SSHClient();
  try {
    await ssh.connect();
    console.log("Connected to VPS!");

    const pm2Res = await ssh.execCommand("pm2 list");
    console.log("=== PM2 LIST ===");
    console.log(pm2Res.stdout);

    if (domain) {
      const dirRes = await ssh.execCommand(`ls -la /var/www/${domain}`);
      console.log(`=== /var/www/${domain} ===`);
      console.log(dirRes.stdout || dirRes.stderr);

      const curlRes = await ssh.execCommand(`curl -sI -k https://${domain}`);
      console.log("=== CURL HTTPS ===");
      console.log(curlRes.stdout || curlRes.stderr);
    }
  } catch (err) {
    console.error("Error:", err);
    process.exitCode = 1;
  } finally {
    ssh.dispose();
  }
}

main();
