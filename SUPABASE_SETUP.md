# Supabase Setup Guide - 5 Minutes

## Step 1: Create Supabase Account (2 min)

1. Go to **https://supabase.com**
2. Click "Start your project"
3. Sign up with GitHub (easiest) or email
4. Verify your email if needed

## Step 2: Create New Project (1 min)

1. Click **"New Project"**
2. Fill in:
   - **Name:** `mino-mvp` (or any name)
   - **Database Password:** Generate a strong password (save this!)
   - **Region:** Choose closest to you (e.g., `US West`)
   - **Pricing Plan:** Free (good for MVP)
3. Click **"Create new project"**
4. Wait ~2 minutes for database to provision (green checkmark when ready)

## Step 3: Get Connection Details (1 min)

1. In your Supabase project, go to **Settings** (gear icon in sidebar)
2. Click **"API"** in the left menu

### Copy These Values:

**API URL:**
```
Project URL: https://xxxxxxxxxxxxx.supabase.co
```

**API Keys:**
```
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Click **"Database"** in the left menu
4. Scroll to **"Connection string"** section
5. Select **"URI"** tab
6. Copy the connection string (looks like):
```
postgresql://postgres.[ref]:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

**Important:** Replace `[password]` with the password you created in Step 2!

## Step 4: Update .env.local (30 sec)

Open `.env.local` in your project and update:

```bash
# Replace with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Direct database connection (replace [password] with your password!)
DATABASE_URL=postgresql://postgres.[ref]:[YOUR_PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

## Step 5: Push Database Schema (30 sec)

In your terminal:

```bash
npm run db:push
```

You should see:
```
✓ Pushing schema changes to database
✓ Schema pushed successfully
```

## Step 6: Verify Tables Created (30 sec)

Back in Supabase:
1. Click **"Table Editor"** in sidebar
2. You should see these tables:
   - `projects`
   - `batches`
   - `executions`
   - `execution_results`
   - `accuracy_metrics`
   - `instruction_versions`
   - `failure_patterns`

✅ **You're done!** Database is ready.

## Step 7: Test the Application

1. Visit http://localhost:3000/projects
2. Click "New Project"
3. Create a test project:
   - Name: "Test Pricing Workflow"
   - Instructions: "Extract monthly and annual pricing from /pricing page"
4. Click "Create Project"

If you see the project created successfully, **everything is working!** 🎉

## Troubleshooting

### Error: "Cannot connect to database"
- Check your `DATABASE_URL` has the correct password
- Make sure you replaced `[password]` with actual password
- Verify database is green/active in Supabase dashboard

### Error: "Authentication failed"
- Double-check you copied the full connection string
- Password may contain special characters - wrap in quotes if needed

### Tables not appearing
- Run `npm run db:push` again
- Check Supabase dashboard > Database > Logs for errors

## Useful Supabase Features

### View Data
- **Table Editor:** Visual interface to view/edit data
- **SQL Editor:** Run custom queries

### Monitor Database
- **Database** > **Logs:** See query logs
- **Database** > **Extensions:** Add PostgreSQL extensions

### Backup
Supabase automatically backs up your database daily on free tier.

## Next Steps

Once database is set up:
1. ✅ Create a test project
2. ✅ Build CSV upload page
3. ✅ Implement mock testing
4. ✅ Deploy to Vercel

---

**Need Help?** Check Supabase docs: https://supabase.com/docs
