#!/bin/bash

#############################################
# Visa Assistant - Deployment Script
# Pulls latest code and deploys the application
#############################################

set -e  # Exit on error

echo "============================================"
echo "Visa Assistant - Deployment"
echo "============================================"
echo ""

# Change to application directory
cd /var/www/visaassistant

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Stash any local changes (if any)
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Local changes detected, stashing..."
    git stash
fi

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin $CURRENT_BRANCH

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production

# Initialize/update database
echo "🗄️  Initializing database..."
npm run init-db

# Go back to root
cd ..

# Build frontend
echo "🏗️  Building frontend..."
cd frontend
npm install
VITE_API_URL="https://$(grep -oP '(?<=server_name )[^ ;]+' /etc/nginx/sites-available/visaassistant 2>/dev/null | head -1 || echo 'localhost')" npm run build

# Go back to root
cd ..

# Restart backend with PM2
echo "🔄 Restarting backend service..."
pm2 restart visa-backend || pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Reload Nginx (to pick up any new static files)
echo "🔄 Reloading Nginx..."
nginx -t && systemctl reload nginx

echo ""
echo "============================================"
echo "✅ Deployment complete!"
echo "============================================"
echo ""
echo "📊 Application status:"
pm2 status

echo ""
echo "📝 View logs:"
echo "   Backend: pm2 logs visa-backend"
echo "   Nginx: tail -f /var/log/nginx/access.log"
echo ""
echo "🌐 Application should now be running at:"
echo "   https://$(grep -oP '(?<=server_name )[^ ;]+' /etc/nginx/sites-available/visaassistant 2>/dev/null | head -1 || echo 'your-domain.com')"
echo ""
