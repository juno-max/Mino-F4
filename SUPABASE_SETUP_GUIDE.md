# Supabase Setup Guide - Step by Step

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub (or email)
4. Click "New Project"
5. Fill in:
   - **Name**: `mino-production` (or any name you want)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine to start
6. Click "Create new project"
7. Wait 2-3 minutes for setup to complete

## Step 2: Get Your Connection String

1. In your Supabase dashboard, click **Settings** (gear icon in sidebar)
2. Click **Database** from the left menu
3. Scroll down to **Connection string** section
4. Select **Connection pooling** tab
5. Copy the **Connection string** (it looks like):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   ```
6. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with the password you created in Step 1

## Step 3: Get Your API Keys

1. Still in **Settings**, click **API** from the left menu
2. You'll see:
   - **Project URL**: Copy this
   - **anon public**: Copy this key
   - **service_role**: Copy this key (click reveal first)

## Step 4: I'll Help You Update .env.local

Once you have all the values above, provide them to me and I'll update your `.env.local` file. Or you can do it manually.

You need:
- [ ] Project URL (https://xxxxx.supabase.co)
- [ ] Anon public key (starts with eyJ...)
- [ ] Service role key (starts with eyJ...)
- [ ] Connection string (postgresql://...)

---

## Ready to Continue?

Once you have these 4 values, let me know and I'll:
1. Update your `.env.local` with the correct values
2. Run `npm run db:push` to create all the tables
3. Verify the connection works
4. Test the full integration

**Note**: All these keys are safe to share with me - they'll only be stored in your local `.env.local` file which is in `.gitignore`.
