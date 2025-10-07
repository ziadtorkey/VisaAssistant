# Hetzner Server Deployment Guide

Complete guide for deploying the Visa Assistant application on your own Hetzner Ubuntu server with persistent database, SSL, and easy updates.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Domain Configuration](#domain-configuration)
4. [Initial Deployment](#initial-deployment)
5. [SSL Certificate Setup](#ssl-certificate-setup)
6. [Updating Your Application](#updating-your-application)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Optional: Automated Deployments](#optional-automated-deployments)

---

## Prerequisites

### What You Need

1. **Hetzner Account** - Sign up at [hetzner.com](https://www.hetzner.com/)
2. **Domain Name** - From any registrar (Namecheap, Cloudflare, etc.)
3. **GitHub Repository** - Your code pushed to GitHub
4. **API Keys** - Perplexity and/or OpenAI API keys
5. **SSH Client** - Terminal on Mac/Linux, PuTTY on Windows

### Recommended Server Specs

**Hetzner CX22** (~€5.83/month):
- 2 vCPU cores
- 4GB RAM
- 40GB SSD
- Ubuntu 22.04 LTS

---

## Server Setup

### Step 1: Create Server on Hetzner

1. Log in to [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Click **"New Project"** → Name it "Visa Assistant"
3. Click **"Add Server"**
4. Select:
   - **Location**: Choose closest to your users
   - **Image**: Ubuntu 22.04
   - **Type**: CX22 (or higher)
   - **Networking**: Enable IPv4
   - **SSH Keys**: Add your SSH public key
5. **Name**: `visa-assistant-prod`
6. Click **"Create & Buy Now"**

7. **Note your server IP address** (e.g., `95.217.123.45`)

### Step 2: Initial SSH Connection

```bash
ssh root@YOUR_SERVER_IP
```

If prompted, type `yes` to accept the fingerprint.

### Step 3: Run Automated Setup Script

Once connected, run these commands:

```bash
# Update system first
apt update && apt upgrade -y

# Clone repository
cd /var/www
git clone https://github.com/YOUR_USERNAME/visaassistant.git
cd visaassistant

# Make scripts executable
chmod +x scripts/*.sh

# Run server setup script
./scripts/server-setup.sh
```

This script will install:
- ✅ Node.js v20 LTS
- ✅ PM2 process manager
- ✅ Nginx web server
- ✅ Certbot for SSL
- ✅ Firewall configuration

**The setup takes ~5-10 minutes.**

---

## Domain Configuration

### Step 1: Configure DNS Records

In your domain registrar's DNS settings (e.g., Namecheap, Cloudflare):

1. Add **A Record**:
   - **Host**: `@` (or leave empty for root domain)
   - **Value**: `YOUR_SERVER_IP`
   - **TTL**: Automatic or 300

2. Add **A Record** for www:
   - **Host**: `www`
   - **Value**: `YOUR_SERVER_IP`
   - **TTL**: Automatic or 300

**Example with Namecheap:**
```
Type    Host    Value               TTL
A       @       95.217.123.45       Automatic
A       www     95.217.123.45       Automatic
```

**Wait 5-15 minutes for DNS propagation.**

### Step 2: Verify DNS

```bash
# Test if domain points to your server
dig +short yourdomain.com
# Should return: YOUR_SERVER_IP

# Or use:
nslookup yourdomain.com
```

---

## Initial Deployment

### Step 1: Configure Environment Variables

```bash
cd /var/www/visaassistant/backend

# Copy production template
cp .env.production .env

# Edit environment file
nano .env
```

Update these values:

```bash
# Generate a strong JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Add your API keys
PERPLEXITY_API_KEY=pplx-your-actual-key
OPENAI_API_KEY=sk-your-actual-key

# Keep these as-is
PORT=5000
NODE_ENV=production
DATA_EXPIRY_DAYS=14
AI_SCRAPER=perplexity
USE_AI_SCRAPER=true
```

**Save**: `Ctrl+X`, then `Y`, then `Enter`

### Step 2: Initialize Application

```bash
cd /var/www/visaassistant

# Create logs directory
mkdir -p logs

# Install backend dependencies
cd backend
npm install --production

# Initialize database
npm run init-db
```

You should see:
```
Creating database tables...
Tables created successfully
Seeding 195 countries...
Data seeded successfully
```

### Step 3: Build Frontend

```bash
cd /var/www/visaassistant/frontend

# Install dependencies
npm install

# Build with correct API URL (replace with your domain)
VITE_API_URL=https://yourdomain.com npm run build
```

### Step 4: Start Backend with PM2

```bash
cd /var/www/visaassistant

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

You should see `visa-backend` running.

### Step 5: Configure Nginx

```bash
# Copy Nginx configuration
cp /var/www/visaassistant/nginx/visaassistant.conf /etc/nginx/sites-available/visaassistant

# Edit configuration with your domain
nano /etc/nginx/sites-available/visaassistant
```

**Replace ALL occurrences of `yourdomain.com` with your actual domain.**

```bash
# Enable site
ln -s /etc/nginx/sites-available/visaassistant /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# If test passes, reload Nginx
systemctl reload nginx
```

### Step 6: Test HTTP Access

Visit: `http://yourdomain.com`

You should see your application (without HTTPS yet).

---

## SSL Certificate Setup

### Step 1: Obtain SSL Certificate

```bash
# Run Certbot
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Follow prompts:**
- Enter email address
- Agree to Terms of Service
- Choose whether to redirect HTTP to HTTPS: **Yes (2)**

### Step 2: Verify SSL

Visit: `https://yourdomain.com`

You should see:
- ✅ Green padlock in browser
- ✅ Application loads with HTTPS
- ✅ API calls work

### Step 3: Test Auto-Renewal

```bash
# Dry-run renewal test
certbot renew --dry-run
```

Should say: "The dry run was successful"

**SSL certificates auto-renew every 60 days automatically.**

---

## Updating Your Application

### Method 1: Manual Deployment Script (Recommended)

**On your server:**

```bash
cd /var/www/visaassistant
./scripts/deploy.sh
```

This script automatically:
1. ✅ Pulls latest code from GitHub
2. ✅ Installs dependencies
3. ✅ Updates database
4. ✅ Builds frontend
5. ✅ Restarts backend
6. ✅ Reloads Nginx

**Takes ~2-3 minutes. Zero downtime!**

### Method 2: Manual Commands

If you need more control:

```bash
cd /var/www/visaassistant

# Pull latest code
git pull origin main

# Update backend
cd backend
npm install --production
npm run init-db
cd ..

# Rebuild frontend
cd frontend
npm install
VITE_API_URL=https://yourdomain.com npm run build
cd ..

# Restart backend
pm2 restart visa-backend
pm2 save

# Reload Nginx
systemctl reload nginx
```

---

## Monitoring & Maintenance

### View Application Status

```bash
# PM2 status
pm2 status

# Detailed info
pm2 info visa-backend

# Resource usage
pm2 monit
```

### View Logs

```bash
# Backend logs (live)
pm2 logs visa-backend

# Backend logs (last 100 lines)
pm2 logs visa-backend --lines 100

# Nginx access logs
tail -f /var/log/nginx/visaassistant-access.log

# Nginx error logs
tail -f /var/log/nginx/visaassistant-error.log

# System logs
journalctl -u nginx -f
```

### Restart Services

```bash
# Restart backend
pm2 restart visa-backend

# Restart Nginx
systemctl restart nginx

# Restart all services
pm2 restart all && systemctl restart nginx
```

### Database Backup

```bash
# Create backup
cp /var/www/visaassistant/backend/database.sqlite \
   /var/www/visaassistant/backups/database-$(date +%Y%m%d).sqlite

# Restore backup
cp /var/www/visaassistant/backups/database-YYYYMMDD.sqlite \
   /var/www/visaassistant/backend/database.sqlite

pm2 restart visa-backend
```

**Recommended: Set up automated daily backups with cron.**

### Server Resource Monitoring

```bash
# CPU and memory usage
htop

# Disk usage
df -h

# Disk I/O
iotop

# Network connections
netstat -tulpn
```

---

## Troubleshooting

### Issue: Can't connect to domain

**Solution:**
```bash
# Check if Nginx is running
systemctl status nginx

# Check if PM2 backend is running
pm2 status

# Check DNS
dig +short yourdomain.com
```

### Issue: API returns 502 Bad Gateway

**Solution:**
```bash
# Check backend logs
pm2 logs visa-backend --err

# Restart backend
pm2 restart visa-backend

# Check if backend is listening on port 5000
netstat -tulpn | grep 5000
```

### Issue: Countries list is empty

**Solution:**
```bash
# Re-initialize database
cd /var/www/visaassistant/backend
npm run init-db

# Restart backend
pm2 restart visa-backend
```

### Issue: SSL certificate not working

**Solution:**
```bash
# Check certificate status
certbot certificates

# Renew certificate
certbot renew --force-renewal

# Restart Nginx
systemctl restart nginx
```

### Issue: Out of disk space

**Solution:**
```bash
# Check disk usage
df -h

# Clean up PM2 logs
pm2 flush

# Clean up old npm cache
npm cache clean --force

# Remove old log files
find /var/log -type f -name "*.log" -mtime +30 -delete
```

---

## Optional: Automated Deployments

### GitHub Webhook Setup

Set up automatic deployment whenever you push to GitHub:

```bash
cd /var/www/visaassistant
./scripts/webhook-setup.sh
```

**Follow the instructions to:**
1. Get your webhook secret
2. Add webhook to GitHub repository
3. Test auto-deployment

**Now every push to `main` branch automatically deploys!**

---

## Security Best Practices

### 1. Change Default Admin Password

After first login to `/admin`:
1. Login with `admin` / `admin123`
2. Create a new admin user
3. Delete or change the default admin password

### 2. Configure Firewall

```bash
# Check UFW status
ufw status

# Ensure only necessary ports are open
ufw status numbered
```

Should show:
- ✅ SSH (22)
- ✅ HTTP (80)
- ✅ HTTPS (443)

### 3. Keep System Updated

```bash
# Regular updates
apt update && apt upgrade -y

# Reboot if kernel updated
reboot
```

### 4. Monitor Failed Login Attempts

```bash
# Check auth logs
tail -f /var/log/auth.log | grep Failed
```

---

## Performance Optimization

### Enable PM2 Cluster Mode (Optional)

For better performance with multiple CPU cores:

Edit `ecosystem.config.js`:
```javascript
instances: 2,  // Change from 1 to 2 (or more)
exec_mode: 'cluster',  // Change from 'fork'
```

Then:
```bash
pm2 reload ecosystem.config.js
```

### Nginx Caching (Optional)

Add to Nginx config for better performance:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m;
```

---

## Cost Breakdown

| Item | Cost |
|------|------|
| Hetzner CX22 Server | €5.83/month |
| Domain Name | ~$12/year |
| SSL Certificate | Free (Let's Encrypt) |
| **Total** | **~$7-8/month** |

**Much cheaper than Render/Heroku paid plans with better performance!**

---

## Support & Resources

- **Hetzner Docs**: https://docs.hetzner.com/
- **PM2 Docs**: https://pm2.keymetrics.io/
- **Nginx Docs**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/docs/

---

## Quick Reference Commands

```bash
# Deploy updates
./scripts/deploy.sh

# View logs
pm2 logs visa-backend

# Restart services
pm2 restart visa-backend && systemctl reload nginx

# Check status
pm2 status && systemctl status nginx

# Backup database
cp backend/database.sqlite backups/database-$(date +%Y%m%d).sqlite
```

---

**🎉 Congratulations! Your Visa Assistant is now running on your own server with full control and persistent data!**
