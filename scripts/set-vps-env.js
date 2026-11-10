const fs = require('fs');

const keyPath = 'C:/Users/DELL/.ssh/hostinger_vps';
const pubPath = 'C:/Users/DELL/.ssh/hostinger_vps.pub';

if (fs.existsSync(keyPath)) {
  const privateKey = fs.readFileSync(keyPath, 'utf8');
  console.log('Private key found. Length:', privateKey.length);

  const envPath = 'C:/Users/DELL/Desktop/hostmyservice/.env';
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Replace VPS_HOST
  envContent = envContent.replace(/VPS_HOST=.*/, 'VPS_HOST="213.210.36.173"');

  // Replace VPS_USER
  envContent = envContent.replace(/VPS_USER=.*/, 'VPS_USER="root"');

  // Format private key with escaped newlines so .env parser handles it cleanly
  const formattedKey = privateKey.replace(/\r?\n/g, '\\n');
  if (envContent.includes('VPS_PRIVATE_KEY=')) {
    envContent = envContent.replace(/VPS_PRIVATE_KEY=.*/, `VPS_PRIVATE_KEY="${formattedKey}"`);
  } else {
    envContent += `\nVPS_PRIVATE_KEY="${formattedKey}"`;
  }

  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('SUCCESS: Updated .env with Host: 213.210.36.173, User: root, and Private Key.');
} else {
  console.error('Private key file does not exist at:', keyPath);
}

if (fs.existsSync(pubPath)) {
  const pubKey = fs.readFileSync(pubPath, 'utf8');
  console.log('--- YOUR PUBLIC KEY (Paste into Hostinger Panel) ---');
  console.log(pubKey.trim());
  console.log('----------------------------------------------------');
}
