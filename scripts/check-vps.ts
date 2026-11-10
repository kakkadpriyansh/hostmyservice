// Load environment variables before anything else
try {
  process.loadEnvFile(".env");
} catch (e) {
  console.log("loadEnvFile fallback", e);
}
import { SSHClient } from "../lib/ssh-client";

async function main() {
  const ssh = new SSHClient();
  try {
    await ssh.connect();
    console.log("Connected to VPS!");
    const pm2Res = await ssh.execCommand("pm2 list");
    console.log("=== PM2 LIST ===");
    console.log(pm2Res.stdout);

    const dirRes = await ssh.execCommand("ls -la /var/www/raj.prnexgen.in");
    console.log("=== /var/www/raj.prnexgen.in ===");
    console.log(dirRes.stdout);

    const curlRes = await ssh.execCommand("curl -I -k https://raj.prnexgen.in");
    console.log("=== CURL HTTPS ===");
    console.log(curlRes.stdout);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    ssh.dispose();
  }
}

main();
