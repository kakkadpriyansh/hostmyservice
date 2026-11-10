const fs = require('fs');

const p = 'C:/Users/DELL/Desktop/hostmyservice/app/actions/admin/deploy.ts';
let c = fs.readFileSync(p, 'utf8');

// Fix: "use server" must be at the very top line
c = c.replace(/import { runFullDeployment } from "@\/lib\/auto-deploy";\r?\n"use server";/, '"use server";\n\nimport { runFullDeployment } from "@/lib/auto-deploy";');

fs.writeFileSync(p, c, 'utf8');
console.log('Fixed "use server" at top of app/actions/admin/deploy.ts');
