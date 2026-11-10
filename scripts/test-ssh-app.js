const { NodeSSH } = require('node-ssh');
const fs = require('fs');

async function testAppSSH() {
  const envContent = fs.readFileSync('C:/Users/DELL/Desktop/hostmyservice/.env', 'utf8');
  const getVal = (k) => {
    const match = envContent.match(new RegExp(`${k}="?([^"\\r\\n]+)"?`));
    return match ? match[1] : null;
  };

  const host = getVal('VPS_HOST');
  const username = getVal('VPS_USER');
  const privateKeyRaw = getVal('VPS_PRIVATE_KEY');

  if (!host || !username || !privateKeyRaw) {
    console.error('Missing credentials in .env');
    return;
  }

  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host,
      username,
      privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
    });
    console.log('✅ HostMyService App successfully connected to VPS via NodeSSH!');
    const res = await ssh.execCommand('uptime');
    console.log('VPS Uptime:', res.stdout.trim());
    ssh.dispose();
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

testAppSSH();
