const fs = require('fs');

const p = 'C:/Users/DELL/Desktop/hostmyservice/lib/db-provisioner.ts';
let c = fs.readFileSync(p, 'utf8');

// 1. In mongod startup, when using --fork, run it directly without PM2 wrapper because mongod has its own daemonizer.
// If using PM2, --fork causes double-forking which PM2 flags as errored.
c = c.replace(
  `    if (hasPm2) {
      // Start managed instance under PM2
      await this.ssh.execCommand(
        \`pm2 start mongod --name "mongo-\${dbName}" -- --port \${port} --dbpath \${dataDir} --logpath \${logFile} --bind_ip 0.0.0.0 --fork\`
      );
    } else {
      // Start as standalone daemon
      await this.ssh.execCommand(
        \`mongod --port \${port} --dbpath \${dataDir} --logpath \${logFile} --bind_ip 0.0.0.0 --fork\`
      );
    }`,
  `    // Start mongod as an independent background daemon process
    await this.ssh.execCommand(
      \`mongod --port \${port} --dbpath \${dataDir} --logpath \${logFile} --bind_ip 0.0.0.0 --fork\`
    );`
);

// 2. Fix the mongosh user creation command using getSiblingDB (which is 100% reliable in mongosh)
c = c.replace(
  `const createUserCmd = \`mongosh --port \${port} --quiet --eval 'use \${dbName}; db.createUser({user: "\${username}", pwd: "\${password}", roles: [{role: "readWrite", db: "\${dbName}"}, {role: "dbAdmin", db: "\${dbName}"}]});'\`;`,
  `const createUserCmd = \`mongosh --port \${port} --quiet --eval "db.getSiblingDB('\${dbName}').createUser({user: '\${username}', pwd: '\${password}', roles: [{role: 'readWrite', db: '\${dbName}'}, {role: 'dbAdmin', db: '\${dbName}'}]})"\`;`
);

fs.writeFileSync(p, c, 'utf8');
console.log('Successfully updated lib/db-provisioner.ts with clean mongod daemonizer & getSiblingDB!');
