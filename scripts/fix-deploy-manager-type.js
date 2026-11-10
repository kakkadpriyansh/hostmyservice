const fs = require('fs');

const p = 'C:/Users/DELL/Desktop/hostmyservice/components/admin/deploy-manager.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/if \(res\.logs\) \{/g, 'if ("logs" in res && res.logs) {');

fs.writeFileSync(p, c, 'utf8');
console.log('Fixed type guard in deploy-manager.tsx');
