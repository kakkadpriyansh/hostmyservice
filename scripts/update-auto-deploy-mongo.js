const fs = require('fs');

const p = 'C:/Users/DELL/Desktop/hostmyservice/lib/auto-deploy.ts';
let c = fs.readFileSync(p, 'utf8');

// Update to pass env.VPS_HOST and call provisionMongoDBPortWise
c = c.replace(
  'const dbProvisioner = new DbProvisioner(sshDb);',
  'const dbProvisioner = new DbProvisioner(sshDb, env.VPS_HOST || "localhost");'
);

c = c.replace(
  'dbConnectionString = await dbProvisioner.provisionMongoDB(dbName, username, password);',
  'dbConnectionString = await dbProvisioner.provisionMongoDBPortWise(dbName, username, password);'
);

fs.writeFileSync(p, c, 'utf8');
console.log('Updated lib/auto-deploy.ts for port-wise MongoDB');
