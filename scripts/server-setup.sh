#!/bin/bash

#############################################
# Visa Assistant - Hetzner Server Setup Script
# This script sets up a fresh Ubuntu server for deployment
#############################################

set -e  # Exit on error

echo "============================================"
echo "Visa Assistant - Server Setup"
echo "============================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install essential tools
echo "🔧 Installing essential tools..."
apt install -y curl wget git build-essential ufw

# Install Node.js (v20 LTS)
echo "📦 Installing Node.js v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Install PM2 globally
echo "📦 Installing PM2 process manager..."
npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root
echo "✅ PM2 installed and configured for auto-start"

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Install Certbot for SSL
echo "📦 Installing Certbot for SSL certificates..."
apt install -y certbot python3-certbot-nginx

# Configure firewall
echo "🔒 Configuring firewall (UFW)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable
echo "✅ Firewall configured"

# Create application directory
echo "📁 Creating application directory..."
APP_DIR="/var/www/visaassistant"
mkdir -p $APP_DIR
cd $APP_DIR

echo ""
echo "============================================"
echo "✅ Server setup complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Clone your repository:"
echo "   cd $APP_DIR"
echo "   git clone https://github.com/YOUR_USERNAME/visaassistant.git ."
echo ""
echo "2. Configure environment variables:"
echo "   cp backend/.env.production backend/.env"
echo "   nano backend/.env  # Edit with your values"
echo ""
echo "3. Run the deployment script:"
echo "   chmod +x scripts/deploy.sh"
echo "   ./scripts/deploy.sh"
echo ""
echo "4. Configure Nginx:"
echo "   cp nginx/visaassistant.conf /etc/nginx/sites-available/visaassistant"
echo "   ln -s /etc/nginx/sites-available/visaassistant /etc/nginx/sites-enabled/"
echo "   # Edit /etc/nginx/sites-available/visaassistant with your domain"
echo "   nginx -t"
echo "   systemctl restart nginx"
echo ""
echo "5. Setup SSL certificate (after DNS is configured):"
echo "   certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo ""
echo "============================================"
