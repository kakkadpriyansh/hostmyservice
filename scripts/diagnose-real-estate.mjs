import { NodeSSH } from "node-ssh";
process.loadEnvFile('.env');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: "213.210.36.173",
    username: "root",
    privateKey: process.env.VPS_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });

  const pkg = await ssh.execCommand("cat /var/www/real-estate-crm.prnexgen.in/package.json");
  console.log("package.json:\n", pkg.stdout);

  ssh.dispose();
}

main().catch(console.error);
