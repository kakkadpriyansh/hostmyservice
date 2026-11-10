const fs = require('fs');

try {
  const content = fs.readFileSync('C:/Users/DELL/Desktop/hostmyservice/.env', 'utf8');
  const lines = content.split('\n');
  const keys = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        keys[k] = v;
      }
    }
  }

  const check = (key) => {
    const val = keys[key];
    if (!val || val === '""' || val === "''") return 'MISSING / EMPTY';
    if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')) {
      return `CONFIGURED (secured, len: ${val.length})`;
    }
    return `CONFIGURED (${val})`;
  };

  console.log('=== VPS CONFIGURATION IN .env ===');
  console.log('VPS_HOST:        ', check('VPS_HOST'));
  console.log('VPS_USER:        ', check('VPS_USER'));
  console.log('VPS_PRIVATE_KEY: ', check('VPS_PRIVATE_KEY'));
  console.log('ADMIN_EMAIL:     ', check('ADMIN_EMAIL'));
  console.log('=== OTHER SERVICES ===');
  console.log('DATABASE_URL:    ', check('DATABASE_URL'));
  console.log('NEXTAUTH_URL:    ', check('NEXTAUTH_URL'));
  console.log('RAZORPAY_KEY_ID: ', check('RAZORPAY_KEY_ID'));
  console.log('SMTP_EMAIL:      ', check('SMTP_EMAIL'));
} catch (e) {
  console.error('Error:', e.message);
}
