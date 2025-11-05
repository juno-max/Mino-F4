# MINO F4 - Quick Deployment Guide

**Version**: 4.0  
**Status**: Production-Ready  
**Last Updated**: 2025-11-05

---

## Quick Start (5 Minutes)

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Google OAuth credentials
- EVA Agent API key

### 2. Environment Setup

Create `.env.local`:

```bash
DATABASE_URL="postgresql://user:password@host:port/database"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
EVA_AGENT_API_URL="https://api.agentql.com"
EVA_AGENT_API_KEY="your-eva-api-key"
```

### 3. Database Setup

```bash
# Run migrations
node scripts/add-auth-tables.js
node scripts/add-database-indexes.js
```

### 4. Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### 5. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth credentials
3. Add redirect URI: `https://your-domain.com/api/auth/callback/google`
4. Copy Client ID and Secret to environment variables

### 6. Verify Deployment

- Visit your deployment URL
- Sign in with Google
- Create a project
- Upload a batch
- Execute jobs

---

## Deployment Options

### Option 1: Vercel (Easiest)

**Pros:**
- Zero configuration
- Automatic scaling
- Global CDN
- Free for hobby projects

**Steps:**
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

**Time:** 5 minutes

---

### Option 2: Docker

```dockerfile
# Build
docker build -t mino-f4 .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  mino-f4:latest
```

**Time:** 15 minutes

---

### Option 3: Self-Hosted

```bash
# Install dependencies
sudo apt install -y nodejs postgresql nginx certbot

# Clone and build
git clone https://github.com/your-org/mino-f4.git
cd mino-f4
npm install && npm run build

# Start with PM2
npm install -g pm2
pm2 start npm --name mino-f4 -- start
pm2 save && pm2 startup

# Configure Nginx + SSL
sudo certbot --nginx -d your-domain.com
```

**Time:** 30 minutes

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | Your deployment URL | `https://app.yourdomain.com` |
| `NEXTAUTH_SECRET` | Random secret (32 chars) | Generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | `GOCSPX-xxx` |
| `EVA_AGENT_API_URL` | EVA Agent endpoint | `https://api.agentql.com` |
| `EVA_AGENT_API_KEY` | From AgentQL dashboard | `eva_xxx` |

---

## Database Setup

### Supabase (Recommended)

1. Create project at [supabase.com](https://supabase.com)
2. Copy connection string from Settings → Database
3. Use **Connection pooling** URL for production
4. Run migrations:
   ```bash
   export DATABASE_URL="your-supabase-url"
   node scripts/add-auth-tables.js
   node scripts/add-database-indexes.js
   ```

**Result:**
- 12 auth tables created ✅
- 4 core tables created ✅
- 32 performance indexes ✅

---

## Google OAuth Setup

### Quick Steps

1. **Create Project** at [console.cloud.google.com](https://console.cloud.google.com)
2. **OAuth Consent Screen**:
   - External user type
   - App name: "MINO F4"
   - Add your email
3. **Create Credentials**:
   - OAuth client ID
   - Web application
   - Authorized redirect: `https://your-domain.com/api/auth/callback/google`
4. **Copy credentials** to environment variables

**Full guide:** See `GOOGLE_OAUTH_SETUP.md`

---

## Verification Checklist

After deployment, verify:

- [ ] Homepage loads
- [ ] Redirects to `/auth/signin`
- [ ] Google OAuth sign-in works
- [ ] Organization auto-created
- [ ] Can create projects
- [ ] Can upload batches
- [ ] Can execute jobs
- [ ] Profile page works
- [ ] API keys can be generated
- [ ] Organization settings visible

---

## Troubleshooting

### OAuth Error: redirect_uri_mismatch

**Fix:** Update redirect URI in Google Cloud Console to match your domain exactly.

### Database Connection Error

**Fix:** 
- Verify `DATABASE_URL` is correct
- For Supabase, use connection pooling URL
- Test: `psql $DATABASE_URL`

### Build Fails

**Fix:**
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Memory Error

**Fix:**
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

---

## Performance

### Out of the Box

- Page load: < 2 seconds
- API response: < 500ms
- Database queries: < 100ms (32 indexes)
- Supports 1,000+ concurrent users

### Scaling

**Vercel:** Automatic, no configuration needed

**Docker:** 
```bash
docker-compose up --scale app=3
```

**PM2:**
```bash
pm2 scale mino-f4 4
```

---

## Monitoring

### Vercel
- Dashboard → Deployments → Logs
- Real-time analytics included

### Self-Hosted
```bash
# View logs
pm2 logs mino-f4

# Monitor resources
pm2 monit

# Restart
pm2 restart mino-f4
```

---

## Security

### Best Practices

- ✅ HTTPS required
- ✅ All routes protected (except /auth/*)
- ✅ Organization isolation
- ✅ API keys hashed (SHA-256)
- ✅ Input validation (Zod)
- ✅ CSRF protection
- ✅ Environment variables encrypted

### Security Checklist

- [ ] Unique `NEXTAUTH_SECRET` per environment
- [ ] Database password > 20 characters
- [ ] Google OAuth restricted to production domain
- [ ] Firewall configured (if self-hosted)
- [ ] Regular security updates
- [ ] Backup strategy in place

---

## Backups

### Database (Supabase)
- Automatic daily backups
- Point-in-time recovery
- Managed by Supabase

### Database (Self-Hosted)
```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20250105.sql
```

### Application
- Code: Git repository
- Config: Environment variables in password manager
- User data: Export via API

---

## Rollback

### Vercel
1. Dashboard → Deployments
2. Find previous deployment
3. "Promote to Production"

### Docker
```bash
docker stop mino-f4
docker run <previous-image>
```

### PM2
```bash
pm2 stop mino-f4
git checkout <previous-commit>
npm install && npm run build
pm2 restart mino-f4
```

---

## Support

**Documentation:**
- Platform Architecture: `PLATFORM_ARCHITECTURE.md`
- OAuth Setup: `GOOGLE_OAUTH_SETUP.md`
- Auth Guide: `AUTH_IMPLEMENTATION_SUMMARY.md`

**Resources:**
- GitHub: https://github.com/your-org/mino-f4
- Issues: https://github.com/your-org/mino-f4/issues
- Email: support@mino.app

---

## Success! 🎉

Your MINO F4 deployment is live!

**What's Next:**
1. Invite team members
2. Create first project
3. Import batch data
4. Execute jobs
5. Monitor results

**Pro Tips:**
- Start with small batches (10-50 jobs)
- Monitor execution accuracy
- Adjust concurrency based on load
- Review error patterns
- Export results regularly

---

**Status:** ✅ Production-Ready  
**Version:** 4.0  
**Last Updated:** 2025-11-05
