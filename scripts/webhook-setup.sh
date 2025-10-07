#!/bin/bash

#############################################
# Visa Assistant - GitHub Webhook Setup
# Sets up automatic deployment on git push
#############################################

set -e

echo "============================================"
echo "GitHub Webhook Setup for Auto-Deployment"
echo "============================================"
echo ""

WEBHOOK_PORT=9000
WEBHOOK_SECRET=$(openssl rand -hex 32)
WEBHOOK_DIR="/opt/webhook"

echo "📦 Installing webhook..."
apt install -y webhook

echo "📁 Creating webhook directory..."
mkdir -p $WEBHOOK_DIR

echo "🔑 Generating webhook secret..."
echo "Your webhook secret: $WEBHOOK_SECRET"
echo ""
echo "⚠️  SAVE THIS SECRET! You'll need it for GitHub webhook configuration."
echo ""

# Create webhook configuration
cat > $WEBHOOK_DIR/hooks.json <<EOF
[
  {
    "id": "visa-assistant-deploy",
    "execute-command": "/var/www/visaassistant/scripts/deploy.sh",
    "command-working-directory": "/var/www/visaassistant",
    "response-message": "Deploying Visa Assistant...",
    "trigger-rule": {
      "and": [
        {
          "match": {
            "type": "payload-hmac-sha256",
            "secret": "$WEBHOOK_SECRET",
            "parameter": {
              "source": "header",
              "name": "X-Hub-Signature-256"
            }
          }
        },
        {
          "match": {
            "type": "value",
            "value": "refs/heads/main",
            "parameter": {
              "source": "payload",
              "name": "ref"
            }
          }
        }
      ]
    }
  }
]
EOF

echo "✅ Webhook configuration created"

# Create systemd service
cat > /etc/systemd/system/webhook.service <<EOF
[Unit]
Description=GitHub Webhook Service for Visa Assistant
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/webhook -hooks $WEBHOOK_DIR/hooks.json -verbose -port $WEBHOOK_PORT
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Start and enable webhook service
systemctl daemon-reload
systemctl enable webhook
systemctl start webhook

# Configure firewall
ufw allow $WEBHOOK_PORT/tcp

echo ""
echo "============================================"
echo "✅ Webhook service configured and started!"
echo "============================================"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Add this webhook to your GitHub repository:"
echo "   - Go to: https://github.com/YOUR_USERNAME/visaassistant/settings/hooks"
echo "   - Click 'Add webhook'"
echo "   - Payload URL: http://YOUR_SERVER_IP:$WEBHOOK_PORT/hooks/visa-assistant-deploy"
echo "   - Content type: application/json"
echo "   - Secret: $WEBHOOK_SECRET"
echo "   - Which events: Just the push event"
echo "   - Active: ✓"
echo ""
echo "2. Test the webhook:"
echo "   - Push a commit to main branch"
echo "   - Webhook will automatically deploy"
echo ""
echo "3. Monitor webhook logs:"
echo "   journalctl -u webhook -f"
echo ""
echo "============================================"
echo ""
echo "⚠️  IMPORTANT: Save your webhook secret!"
echo "Secret: $WEBHOOK_SECRET"
echo ""
