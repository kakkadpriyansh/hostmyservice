const fs = require('fs');

const keyPath = 'C:/Users/DELL/.ssh/hostinger_nopass';
const pubPath = 'C:/Users/DELL/.ssh/hostinger_nopass.pub';

if (fs.existsSync(keyPath)) {
  const privateKey = fs.readFileSync(keyPath, 'utf8');
  console.log('Unencrypted private key found. Length:', privateKey.length);

  const envPath = 'C:/Users/DELL/Desktop/hostmyservice/.env';
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Replace VPS_HOST
  envContent = envContent.replace(/VPS_HOST=.*/, 'VPS_HOST="213.210.36.173"');

  // Replace VPS_USER
  envContent = envContent.replace(/VPS_USER=.*/, 'VPS_USER="root"');

  // Format with \n for .env parser
  const formattedKey = privateKey.trim().replace(/\r?\n/g, '\\n');
  envContent = envContent.replace(/VPS_PRIVATE_KEY=.*/, `VPS_PRIVATE_KEY="${formattedKey}"`);

  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('SUCCESS: Updated .env with clean ED25519 key!');
}

if (fs.existsSync(pubPath)) {
  const pub = fs.readFileSync(pubPath, 'utf8');
  console.log('=== YOUR PUBLIC KEY FOR HOSTINGER ===');
  console.log(pub.trim());
  console.log('====================================');
}
