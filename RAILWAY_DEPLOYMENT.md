# Railway.com Deployment Guide

## Quick Start

### Step 1: Connect GitHub Repository

1. Go to https://railway.app
2. Log in to your Railway account
3. Click **"New Project"**
4. Select **"Deploy from GitHub"**
5. Authorize Railway to access your GitHub account
6. Select the repository: `kovacssandormanus-tech/justdoo-app`
7. Select the `main` branch

### Step 2: Configure Environment Variables

1. In the Railway dashboard, click on your project
2. Go to the **"Variables"** tab
3. Add the following environment variable:

```
DATABASE_URL=postgresql://neondb_owner:npg_ufK6vxRNTE3M@ep-empty-dawn-alfcbq62-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

4. Make sure `NODE_ENV` is set to `production`

### Step 3: Deploy

1. Railway will automatically detect the `railway.toml` file
2. Click the **"Deploy"** button
3. Monitor the deployment progress in the logs
4. Once deployed, you'll get a Railway domain (e.g., `justdoo-app.up.railway.app`)

### Step 4: Run Database Migrations

1. Once the application is deployed, the database tables will be created automatically on first run
2. If needed, you can manually run migrations through Railway's CLI

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Verify the `DATABASE_URL` is correct in Railway variables
2. Ensure the Neon database is running
3. Check that the connection string includes `?sslmode=require`

### Build Failures

If the build fails:

1. Check Railway build logs for specific errors
2. Ensure all dependencies are listed in `package.json`
3. Verify Node.js version compatibility (should be 18+)

### Application Not Starting

If the app doesn't start:

1. Check the Railway logs for error messages
2. Verify all environment variables are set correctly
3. Ensure the database connection is working

## Monitoring

- View logs: Go to the project → **"Logs"** tab
- Monitor metrics: Go to the project → **"Metrics"** tab
- Check deployments: Go to the project → **"Deployments"** tab

## Your Application Details

- **GitHub Repository**: https://github.com/kovacssandormanus-tech/justdoo-app
- **Neon Database**: neondb
- **Database Region**: EU Central 1 (Frankfurt)
- **Build Command**: `pnpm build`
- **Start Command**: `pnpm start`

