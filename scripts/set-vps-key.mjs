/**
 * Writes an SSH private key into .env as VPS_PRIVATE_KEY (newlines escaped as \n).
 * The key itself is never printed or committed.
 *
 * Usage:
 *   node scripts/set-vps-key.mjs ~/.ssh/hostmyservice_deploy [path/to/.env]
 */
import fs from "fs";
import os from "os";
import path from "path";

const [keyArg, envArg = ".env"] = process.argv.slice(2);
if (!keyArg) {
  console.error("Usage: node scripts/set-vps-key.mjs <private-key-file> [env-file]");
  process.exit(1);
}

const keyPath = path.resolve(keyArg.replace(/^~(?=$|\/)/, os.homedir()));
const envPath = path.resolve(envArg);

const key = fs.readFileSync(keyPath, "utf8").trim();
if (!key.includes("PRIVATE KEY")) {
  console.error(`${keyPath} does not look like a private key.`);
  process.exit(1);
}
if (key.includes("ENCRYPTED") || key.includes("Proc-Type: 4,ENCRYPTED")) {
  console.error("This key has a passphrase. The deployer needs a key without one.");
  process.exit(1);
}

const line = `VPS_PRIVATE_KEY="${key.replace(/\r?\n/g, "\\n")}"`;
const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const updated = /^VPS_PRIVATE_KEY=.*$/m.test(existing)
  ? existing.replace(/^VPS_PRIVATE_KEY=.*$/m, line)
  : `${existing.replace(/\n?$/, "\n")}${line}\n`;

fs.writeFileSync(envPath, updated, { mode: 0o600 });
console.log(`VPS_PRIVATE_KEY written to ${envPath} (${key.length} chars).`);
