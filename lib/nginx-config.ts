/**
 * Directory of per-site suspension snippets. A site is suspended by writing
 * `${SUSPEND_DIR}/<domain>.conf` (containing `return 503;`) and reloading nginx.
 * The `.con[f]` glob in the include below matches nothing when the file is
 * absent, so nginx accepts the config either way.
 */
export const SUSPEND_DIR = "/etc/nginx/hostmyservice-suspended";

export function suspendInclude(domain: string): string {
  return `include ${SUSPEND_DIR}/${domain}.con[f];`;
}

// Never serve dotfiles (.env, .git, .npm ...) except ACME challenges
const DENY_DOTFILES = `    location ~ /\\.(?!well-known/) {
        deny all;
        return 404;
    }`;

export function generateNodeNginxConfig(domain: string, port: number): string {
  return `server {
    listen 80;
    listen [::]:80;
    server_name ${domain} www.${domain};

    ${suspendInclude(domain)}

${DENY_DOTFILES}

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    access_log /var/log/nginx/${domain}.access.log;
    error_log /var/log/nginx/${domain}.error.log;
}
`;
}

export function generateNginxConfig(domain: string) {
  return `server {
    listen 80;
    listen [::]:80;
    server_name ${domain} www.${domain};

    ${suspendInclude(domain)}

    root /var/www/${domain};
    index index.html;

${DENY_DOTFILES}

    location / {
        try_files $uri $uri/ =404;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    access_log /var/log/nginx/${domain}.access.log;
    error_log /var/log/nginx/${domain}.error.log;
}
`;
}
