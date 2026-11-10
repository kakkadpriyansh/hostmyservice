const { NodeSSH } = require('node-ssh');
const fs = require('fs');

async function checkPort27018() {
  const envContent = fs.readFileSync('C:/Users/DELL/Desktop/hostmyservice/.env', 'utf8');
  const getVal = (k) => {
    const match = envContent.match(new RegExp(`${k}="?([^"\\r\\n]+)"?`));
    return match ? match[1] : null;
  };

  const ssh = new NodeSSH();
  await ssh.connect({
    host: getVal('VPS_HOST'),
    username: getVal('VPS_USER'),
    privateKey: getVal('VPS_PRIVATE_KEY').replace(/\\n/g, '\n'),
  });

  console.log('--- Checking active port 27018 on VPS ---');
  const psRes = await ssh.execCommand('ps aux | grep 27018 | grep -v grep');
  console.log('PS:', psRes.stdout.trim());

  // Check mongosh admin db users
  const userCheck = await ssh.execCommand(`mongosh --port 27018 admin --quiet --eval 'JSON.stringify(db.getUsers())'`);
  console.log('Admin Users:', userCheck.stdout.trim());

  const rajUserCheck = await ssh.execCommand(`mongosh --port 27018 raj_prnexgen_in --quiet --eval 'JSON.stringify(db.getUsers())'`);
  console.log('raj_prnexgen_in Users:', rajUserCheck.stdout.trim());

  ssh.dispose();
}

checkPort27018();
