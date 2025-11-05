# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth authentication for MINO.

## Prerequisites

- Google Cloud account (free)
- Access to Google Cloud Console

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: "MINO Authentication"
5. Click "Create"

---

## Step 2: Configure OAuth Consent Screen

1. In Google Cloud Console, navigate to **APIs & Services > OAuth consent screen**
2. Select **External** user type (unless you have a Google Workspace)
3. Click "Create"

### Configure the consent screen:

**App information:**
- App name: `MINO`
- User support email: Your email
- App logo: (optional)

**App domain:**
- Application home page: `http://localhost:3000` (for development)
- Privacy policy: `http://localhost:3000/privacy` (optional for dev)
- Terms of service: `http://localhost:3000/terms` (optional for dev)

**Authorized domains:**
- For development: Leave empty or add `localhost`
- For production: Add your domain (e.g., `mino.app`)

**Developer contact information:**
- Add your email address

4. Click "Save and Continue"
5. Skip the Scopes step (default scopes are sufficient)
6. Skip the Test users step for now (or add your email to test)
7. Click "Back to Dashboard"

---

## Step 3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services > Credentials**
2. Click **"+ Create Credentials"** at the top
3. Select **"OAuth client ID"**

### Configure OAuth client:

**Application type:** Select "Web application"

**Name:** `MINO Web Client`

**Authorized JavaScript origins:**
- For development:
  - `http://localhost:3000`
- For production:
  - `https://your-domain.com`

**Authorized redirect URIs:**
- For development:
  - `http://localhost:3000/api/auth/callback/google`
- For production:
  - `https://your-domain.com/api/auth/callback/google`

4. Click **"Create"**

---

## Step 4: Copy Credentials

After creating, you'll see a popup with your credentials:

- **Client ID**: Something like `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret**: Something like `GOCSPX-abc123def456`

**⚠️ IMPORTANT:** Keep these credentials secret! Never commit them to Git.

---

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in your credentials:

   ```bash
   # Database
   DATABASE_URL="postgresql://your-db-url"

   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32

   # Google OAuth
   GOOGLE_CLIENT_ID="123456789-abcdefg.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-abc123def456"
   ```

3. Generate a secure `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

---

## Step 6: Run Database Migration

The authentication tables have been created by the setup script, but verify they exist:

```bash
node scripts/add-auth-tables.js
```

You should see:
```
✅ users
✅ accounts
✅ auth_sessions
✅ verification_tokens
✅ organizations
✅ organization_members
... etc
```

---

## Step 7: Start the Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000` and you should be redirected to the sign-in page.

---

## Step 8: Test Authentication

1. Click "Continue with Google"
2. Sign in with your Google account
3. Authorize the application
4. You should be redirected back to the app and logged in
5. An organization will be automatically created for you

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem:** The redirect URI in your request doesn't match what's configured in Google Cloud Console.

**Solution:**
1. Go to Google Cloud Console > Credentials
2. Edit your OAuth client
3. Make sure the redirect URI exactly matches: `http://localhost:3000/api/auth/callback/google`
4. No trailing slashes!

### Error: "Access blocked: This app's request is invalid"

**Problem:** The OAuth consent screen is not properly configured.

**Solution:**
1. Complete all required fields in the OAuth consent screen
2. Make sure your email is listed as a test user (for development)
3. Verify the authorized domains are correct

### Error: "Invalid client"

**Problem:** The client ID or secret is incorrect.

**Solution:**
1. Double-check your `.env.local` file
2. Make sure there are no extra spaces or quotes
3. Verify the credentials in Google Cloud Console

### Database connection error

**Problem:** Can't connect to the database.

**Solution:**
1. Verify `DATABASE_URL` in `.env.local` is correct
2. Test the connection: `node scripts/add-auth-tables.js`
3. Make sure the database is running

---

## Production Deployment

When deploying to production:

1. **Update OAuth redirect URIs** in Google Cloud Console:
   - Add production domain: `https://your-domain.com`
   - Add callback: `https://your-domain.com/api/auth/callback/google`

2. **Update environment variables** on your hosting platform:
   - `NEXTAUTH_URL`: Your production URL
   - `NEXTAUTH_SECRET`: Generate a new secret for production
   - `GOOGLE_CLIENT_ID`: Same as development (or create new credentials)
   - `GOOGLE_CLIENT_SECRET`: Same as development (or create new credentials)

3. **Verify OAuth consent screen**:
   - Update app domain to production domain
   - Consider publishing the app (requires verification for 100+ users)

4. **SSL/HTTPS**: Required for production OAuth

---

## Security Best Practices

1. **Never commit `.env.local`** to Git (it's in `.gitignore`)
2. **Rotate secrets periodically** (every 90 days)
3. **Use different credentials** for development and production
4. **Enable 2FA** on your Google Cloud account
5. **Monitor OAuth usage** in Google Cloud Console
6. **Revoke unused credentials** when no longer needed

---

## Multi-Tenancy Features

The authentication system includes built-in multi-tenancy:

- **Organizations**: Each user automatically gets an organization
- **Roles**: owner, admin, member, viewer
- **Permissions**: Granular control over actions
- **API Keys**: Generate keys for programmatic access

### Organization Roles:

- **Owner**: Full control (created automatically for first user)
- **Admin**: Manage members, projects, and jobs
- **Member**: Create projects and execute jobs
- **Viewer**: Read-only access

---

## Next Steps

After authentication is working:

1. Invite team members to your organization
2. Set up role-based access control
3. Generate API keys for automation
4. Configure organization settings

---

## Support

If you encounter issues:

1. Check the [NextAuth.js documentation](https://next-auth.js.org)
2. Review [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2)
3. Check browser console for errors
4. Review server logs: `npm run dev` output

---

## References

- [NextAuth.js Docs](https://next-auth.js.org/getting-started/introduction)
- [Google OAuth Setup](https://next-auth.js.org/providers/google)
- [Google Cloud Console](https://console.cloud.google.com)
- [Drizzle ORM Docs](https://orm.drizzle.team)
