# BrandTide Production Deployment Checklist

## 📋 Pre-Deployment

### Backend Preparation

- [ ] **Environment Variables**
  - [ ] Set `NODE_ENV=production`
  - [ ] Use strong `JWT_SECRET` (64+ characters)
  - [ ] Configure production MongoDB URI (MongoDB Atlas)
  - [ ] Set correct `CLIENT_URL` (frontend domain)
  - [ ] Add Google OAuth production callback URLs
  - [ ] Configure rate limiting for production load

- [ ] **Database**
  - [ ] Create MongoDB Atlas account
  - [ ] Set up cluster and database
  - [ ] Whitelist application server IP
  - [ ] Create database user with strong password
  - [ ] Test connection from local machine
  - [ ] Run seed script in production database (optional)

- [ ] **Security Audit**
  - [ ] Review CORS settings
  - [ ] Enable HTTPS only
  - [ ] Check rate limits are appropriate
  - [ ] Verify input validation on all endpoints
  - [ ] Review error messages (no sensitive data exposure)
  - [ ] Check JWT expiration time
  - [ ] Enable secure cookie flags

- [ ] **Code Quality**
  - [ ] Run linting
  - [ ] Remove console.logs
  - [ ] Remove unused dependencies
  - [ ] Check for hardcoded credentials
  - [ ] Update package.json versions

### Frontend Preparation

- [ ] **Environment Variables**
  - [ ] Set `VITE_API_URL` to production backend URL
  - [ ] Remove development-only features
  - [ ] Check Google OAuth client ID (if different)

- [ ] **Build Optimization**
  - [ ] Run production build: `npm run build`
  - [ ] Check bundle size
  - [ ] Test build locally: `npm run preview`
  - [ ] Verify all routes work
  - [ ] Test API connections

- [ ] **Assets & Performance**
  - [ ] Optimize images
  - [ ] Check lazy loading
  - [ ] Verify code splitting
  - [ ] Test on slow connections

---

## 🚀 Backend Deployment

### Option 1: Railway

1. **Create Account**
   - Sign up at [railway.app](https://railway.app)

2. **Deploy**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Initialize project
   cd server
   railway init
   
   # Deploy
   railway up
   ```

3. **Configure**
   - Add environment variables in Railway dashboard
   - Connect MongoDB Atlas
   - Get deployment URL
   - Test health endpoint

### Option 2: Heroku

1. **Prepare**
   ```bash
   # Add Procfile in server directory
   echo "web: node src/index.js" > Procfile
   
   # Ensure start script in package.json
   "scripts": {
     "start": "node src/index.js"
   }
   ```

2. **Deploy**
   ```bash
   heroku login
   cd server
   heroku create brandtide-api
   
   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_secret
   heroku config:set MONGODB_URI=your_atlas_uri
   heroku config:set CLIENT_URL=https://yourdomain.com
   
   # Deploy
   git push heroku main
   ```

### Option 3: VPS (DigitalOcean, AWS EC2, etc.)

1. **Server Setup**
   ```bash
   # SSH into server
   ssh user@your-server-ip
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Clone repository
   git clone <your-repo-url>
   cd brandtide/server
   npm install --production
   ```

2. **Configure**
   ```bash
   # Create .env file
   nano .env
   # Add all production environment variables
   
   # Start with PM2
   pm2 start src/index.js --name brandtide-api
   pm2 save
   pm2 startup
   ```

3. **Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **SSL Certificate**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

---

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Deploy via CLI**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login
   vercel login
   
   # Deploy
   vercel
   ```

2. **Or Deploy via Git**
   - Push code to GitHub
   - Connect repository at [vercel.com](https://vercel.com)
   - Configure environment variables
   - Deploy automatically

3. **Configure**
   - Add `VITE_API_URL` environment variable
   - Set build command: `npm run build`
   - Set output directory: `dist`

### Option 2: Netlify

1. **netlify.toml**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy**
   - Connect GitHub repository
   - Add environment variables
   - Deploy

### Option 3: Static Hosting (S3, Firebase, etc.)

1. **Build**
   ```bash
   npm run build
   ```

2. **Upload `dist/` folder** to your hosting provider

3. **Configure redirects** for SPA routing

---

## ✅ Post-Deployment Verification

### Backend Checks

- [ ] Health endpoint responding: `https://api.yourdomain.com/health`
- [ ] HTTPS working correctly
- [ ] CORS headers correct
- [ ] MongoDB connection stable
- [ ] Authentication endpoints working
- [ ] All API routes accessible
- [ ] Rate limiting active
- [ ] Error logging configured

### Frontend Checks

- [ ] Application loads correctly
- [ ] All routes accessible
- [ ] API calls working
- [ ] Google OAuth functioning
- [ ] Assets loading (images, fonts)
- [ ] Mobile responsive
- [ ] Browser console clear of errors
- [ ] Performance metrics acceptable

### Integration Tests

- [ ] Register new account
- [ ] Login with credentials
- [ ] Google OAuth flow
- [ ] Classify single review
- [ ] Upload CSV and batch process
- [ ] Generate PDF report
- [ ] Dashboard loads with data
- [ ] Logout and re-login

---

## 📊 Monitoring Setup

### Backend Monitoring

- [ ] **Logging**
  ```javascript
  // Use production logging service
  // Winston, Bunyan, or cloud provider logs
  ```

- [ ] **Error Tracking**
  - Set up Sentry or similar
  - Configure error alerts

- [ ] **Performance Monitoring**
  - New Relic, Datadog, or CloudWatch
  - Track API response times
  - Monitor database queries

- [ ] **Uptime Monitoring**
  - UptimeRobot or Pingdom
  - Set up alerts for downtime

### Frontend Monitoring

- [ ] **Analytics**
  - Google Analytics or Plausible
  - Track user journeys

- [ ] **Error Tracking**
  - Sentry for JavaScript errors
  - Track console errors

- [ ] **Performance**
  - Lighthouse CI
  - Core Web Vitals monitoring

---

## 🔐 Security Hardening

### Post-Deployment Security

- [ ] **SSL/TLS**
  - Force HTTPS redirect
  - Use HSTS headers
  - Check SSL certificate validity

- [ ] **Headers**
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options

- [ ] **Database**
  - Restrict MongoDB Atlas IP whitelist
  - Use strong database credentials
  - Enable audit logging

- [ ] **Secrets**
  - Rotate JWT secret periodically
  - Use environment variables only
  - Never commit .env files

- [ ] **Backups**
  - Configure MongoDB Atlas automated backups
  - Test restore process
  - Document recovery procedure

---

## 📝 Documentation Updates

- [ ] Update README with production URLs
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Update API documentation
- [ ] Add contact information for support

---

## 🚨 Rollback Plan

If deployment fails:

1. **Frontend**
   - Revert to previous Vercel deployment
   - Or redeploy last working commit

2. **Backend**
   ```bash
   # PM2
   pm2 restart brandtide-api
   
   # Heroku
   heroku releases:rollback
   
   # Railway
   railway rollback
   ```

3. **Database**
   - Restore from MongoDB Atlas backup
   - Document data loss (if any)

---

## 📞 Support Contacts

- **Frontend Hosting**: [Vercel Support](https://vercel.com/support)
- **Backend Hosting**: [Railway Support](https://railway.app/help)
- **Database**: [MongoDB Atlas Support](https://www.mongodb.com/cloud/atlas/support)
- **Domain/DNS**: Your domain provider

---

## ✨ Go Live!

Once all checks pass:

1. Update DNS records (if needed)
2. Announce to users
3. Monitor for 24-48 hours
4. Celebrate! 🎉

---

**Last Updated**: 2025-12-08
**Version**: 1.0.0
