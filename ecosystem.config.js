module.exports = {
  apps: [
    {
      name: 'visa-backend',
      script: './backend/src/server.js',
      cwd: '/var/www/visaassistant',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/www/visaassistant/logs/backend-error.log',
      out_file: '/var/www/visaassistant/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Restart configuration
      min_uptime: '10s',
      max_restarts: 10,

      // Environment-specific settings
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ],

  deploy: {
    production: {
      user: 'root',
      host: 'YOUR_SERVER_IP',
      ref: 'origin/main',
      repo: 'https://github.com/YOUR_USERNAME/visaassistant.git',
      path: '/var/www/visaassistant',
      'pre-deploy-local': '',
      'post-deploy': 'cd backend && npm install --production && cd ../frontend && npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
