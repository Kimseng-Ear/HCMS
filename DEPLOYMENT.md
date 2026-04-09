# Render Deployment Guide

## Quick Deploy Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Create Render Services

#### Option A: Manual Setup (Recommended)
1. **Create PostgreSQL Database:**
   - Dashboard → New → PostgreSQL
   - Name: `hr-db`
   - Plan: Free
   - Database Name: `iroc_hr`

2. **Create Web Service:**
   - Dashboard → New → Web Service
   - Connect GitHub repo
   - Name: `hr-system`
   - Runtime: Node
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Health Check Path: `/api/health`

3. **Add Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=<from-database-settings>
   DB_USER=<from-database-settings>
   DB_PASSWORD=<from-database-settings>
   DB_NAME=<from-database-settings>
   JWT_SECRET=<generate-random-key>
   CORS_ORIGIN=https://your-app-name.onrender.com
   ```

#### Option B: Auto Deploy with render.yaml
1. Push `render.yaml` to repo
2. Connect repo to Render
3. Render will auto-create services

### 3. Fix Build Issues (Current Status)

The project has TypeScript errors that need fixing before successful deployment:

**Critical Issues:**
- UserOverrideManager.tsx: Property name mismatches
- PermissionTemplates.tsx: Missing state variables
- FormFields.tsx: Missing required labels

**Quick Fix Options:**
1. **Fix TypeScript errors** (Recommended)
2. **Disable TypeScript checking** (Quick but not recommended)

### 4. Deployment Commands

After fixing build issues:

```bash
# Test build locally
npm run build

# Deploy to Render
git push origin main
```

### 5. Access Your App

Once deployed:
- App URL: `https://your-app-name.onrender.com`
- API Health: `https://your-app-name.onrender.com/api/health`
- Login: Admin (012345678 / password123)

### 6. Troubleshooting

**Build Fails:**
- Check Render logs for specific errors
- Ensure `npm run build` works locally
- Verify all dependencies are installed

**Database Issues:**
- Check database connection strings
- Verify environment variables match
- Run database migrations if needed

**CORS Issues:**
- Update CORS_ORIGIN environment variable
- Check browser console for CORS errors

### 7. Post-Deployment

1. **Test all features**
2. **Check database connectivity**
3. **Verify user authentication**
4. **Test API endpoints**
5. **Monitor performance**

## Environment Variables Template

```bash
# Production
NODE_ENV=production
PORT=3000

# Database (from Render PostgreSQL)
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=iroc_hr

# Security
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://your-app-name.onrender.com
```

## Next Steps

1. Fix TypeScript build errors
2. Test build locally
3. Push to GitHub
4. Deploy to Render
5. Test deployed application
