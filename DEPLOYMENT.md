# Deployment Guide - Free Hosting

This guide will help you deploy your Jitsi Classroom platform completely free using:
- **Backend**: Render.com (Free tier)
- **Frontend**: Vercel (Free tier)
- **Database**: MongoDB Atlas (Free tier - already set up)

## Prerequisites

1. GitHub account (free)
2. Render.com account (free)
3. Vercel account (free)
4. MongoDB Atlas account (already have)

---

## Step 1: Prepare Your Code for Deployment

### 1.1 Update Environment Variables

Create a `.env.production` file in the backend folder (don't commit this):

```env
PORT=10000
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-very-secure-random-string-here
JWT_EXPIRE=7d
NODE_ENV=production
```

**Important**: 
- Use a strong random string for `JWT_SECRET` (you can generate one at https://randomkeygen.com/)
- Your MongoDB Atlas connection string should already be set up

### 1.2 Update Frontend API URL

We need to make the frontend use the production API URL. Update the frontend to use environment variables.

### 1.3 Create Production Build Scripts

The package.json files are already set up, but we'll verify them.

---

## Step 2: Push Code to GitHub

### 2.1 Initialize Git Repository (if not already done)

```bash
cd /Users/rahulg_1/Desktop/personal/jitsi
git init
git add .
git commit -m "Initial commit - Ready for deployment"
```

### 2.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `jitsi-classroom`)
3. **Don't** initialize with README (we already have one)

### 2.3 Push Code to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/jitsi-classroom.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 3: Deploy Backend to Render.com

### 3.1 Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended) or email
3. Verify your email

### 3.2 Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your `jitsi-classroom` repository
4. Configure the service:
   - **Name**: `jitsi-backend` (or any name you prefer)
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: **Free** (select this)

### 3.3 Set Environment Variables

In the Render dashboard, go to **Environment** section and add:

```
PORT=10000
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-very-secure-random-string
JWT_EXPIRE=7d
NODE_ENV=production
```

**Important**: 
- Copy your MongoDB Atlas connection string
- Generate a secure JWT secret

### 3.4 Deploy

1. Click **"Create Web Service"**
2. Render will start building and deploying
3. Wait for deployment to complete (5-10 minutes)
4. Note your backend URL (e.g., `https://jitsi-backend.onrender.com`)

### 3.5 Update MongoDB Atlas Network Access

1. Go to MongoDB Atlas dashboard
2. **Network Access** → **Add IP Address**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - This allows Render to connect

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your repositories

### 4.2 Create New Project

1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 4.3 Set Environment Variables

In Vercel project settings, go to **Environment Variables** and add:

```
REACT_APP_API_URL=https://your-backend-url.onrender.com/api
```

Replace `your-backend-url` with your actual Render backend URL.

### 4.4 Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your frontend
3. Wait for deployment (2-5 minutes)
4. You'll get a URL like `https://jitsi-classroom.vercel.app`

---

## Step 5: Update Frontend to Use Production API

We need to update the frontend API service to use the environment variable.

### 5.1 Verify API Service

The frontend already uses `process.env.REACT_APP_API_URL`, so it should work automatically once you set the environment variable in Vercel.

### 5.2 Update CORS in Backend

Make sure your backend allows requests from your Vercel domain. Update the backend CORS settings if needed.

---

## Step 6: Test Your Deployment

1. Visit your Vercel frontend URL
2. Try to register/login
3. Test all features:
   - Create classes
   - Join video sessions
   - Send messages
   - Admin functions

---

## Step 7: Custom Domain (Optional - Free)

### 7.1 Vercel Custom Domain

1. Go to your Vercel project settings
2. **Domains** → Add your domain
3. Follow DNS configuration instructions

### 7.2 Render Custom Domain

1. Go to Render dashboard
2. **Settings** → **Custom Domains**
3. Add your domain and configure DNS

---

## Troubleshooting

### Backend Issues

**Problem**: Backend not connecting to MongoDB
- **Solution**: Check MongoDB Atlas network access (allow 0.0.0.0/0)
- Verify connection string in Render environment variables

**Problem**: Backend crashes on startup
- **Solution**: Check Render logs for errors
- Verify all environment variables are set correctly
- Check that `package.json` has correct start script

### Frontend Issues

**Problem**: Frontend can't connect to backend
- **Solution**: 
  - Verify `REACT_APP_API_URL` is set in Vercel
  - Check backend URL is correct
  - Verify CORS is configured in backend

**Problem**: Build fails
- **Solution**: 
  - Check Vercel build logs
  - Verify all dependencies are in `package.json`
  - Check for TypeScript/ESLint errors

### Common Issues

**Problem**: "Free tier limitations"
- Render free tier: Spins down after 15 minutes of inactivity (first request may be slow)
- Vercel free tier: Very generous, no major limitations
- MongoDB Atlas free tier: 512MB storage (plenty for development)

**Problem**: Slow first request
- This is normal on Render free tier (cold start)
- Consider upgrading to paid tier for always-on service

---

## Free Tier Limitations

### Render.com Free Tier
- ✅ 750 hours/month (enough for always-on)
- ⚠️ Spins down after 15 min inactivity (cold start ~30 seconds)
- ✅ 512MB RAM
- ✅ Free SSL certificate

### Vercel Free Tier
- ✅ Unlimited deployments
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ No cold starts
- ✅ 100GB bandwidth/month

### MongoDB Atlas Free Tier
- ✅ 512MB storage
- ✅ Shared RAM
- ✅ No credit card required
- ✅ Perfect for small applications

---

## Maintenance

### Updating Your Application

1. Make changes locally
2. Test thoroughly
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```
4. Render and Vercel will automatically redeploy

### Monitoring

- **Render**: Check logs in dashboard
- **Vercel**: Check deployment logs and analytics
- **MongoDB Atlas**: Monitor database usage in dashboard

---

## Security Checklist

- [ ] Use strong JWT_SECRET (random string)
- [ ] MongoDB connection string is secure
- [ ] Environment variables are set (not in code)
- [ ] CORS is configured correctly
- [ ] HTTPS is enabled (automatic on Render/Vercel)

---

## Cost Summary

**Total Monthly Cost: $0.00** 🎉

- Render.com: Free
- Vercel: Free
- MongoDB Atlas: Free
- Domain (optional): Free with Freenom or ~$10/year with Namecheap

---

## Quick Reference

- **Backend URL**: `https://your-backend.onrender.com`
- **Frontend URL**: `https://your-app.vercel.app`
- **GitHub Repo**: `https://github.com/YOUR_USERNAME/jitsi-classroom`

---

## Need Help?

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com

Good luck with your deployment! 🚀

