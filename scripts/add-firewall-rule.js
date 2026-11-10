const fs = require('fs');

const p = 'C:/Users/DELL/Desktop/hostmyservice/lib/db-provisioner.ts';
let c = fs.readFileSync(p, 'utf8');

// Insert firewall opening command right after starting mongod
const targetStr = 'await new Promise((resolve) => setTimeout(resolve, 2000));';
const replacementStr = `// Ensure the newly spawned MongoDB port is allowed through the VPS firewall
    await this.ssh.execCommand(\`sudo ufw allow \${port}/tcp 2>/dev/null || sudo iptables -A INPUT -p tcp --dport \${port} -j ACCEPT 2>/dev/null\`);

    await new Promise((resolve) => setTimeout(resolve, 2000));`;

c = c.replace(targetStr, replacementStr);
fs.writeFileSync(p, c, 'utf8');
console.log('Added automatic firewall rule for dedicated MongoDB ports in lib/db-provisioner.ts');
