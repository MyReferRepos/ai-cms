# AI CMS - Deployment Guide

Complete guide for deploying AI CMS to Vercel with Supabase PostgreSQL database.

## Prerequisites

1. **GitHub Account** - Your code repository
2. **Supabase Account** - [supabase.com](https://supabase.com)
3. **Vercel Account** - [vercel.com](https://vercel.com)

## Step 1: Set Up Supabase Database

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the project details:
   - **Name**: ai-cms (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for the project to be set up (takes ~2 minutes)

### 1.2 Get Database Connection Strings

1. In your Supabase project, go to **Settings** > **Database**
2. Scroll down to **Connection string** section
3. Copy the following connection strings:

   **Connection pooling** (for DATABASE_URL):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```

   **Direct connection** (for DIRECT_URL):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

4. Replace `[YOUR-PASSWORD]` with your database password
5. Save these connection strings for later

### 1.3 Enable Connection Pooling

1. In Supabase, go to **Database** > **Connection Pooling**
2. Make sure **Transaction Mode** is enabled
3. Port should be **5432**

## Step 2: Deploy to Vercel

### 2.1 Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New"** > **"Project"**
3. Import your GitHub repository:
   - Click **"Import Git Repository"**
   - Select your `ai-cms` repository
   - Click **"Import"**

### 2.2 Configure Environment Variables

Before deploying, add these environment variables in Vercel:

1. In the project import screen, expand **"Environment Variables"**
2. Add the following variables:

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-random-secret-key-here

# App
APP_NAME=AI CMS
APP_URL=https://your-domain.vercel.app
```

**Important Notes:**
- Replace database connection strings with your Supabase credentials
- Generate a secure `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- `NEXTAUTH_URL` will be your Vercel domain (you can update it later)

### 2.3 Configure Build Settings

Vercel should auto-detect Next.js settings, but verify:

- **Framework Preset**: Next.js
- **Build Command**: `prisma generate && next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (~2-3 minutes)
3. Your site will be live at `https://[project-name].vercel.app`

## Step 3: Run Database Migrations

After the first deployment, you need to initialize the database:

### 3.1 Using Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link your project:
   ```bash
   vercel link
   ```

4. Pull environment variables:
   ```bash
   vercel env pull .env.local
   ```

5. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### 3.2 Alternative: Using Prisma Studio Online

1. Go to your project directory
2. Create a `.env` file with your Supabase connection strings
3. Run migrations locally:
   ```bash
   npx prisma migrate dev --name init
   ```

## Step 4: Seed the Database

After migrations, seed your database with initial data:

1. Visit your deployed site: `https://[your-domain].vercel.app/api/seed`
2. This creates demo users:
   - **Admin**: admin@example.com / admin123
   - **Editor**: editor@example.com / editor123
   - **Author**: author@example.com / author123

## Step 5: Configure Automatic Deployments

Vercel automatically deploys on every push to your main branch. To customize:

### 5.1 Branch Deployments

Vercel creates preview deployments for every branch:
- **Production**: `main` or `master` branch
- **Preview**: All other branches

### 5.2 Deployment Protection

1. Go to your project in Vercel
2. Navigate to **Settings** > **Deployment Protection**
3. Configure as needed:
   - Enable password protection for preview deployments
   - Add team members with access

### 5.3 Environment-Specific Variables

For different environments:

1. Go to **Settings** > **Environment Variables**
2. Set variables for specific environments:
   - **Production**: Live site
   - **Preview**: Preview deployments
   - **Development**: Local development

## Step 6: Set Up Custom Domain (Optional)

1. In Vercel, go to **Settings** > **Domains**
2. Add your custom domain
3. Follow the DNS configuration instructions
4. Update `NEXTAUTH_URL` and `APP_URL` environment variables to your custom domain
5. Redeploy the project

## Automatic Deployment Workflow

Once set up, your deployment workflow will be:

1. **Push to GitHub**: Commit and push changes to your repository
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Automatic Build**: Vercel automatically detects the push and starts building

3. **Automatic Deploy**: After successful build, changes go live automatically

4. **Preview Deployments**: Feature branches get preview URLs for testing

## Monitoring and Logs

### View Deployment Logs

1. Go to your project in Vercel
2. Click on **Deployments**
3. Click on any deployment to view logs

### Monitor Performance

1. Go to **Analytics** tab in Vercel
2. View:
   - Page views
   - Performance metrics
   - Error tracking

## Troubleshooting

### Build Fails

**Error: Prisma Client not generated**
- Solution: Ensure `prisma generate` runs before build
- Check build command includes: `prisma generate && next build`

**Error: Cannot connect to database**
- Verify `DATABASE_URL` and `DIRECT_URL` are correct
- Check Supabase database is active
- Ensure connection pooling is enabled

### Database Issues

**Error: Migration failed**
- Use `DIRECT_URL` for migrations (not pooled connection)
- Check database permissions in Supabase

**Error: Cannot seed database**
- Visit `/api/seed` endpoint after deployment
- Check Vercel function logs for errors

### Authentication Issues

**Error: Invalid callback URL**
- Update `NEXTAUTH_URL` to match your Vercel domain
- Redeploy after updating environment variables

## Updating the Application

### To deploy updates:

1. Make changes locally
2. Test locally:
   ```bash
   npm run dev
   ```
3. Commit changes:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```
4. Push to GitHub:
   ```bash
   git push origin main
   ```
5. Vercel automatically builds and deploys

### Database Schema Changes

When updating the Prisma schema:

1. Create migration:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```
2. Commit migration files
3. Push to GitHub
4. Vercel will run migrations automatically

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **Secrets**: Use strong, random values for `NEXTAUTH_SECRET`
3. **Database**: Change default admin password after first login
4. **Supabase**: Enable Row Level Security (RLS) policies
5. **Vercel**: Enable deployment protection for sensitive projects

## Cost Considerations

### Supabase Free Tier
- 500 MB database space
- 2 GB bandwidth
- Unlimited API requests
- Perfect for starting out

### Vercel Free Tier
- Unlimited deployments
- 100 GB bandwidth/month
- Serverless function execution
- HTTPS included

Both platforms have generous free tiers suitable for most projects.

## Next Steps

1. ✅ Customize your CMS content
2. ✅ Update branding (logo, colors, name)
3. ✅ Configure custom domain
4. ✅ Set up analytics
5. ✅ Create your first posts
6. ✅ Invite team members

## Support

For issues:
- Check Vercel deployment logs
- Review Supabase database logs
- Consult [Next.js docs](https://nextjs.org/docs)
- Review [Prisma docs](https://www.prisma.io/docs)

---

**Congratulations!** Your AI CMS is now deployed and automatically updates with every GitHub push! 🎉
