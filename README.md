# HostMyService - Static Hosting SaaS

A complete SaaS platform for hosting static websites (HTML/CSS/JS) with automated SSL provisioning, VPS deployment, and Razorpay subscription integration.

## 🚀 Features

- **Static Site Hosting**: Drag & drop ZIP upload.
- **Automated Deployment**: Nginx configuration + File upload to VPS via SSH.
- **SSL Automation**: Let's Encrypt (Certbot) integration.
- **Subscription Management**: Razorpay integration for payments (Plans, Orders, Webhooks).
- **Role-Based Access**: Admin and Client dashboards.
- **Tech Stack**: Next.js 14, Prisma (PostgreSQL), Tailwind CSS, NextAuth.js.

## 🛠️ Prerequisites

- Node.js 18+
- PostgreSQL Database
- VPS (Ubuntu 20.04/22.04) with:
  - Nginx installed
  - Certbot installed (`python3-certbot-nginx`)
  - SSH Access (Key-based auth)
  - `unzip` installed
- Razorpay Account (Test Mode)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hostmyservice.git
   cd hostmyservice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env` and fill in the values.
   ```bash
   cp .env.example .env
   ```
   *See [Environment Variables](#environment-variables) below.*

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random string for session encryption |
| `NEXTAUTH_URL` | URL of the app (e.g., http://localhost:3000) |
| `VPS_HOST` | IP Address of the VPS |
| `VPS_USER` | SSH Username (usually root or ubuntu) |
| `VPS_PRIVATE_KEY` | Private SSH Key content (Replace newlines with `\n` if needed, or keep formatting) |
| `RAZORPAY_KEY_ID` | Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret |
| `ADMIN_EMAIL` | Email used for Let's Encrypt registration |

## 🚢 Deployment Checklist (Production)

### 1. VPS Configuration
Ensure your VPS is ready:
```bash
# Update and Install Nginx/Certbot/Unzip
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx unzip -y

# Allow Nginx Ports
sudo ufw allow 'Nginx Full'
```

### 2. Application Deployment
You can deploy this Next.js app to Vercel, or on the same VPS using PM2.

**Option A: Vercel (Recommended for App)**
1. Push code to GitHub.
2. Import project in Vercel.
3. Add Environment Variables in Vercel Settings.
4. **Important**: The `VPS_PRIVATE_KEY` must be properly formatted in Vercel env vars.

**Option B: VPS (Self-hosted)**
1. Build the app: `npm run build`
2. Start with PM2: `pm2 start npm --name "hostmyservice" -- start`

### 3. DNS Configuration
- Point `*.hostmyservice.in` (or your domain) to the VPS IP.
- Point the main app domain (e.g., `app.hostmyservice.in`) to Vercel/VPS IP.

### 4. Post-Deployment Verification
- [ ] Login as Admin.
- [ ] Create a Hosting Plan.
- [ ] Create a Client User.
- [ ] Test Payment Flow (Razorpay Test Mode).
- [ ] Upload a ZIP file (contains `index.html`).
- [ ] Deploy site -> Check if files exist on VPS `/var/www/domain`.
- [ ] Provision SSL -> Check if HTTPS works.

## 🛡️ Security Notes
- **Rate Limiting**: Basic in-memory rate limiting is enabled in `middleware.ts`. For scale, switch to Redis.
- **SSH Keys**: Store `VPS_PRIVATE_KEY` securely. Rotate keys periodically.
- **Input Validation**: All inputs are validated using Zod schemas in `lib/validations.ts`.

## 📄 License
MIT
