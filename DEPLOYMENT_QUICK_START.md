# Quick Deployment Guide - 5 Steps

## Step 1: Push to GitHub

```bash
cd /Users/rahulg_1/Desktop/personal/jitsi
git init
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/jitsi-classroom.git
git push -u origin main
```

## Step 2: Deploy Backend (Render.com)

1. Go to https://render.com → Sign up (free)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub → Select your repo
4. Settings:
   - **Name**: `jitsi-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Add Environment Variables:
   ```
   PORT=10000
   MONGODB_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=generate-random-string-here
   JWT_EXPIRE=7d
   NODE_ENV=production
   ```
6. Click **"Create Web Service"**
7. Wait for deployment → Copy your URL (e.g., `https://jitsi-backend.onrender.com`)

## Step 3: Update MongoDB Atlas

1. Go to MongoDB Atlas → **Network Access**
2. Click **"Add IP Address"** → **"Allow Access from Anywhere"** (0.0.0.0/0)

## Step 4: Deploy Frontend (Vercel)

1. Go to https://vercel.com → Sign up (free)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repo
4. Settings:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```
   (Replace with your actual Render backend URL)
6. Click **"Deploy"**
7. Wait for deployment → Copy your URL (e.g., `https://jitsi-classroom.vercel.app`)

## Step 5: Update Backend CORS (Optional)

If you get CORS errors, update `backend/server.js` to include your Vercel domain in the allowed origins list.

## Done! 🎉

Your app is now live at your Vercel URL!

**Total Cost: $0/month**

---

## Troubleshooting

**Backend not working?**
- Check Render logs
- Verify MongoDB connection string
- Check environment variables

**Frontend can't connect?**
- Verify `REACT_APP_API_URL` in Vercel
- Check backend URL is correct
- Check CORS settings

**Need more help?** See `DEPLOYMENT.md` for detailed guide.

