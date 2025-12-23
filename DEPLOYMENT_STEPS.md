# Step-by-Step Deployment Guide

## Overview

We'll deploy using:
- **Backend**: Render.com (Free)
- **Frontend**: Vercel (Free)  
- **Database**: MongoDB Atlas (Free - already set up)

**Total Cost: $0/month**

---

## PART 1: Prepare Your Code

### Step 1.1: Generate JWT Secret

1. Go to https://randomkeygen.com/
2. Copy a "CodeIgniter Encryption Keys" (long random string)
3. Save it somewhere safe - you'll need it for Render

### Step 1.2: Get MongoDB Connection String

1. Go to MongoDB Atlas dashboard
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string
5. Replace `<password>` with your database password
6. Add database name: `/jitsi-classroom?retryWrites=true&w=majority`
7. Save this - you'll need it for Render

Example:
```
mongodb+srv://username:password@cluster.mongodb.net/jitsi-classroom?retryWrites=true&w=majority
```

---

## PART 2: Push Code to GitHub

### Step 2.1: Initialize Git (if not done)

Open terminal in your project folder:

```bash
cd /Users/rahulg_1/Desktop/personal/jitsi
git init
git add .
git commit -m "Initial commit - Ready for deployment"
```

### Step 2.2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `jitsi-classroom` (or any name)
3. Description: "Anita Scholar Academy - Jitsi Classroom Platform"
4. **Don't** check "Initialize with README"
5. Click **"Create repository"**

### Step 2.3: Push Code

```bash
git remote add origin https://github.com/YOUR_USERNAME/jitsi-classroom.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## PART 3: Deploy Backend to Render.com

### Step 3.1: Create Render Account

1. Go to https://render.com
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended) or email
4. Verify your email

### Step 3.2: Create Web Service

1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Click **"Connect account"** next to GitHub
4. Authorize Render to access your repositories
5. Select your `jitsi-classroom` repository
6. Click **"Connect"**

### Step 3.3: Configure Service

Fill in the form:

- **Name**: `jitsi-backend` (or any name)
- **Environment**: `Node`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Select **"Free"**

### Step 3.4: Add Environment Variables

Scroll down to **"Environment Variables"** section and click **"Add Environment Variable"** for each:

1. **PORT**
   - Key: `PORT`
   - Value: `10000`

2. **MONGODB_URI**
   - Key: `MONGODB_URI`
   - Value: Your MongoDB Atlas connection string (from Step 1.2)

3. **JWT_SECRET**
   - Key: `JWT_SECRET`
   - Value: The random string you generated (from Step 1.1)

4. **JWT_EXPIRE**
   - Key: `JWT_EXPIRE`
   - Value: `7d`

5. **NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`

### Step 3.5: Deploy

1. Scroll down and click **"Create Web Service"**
2. Render will start building (takes 5-10 minutes)
3. Watch the logs - you should see:
   - "Installing dependencies..."
   - "MongoDB Connected"
   - "Server running on port 10000"
4. Once deployed, you'll see: **"Your service is live"**
5. **Copy your service URL** (e.g., `https://jitsi-backend.onrender.com`)

### Step 3.6: Test Backend

1. Open your backend URL in browser
2. Add `/api/health` to the URL
3. You should see: `{"status":"OK","message":"Server is running"}`

---

## PART 4: Update MongoDB Atlas

### Step 4.1: Allow Render IP

1. Go to MongoDB Atlas dashboard
2. Click **"Network Access"** (left sidebar)
3. Click **"Add IP Address"**
4. Click **"Allow Access from Anywhere"** (adds 0.0.0.0/0)
5. Click **"Confirm"**

This allows Render to connect to your database.

---

## PART 5: Deploy Frontend to Vercel

### Step 5.1: Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended)
4. Authorize Vercel

### Step 5.2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Find your `jitsi-classroom` repository
3. Click **"Import"**

### Step 5.3: Configure Project

Fill in:

- **Framework Preset**: `Create React App` (auto-detected)
- **Root Directory**: Click **"Edit"** → Change to `frontend`
- **Build Command**: `npm run build` (auto-filled)
- **Output Directory**: `build` (auto-filled)
- **Install Command**: Leave default

### Step 5.4: Add Environment Variable

1. Scroll to **"Environment Variables"**
2. Click **"Add"**
3. Add:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend-url.onrender.com/api`
   
   Replace `your-backend-url` with your actual Render backend URL from Step 3.5

   Example: `https://jitsi-backend.onrender.com/api`

### Step 5.5: Deploy

1. Click **"Deploy"**
2. Vercel will build your app (takes 2-5 minutes)
3. Once complete, you'll see: **"Congratulations! Your project has been deployed"**
4. **Copy your deployment URL** (e.g., `https://jitsi-classroom.vercel.app`)

---

## PART 6: Update Backend CORS (If Needed)

If you get CORS errors, update the backend:

1. Go to Render dashboard
2. Open your backend service
3. Go to **"Environment"** tab
4. Add new environment variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: Your Vercel frontend URL (e.g., `https://jitsi-classroom.vercel.app`)
5. Click **"Save Changes"**
6. Render will automatically redeploy

---

## PART 7: Test Your Deployment

### Test Checklist:

1. **Frontend loads**: Visit your Vercel URL
2. **Register**: Create a new account
3. **Login**: Sign in with your account
4. **Dashboard**: Check if dashboard loads correctly
5. **Create Class** (if teacher): Test class creation
6. **Join Class**: Test video joining
7. **Chat**: Test messaging
8. **Admin**: Test admin features

### Common Issues:

**Problem**: Frontend shows "Network Error"
- **Fix**: Check `REACT_APP_API_URL` in Vercel matches your Render backend URL

**Problem**: Backend returns 503
- **Fix**: This is normal on Render free tier (cold start). Wait 30 seconds and try again.

**Problem**: CORS errors
- **Fix**: Add `FRONTEND_URL` environment variable in Render (Step 6)

---

## PART 8: Update After Deployment

### Update CORS in Code (Optional)

If you want to hardcode your Vercel domain, edit `backend/server.js`:

Find the `allowedOrigins` array and add your Vercel URL:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  'https://your-app.vercel.app'  // Add your Vercel URL here
];
```

Then commit and push:
```bash
git add backend/server.js
git commit -m "Update CORS for production"
git push
```

Render will auto-redeploy.

---

## Success! 🎉

Your app is now live and completely free!

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`
- **Cost**: $0/month

---

## Future Updates

To update your app:

1. Make changes locally
2. Test thoroughly
3. Commit and push:
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```
4. Render and Vercel will automatically redeploy
5. Changes go live in 2-5 minutes

---

## Need Help?

- **Render Issues**: Check logs in Render dashboard
- **Vercel Issues**: Check deployment logs in Vercel dashboard
- **MongoDB Issues**: Check MongoDB Atlas dashboard
- **General**: See `DEPLOYMENT.md` for detailed troubleshooting

Good luck! 🚀

