b # Deployment Guide for Roll The Dice (Supabase + Vercel)

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier available)
- Vercel account (free tier available)
- GitHub repository (recommended)

## Step 1: Supabase Database Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `roll-the-dice` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project to be created (2-3 minutes)

### 1.2 Get Database Connection String
1. In your Supabase dashboard, go to **Settings** → **Database**
2. Find the **Connection string** section
3. Copy the **URI** connection string
4. It will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### 1.3 Test Database Connection
```bash
cd web
# Update your .env.local with Supabase connection
echo 'DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"' > .env.local
echo 'NODE_ENV="development"' >> .env.local

# Test the connection
npm run db:generate:prod
npm run db:push
```

## Step 2: Environment Variables

### 2.1 Local Development
Create `.env.local` in the `web` directory:
```bash
# Supabase Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Environment
NODE_ENV="development"
```

### 2.2 Vercel Production
You'll add these in the Vercel dashboard (see Step 4)

## Step 3: Database Migration (Production)

```bash
cd web

# Generate Prisma client for production
npm run db:generate:prod

# Create migration files
npm run db:migrate:prod:create

# Deploy migrations to Supabase
npm run db:deploy:prod

# Optional: Seed initial data
npm run db:seed
```

## Step 4: Deploy to Vercel

### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to web directory
cd web

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? → Yes
# - Which scope? → Select your account
# - Link to existing project? → No
# - Project name? → roll-the-dice (or your preferred name)
# - Directory? → ./ (current directory)
# - Override settings? → No
```

### Option B: Vercel Dashboard
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project"
4. Import your GitHub repository
5. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web` (if your repo has the web folder)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. Click "Deploy"

## Step 5: Configure Vercel Environment Variables

### 5.1 In Vercel Dashboard
1. Go to your project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

```
Name: DATABASE_URL
Value: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
Environment: Production, Preview, Development

Name: NODE_ENV
Value: production
Environment: Production, Preview, Development
```

### 5.2 Redeploy After Adding Variables
```bash
# Trigger a new deployment
vercel --prod
```

## Step 6: Post-Deployment Setup

### 6.1 Run Database Migrations
```bash
cd web
npm run db:deploy:prod
```

### 6.2 Verify Deployment
1. Check your Vercel deployment URL
2. Test the main game functionality
3. Verify API endpoints are working
4. Check database connections

## Step 7: Supabase Security & Settings

### 7.1 Row Level Security (Optional)
In Supabase dashboard:
1. Go to **Authentication** → **Policies**
2. Enable RLS on your tables if needed
3. Create policies for your use case

### 7.2 API Keys (Optional)
If you want to use Supabase client features later:
1. Go to **Settings** → **API**
2. Copy your `anon` and `service_role` keys
3. Add to Vercel environment variables if needed

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify your `DATABASE_URL` format
   - Check if Supabase project is active
   - Ensure password is correct
   - Check if IP restrictions are enabled

2. **Build Errors in Vercel**
   - Verify all dependencies are in `package.json`
   - Check Node.js version compatibility
   - Ensure environment variables are set

3. **API Routes Not Working**
   - Check Vercel function logs
   - Verify API route file structure
   - Check environment variables in Vercel

### Supabase-Specific Issues

1. **Connection Timeout**
   - Check Supabase project status
   - Verify region selection
   - Check if project is paused (free tier)

2. **Migration Failures**
   - Ensure you're using the production schema
   - Check Prisma client generation
   - Verify database permissions

## Performance & Monitoring

### Vercel Analytics
- Built-in performance monitoring
- Function execution logs
- Edge network optimization

### Supabase Monitoring
- Database performance metrics
- Connection pool status
- Query performance insights

## Security Notes

- Rate limiting is enabled by default
- Input validation with Zod schemas
- SQL injection protection via Prisma
- No sensitive data exposed to client
- Supabase provides additional security layers

## Cost Optimization

### Vercel
- Free tier: 100GB bandwidth/month
- Hobby plan: $20/month for more features

### Supabase
- Free tier: 500MB database, 2GB bandwidth
- Pro plan: $25/month for production use

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

## Quick Deploy Commands

```bash
# Complete deployment workflow
cd web
npm run db:generate:prod
npm run db:migrate:prod:create
npm run db:deploy:prod
vercel --prod
```

Your Roll The Dice app is now optimized for Supabase + Vercel deployment! 🎲✨ 