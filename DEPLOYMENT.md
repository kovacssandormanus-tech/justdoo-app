# JustDoo Task Manager - Deployment Guide

This guide explains how to deploy JustDoo to Railway.com with Neon.tech PostgreSQL database.

## Prerequisites

- Railway.com account (https://railway.app)
- Neon.tech account (https://neon.tech)
- GitHub account with repository access
- Git CLI installed locally

## Step 1: Set Up Neon.tech PostgreSQL Database

### 1.1 Create a Neon Project

1. Go to https://console.neon.tech
2. Sign in or create a new account
3. Click "Create a new project"
4. Choose your region (select closest to your users)
5. Create a database named `justdoo` or similar
6. Note the connection string in the format:
   ```
   postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```

### 1.2 Get Your Connection String

1. In Neon console, go to your project
2. Click on "Connection string" tab
3. Select "Pooled connection" (recommended for serverless)
4. Copy the full connection string
5. Keep this safe - you'll need it for Railway

## Step 2: Deploy to Railway.com

### 2.1 Connect Your Repository

1. Go to https://railway.app
2. Sign in or create a new account
3. Click "New Project"
4. Select "Deploy from GitHub"
5. Authorize Railway to access your GitHub account
6. Select the repository containing JustDoo
7. Select the branch to deploy (usually `main`)

### 2.2 Configure Environment Variables

1. In Railway dashboard, go to your project
2. Click "Variables" tab
3. Add the following environment variables:

**Critical Variables:**
- `DATABASE_URL`: Your Neon connection string from Step 1.2
- `NODE_ENV`: Set to `production`

**OAuth Variables (from Manus):**
- `VITE_APP_ID`: Your Manus OAuth application ID
- `OAUTH_SERVER_URL`: Manus OAuth server URL
- `VITE_OAUTH_PORTAL_URL`: Manus OAuth portal URL
- `JWT_SECRET`: Generate a strong random string (use `openssl rand -base64 32`)
- `OWNER_OPEN_ID`: Your Manus user ID
- `OWNER_NAME`: Your name
- `BUILT_IN_FORGE_API_KEY`: Your Manus API key
- `BUILT_IN_FORGE_API_URL`: Manus API URL
- `VITE_FRONTEND_FORGE_API_KEY`: Frontend Manus API key
- `VITE_FRONTEND_FORGE_API_URL`: Frontend Manus API URL
- `VITE_ANALYTICS_ENDPOINT`: Analytics endpoint (optional)
- `VITE_ANALYTICS_WEBSITE_ID`: Analytics ID (optional)

### 2.3 Configure Build Settings

1. In Railway dashboard, go to "Settings"
2. Set the following:
   - **Start Command**: `pnpm start`
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`

### 2.4 Deploy

1. Railway will automatically detect the `railway.toml` file
2. Click "Deploy" to start the deployment
3. Monitor the deployment logs
4. Once deployed, you'll get a Railway domain (e.g., `justdoo-production.up.railway.app`)

## Step 3: Database Migration on Railway

After deployment, you need to run the database migration:

1. In Railway dashboard, go to "Deployments"
2. Click on the latest deployment
3. Go to "Logs" tab
4. The application should have already created tables on first run
5. If needed, you can manually run migrations through the Railway CLI:
   ```bash
   railway run pnpm db:push
   ```

## Step 4: Configure Custom Domain (Optional)

1. In Railway dashboard, go to "Settings"
2. Click "Domains"
3. Add your custom domain (e.g., `justdoo.hu`)
4. Follow Railway's DNS configuration instructions
5. Update your domain registrar DNS settings

## Step 5: Verify Deployment

1. Visit your Railway domain or custom domain
2. You should see the JustDoo landing page
3. Click "Get Started" to test the login flow
4. Create a test project and task to verify everything works

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Verify `DATABASE_URL` is correct in Railway variables
2. Ensure Neon database is running
3. Check that the connection string includes `?sslmode=require`
4. In Railway logs, look for specific error messages

### Build Failures

If the build fails:

1. Check Railway build logs for specific errors
2. Ensure all dependencies are listed in `package.json`
3. Verify Node.js version compatibility (should be 18+)
4. Try running `pnpm install && pnpm build` locally to debug

### OAuth Issues

If login doesn't work:

1. Verify all OAuth environment variables are set correctly
2. Check that `VITE_OAUTH_PORTAL_URL` is accessible
3. Ensure your Railway domain is whitelisted in Manus OAuth settings

### Performance Issues

If the app is slow:

1. Use Neon's "Pooled connection" instead of direct connection
2. Consider upgrading Railway compute resources
3. Check Railway metrics for CPU/memory usage
4. Monitor database query performance in Neon console

## Monitoring and Maintenance

### View Logs

1. In Railway dashboard, click "Logs" tab
2. Filter by date/time to find specific issues
3. Search for error keywords

### Monitor Database

1. In Neon console, go to your project
2. Check "Monitoring" tab for query performance
3. Review slow queries and optimize if needed

### Update Application

To deploy new changes:

1. Push changes to GitHub
2. Railway will automatically detect and redeploy
3. Monitor deployment progress in Railway dashboard

## Cost Considerations

**Neon.tech:**
- Free tier includes 3 projects with reasonable usage limits
- Paid plans start at $14/month for production databases

**Railway.com:**
- Free tier includes $5/month credit
- Paid plans start at $5/month for additional resources
- Generous free tier for hobby projects

**Manus (if using):**
- Check your subscription plan for API rate limits
- Monitor usage to avoid unexpected charges

## Security Best Practices

1. **Never commit `.env` files** - use Railway's variable management
2. **Rotate secrets regularly** - especially `JWT_SECRET`
3. **Use strong passwords** - for Neon and Railway accounts
4. **Enable 2FA** - on both Neon and Railway accounts
5. **Monitor access logs** - regularly check Railway and Neon logs
6. **Keep dependencies updated** - run `pnpm update` periodically

## Backup Strategy

1. **Database backups** - Neon provides automatic backups (check your plan)
2. **Code backups** - GitHub serves as your code backup
3. **Manual backups** - Periodically export data from Neon

## Support

- **Railway Support**: https://railway.app/support
- **Neon Support**: https://neon.tech/docs
- **Manus Support**: Check your Manus dashboard

## Next Steps

After deployment:

1. Invite team members to use JustDoo
2. Configure custom branding if needed
3. Set up monitoring and alerts
4. Plan regular maintenance windows
5. Gather user feedback for improvements
