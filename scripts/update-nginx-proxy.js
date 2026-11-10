const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function updateNginxReverseProxy() {
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

  const domain = 'raj.prnexgen.in';
  const port = 3020;

  const nginxConf = `server {
    server_name ${domain} www.${domain};

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    listen [::]:443 ssl;
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = ${domain}) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    listen [::]:80;
    server_name ${domain} www.${domain};
    return 404;
}
`;

  const tempFile = path.join(os.tmpdir(), `nginx-${Date.now()}.conf`);
  fs.writeFileSync(tempFile, nginxConf);
  await ssh.putFile(tempFile, `/tmp/${domain}.conf`);
  fs.unlinkSync(tempFile);

  await ssh.execCommand(`sudo mv /tmp/${domain}.conf /etc/nginx/sites-available/${domain}`);
  const testRes = await ssh.execCommand('nginx -t');
  console.log('Nginx test:', testRes.stdout, testRes.stderr);
  await ssh.execCommand('systemctl reload nginx');
  console.log('Nginx reloaded successfully!');

  const pm2Res = await ssh.execCommand('pm2 list');
  console.log('\n=== CURRENT PM2 PROCESS LIST ===');
  console.log(pm2Res.stdout);

  ssh.dispose();
}

updateNginxReverseProxy();
