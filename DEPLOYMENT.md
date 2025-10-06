# Deployment Guide - Render.com

This guide will walk you through deploying the Visa Assistant application to Render.com with automatic SSL certificates and custom domain support.

## Prerequisites

1. A GitHub account with this repository pushed
2. A Render.com account (free tier available) - Sign up at https://render.com
3. Your API keys:
   - Perplexity API key (or OpenAI API key)
   - A secure JWT secret

## Deployment Steps

### Step 1: Push Your Code to GitHub

Ensure all your latest changes are committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Connect Render to Your GitHub Repository

1. Log in to [Render.com](https://render.com)
2. Click "New +" and select "Blueprint"
3. Connect your GitHub account if you haven't already
4. Select your `visaassistant` repository
5. Render will automatically detect the `render.yaml` file

### Step 3: Configure Environment Variables

Render will create two services based on `render.yaml`:
- **visa-assistant-backend** (Web Service)
- **visa-assistant-frontend** (Static Site)

#### Backend Environment Variables

You need to set these in the Render dashboard for the backend service:

1. Go to your backend service settings
2. Navigate to "Environment" tab
3. Add the following environment variables:

| Variable Name | Value | Note |
|--------------|-------|------|
| `JWT_SECRET` | (auto-generated) | Keep the auto-generated value or use your own secure secret |
| `PERPLEXITY_API_KEY` | your-api-key | Your Perplexity API key |
| `OPENAI_API_KEY` | your-api-key | Your OpenAI API key (optional fallback) |
| `AI_SCRAPER` | perplexity | Set to "perplexity" or "openai" |
| `USE_AI_SCRAPER` | true | Enable AI scraping |
| `DATA_EXPIRY_DAYS` | 14 | How long to cache data |
| `NODE_ENV` | production | Auto-set by Render |
| `PORT` | 5000 | Auto-set by Render |

#### Frontend Environment Variables

The frontend will automatically get the `VITE_API_URL` from the backend service URL. No manual configuration needed!

### Step 4: Database Persistence (Free Tier Limitation)

**⚠️ IMPORTANT**: The free tier does NOT support persistent disks. Your database will be reset when:
- The service restarts
- The service is redeployed
- The service spins down and back up

**Options:**

1. **Use Free Tier** (for testing): Database will reset on restarts
2. **Upgrade to Starter Plan** ($7/month): Add persistent disk for database storage
   - Go to backend service → "Disks" tab
   - Add a new disk (1GB is sufficient)
   - Mount path: `/opt/render/project/backend`

For production use, the Starter plan is recommended.

### Step 5: Deploy

1. Click "Apply" or "Create" to start the deployment
2. Render will:
   - Clone your repository
   - Install dependencies for both frontend and backend
   - Initialize the database
   - Build the frontend
   - Start both services

Monitor the deployment logs in the Render dashboard.

### Step 6: Verify Deployment

Once deployed, you'll get two URLs:

- Backend: `https://visa-assistant-backend.onrender.com`
- Frontend: `https://visa-assistant-frontend.onrender.com`

Test the backend health check:
```
https://visa-assistant-backend.onrender.com/api/health
```

You should see:
```json
{"status": "ok", "timestamp": "..."}
```

### Step 7: Custom Domain & SSL (Optional)

#### For the Frontend:

1. Go to your frontend service in Render
2. Click "Settings" → "Custom Domain"
3. Click "Add Custom Domain"
4. Enter your domain (e.g., `visa.yourdomain.com`)
5. Follow the instructions to add DNS records:
   - **CNAME record**: Point your subdomain to the Render URL
   - Or **A record**: Use Render's IP if using root domain
6. Render automatically provisions a free SSL certificate via Let's Encrypt (takes a few minutes)

#### Domain Registrar Setup (Example with Namecheap):

1. Log in to your domain registrar (Namecheap, Cloudflare, etc.)
2. Go to DNS settings for your domain
3. Add a CNAME record:
   - **Host**: `visa` (or `www`, or `@` for root)
   - **Value**: `visa-assistant-frontend.onrender.com`
   - **TTL**: Automatic

Wait 5-15 minutes for DNS propagation.

#### For the Backend:

If you need a custom domain for the API:

1. Go to your backend service
2. Follow the same custom domain steps
3. Example: `api.yourdomain.com` → `visa-assistant-backend.onrender.com`

### Step 8: Update CORS Settings (If Using Custom Domain)

If you set up a custom domain for the frontend, update the backend CORS settings:

1. Edit `backend/src/server.js`
2. Update the CORS configuration:

```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true
}));
```

3. Commit and push the changes
4. Render will automatically redeploy

## Important Notes

### Free Tier Limitations

Render's free tier has some limitations:
- **⚠️ NO PERSISTENT DISK**: Database resets on every restart/redeploy
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- 750 hours/month of usage
- Services may be slower than paid plans

**For production use with persistent database, upgrade to Starter plan ($7/month per service).**

### Database Backup

**Free Tier**: No persistent storage, so backups aren't applicable.

**Paid Plans** (with persistent disk):
1. Use Render's disk snapshots (paid feature)
2. Or periodically download the database:
   ```bash
   # From Render shell (in service dashboard)
   cat backend/database.sqlite > backup.sqlite
   ```

### Monitoring

Monitor your application:
- **Logs**: Available in each service's "Logs" tab
- **Metrics**: Check "Metrics" tab for CPU, memory, bandwidth
- **Health Check**: Backend has `/api/health` endpoint

## Troubleshooting

### Issue: Frontend can't connect to backend

**Solution**:
- Check that `VITE_API_URL` environment variable is set correctly in frontend
- Verify CORS settings in backend
- Check backend logs for errors

### Issue: Database not persisting

**Solution**:
- Verify the disk is properly mounted in Render dashboard
- Check that `init-db` script runs successfully in logs
- Database path should be `/opt/render/project/backend/database.sqlite`

### Issue: Cold starts are slow

**Solution**:
- Upgrade to a paid plan for always-on services
- Or use a service like UptimeRobot to ping your app every 5 minutes

### Issue: Build fails

**Solution**:
- Check the build logs in Render dashboard
- Verify all dependencies are in `package.json`
- Ensure Node.js version compatibility

## Updating Your Application

To deploy updates:

1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
3. Render automatically detects the push and redeploys

You can also manually trigger a deploy in the Render dashboard.

## Alternative: Manual Deployment (Without render.yaml)

If you prefer to set up services manually:

1. Create a new Web Service for the backend
2. Create a new Static Site for the frontend
3. Configure build and start commands manually
4. Set environment variables through the dashboard

## Cost Estimation

- **Free Tier**: $0/month (with limitations)
- **Starter Plan**: $7/month per service (always-on, no cold starts)
- **Custom Domain**: Free
- **SSL Certificate**: Free (Let's Encrypt)

## Support

For issues:
- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- GitHub Issues: Create an issue in your repository

---

**Congratulations!** 🎉 Your Visa Assistant app is now live with automatic HTTPS!
