/**
 * Opts existing sites into running as their own Linux user.
 *
 * Sites created before November 2026 keep running as root so their behaviour
 * doesn't change. After this script sets the flag, the site moves to its own
 * user on its NEXT deployment (Admin → Deploy). Nothing changes on the server
 * until then.
 *
 * Before opting a site in, check its app doesn't write outside
 * /var/www/<domain> (for example to /root or /var/log), because it won't be
 * allowed to any more.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/isolate-site.ts --list            # show which sites still run as root
 *   npx tsx --env-file=.env scripts/isolate-site.ts example.com [...]  # opt in specific sites
 *   npx tsx --env-file=.env scripts/isolate-site.ts --undo example.com # back to legacy mode
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--list") {
    const legacy = await prisma.site.findMany({
      where: { runAsSiteUser: false, deletedAt: null },
      select: { domain: true, serverPath: true },
      orderBy: { domain: "asc" },
    });
    console.log(`${legacy.length} site(s) still run as root:`);
    for (const site of legacy) {
      console.log(`  ${site.domain}${site.serverPath ? "" : "  (never deployed)"}`);
    }
    return;
  }

  const undo = args[0] === "--undo";
  const domains = undo ? args.slice(1) : args;

  for (const domain of domains) {
    const updated = await prisma.site.updateMany({
      where: { domain },
      data: { runAsSiteUser: !undo },
    });
    if (updated.count === 0) {
      console.error(`No site found: ${domain}`);
      process.exitCode = 1;
    } else {
      console.log(`${domain}: ${undo ? "legacy (root) mode" : "will run as its own user"} from the next deployment`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
