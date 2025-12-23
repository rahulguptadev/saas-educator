# Deployment Checklist

Use this checklist to ensure everything is set up correctly before and after deployment.

## Pre-Deployment Checklist

### Code Preparation
- [ ] All code is committed to Git
- [ ] `.env` files are in `.gitignore` (they should be)
- [ ] No sensitive data in code
- [ ] All features tested locally

### Environment Variables Prepared
- [ ] MongoDB Atlas connection string ready
- [ ] Strong JWT_SECRET generated (use https://randomkeygen.com/)
- [ ] Frontend API URL will be set in Vercel

### Accounts Created
- [ ] GitHub account (free)
- [ ] Render.com account (free)
- [ ] Vercel account (free)
- [ ] MongoDB Atlas account (already have)

## Deployment Steps

### Backend (Render.com)
- [ ] Code pushed to GitHub
- [ ] Render service created
- [ ] Environment variables set in Render:
  - [ ] `PORT=10000`
  - [ ] `MONGODB_URI` (your Atlas connection string)
  - [ ] `JWT_SECRET` (strong random string)
  - [ ] `JWT_EXPIRE=7d`
  - [ ] `NODE_ENV=production`
- [ ] Backend deployed successfully
- [ ] Backend URL copied (e.g., `https://jitsi-backend.onrender.com`)

### Database (MongoDB Atlas)
- [ ] Network Access updated (Allow 0.0.0.0/0)
- [ ] Connection string verified

### Frontend (Vercel)
- [ ] Vercel project created
- [ ] Environment variable set:
  - [ ] `REACT_APP_API_URL=https://your-backend.onrender.com/api`
- [ ] Frontend deployed successfully
- [ ] Frontend URL copied (e.g., `https://jitsi-classroom.vercel.app`)

## Post-Deployment Testing

### Authentication
- [ ] Can register new user
- [ ] Can login
- [ ] Can logout

### Admin Features
- [ ] Admin can access admin dashboard
- [ ] Can create teachers/students
- [ ] Can activate/deactivate users
- [ ] Can view all chats

### Teacher Features
- [ ] Can create classes
- [ ] Can view scheduled classes
- [ ] Can join video sessions
- [ ] Can send messages

### Student Features
- [ ] Can view assigned classes
- [ ] Can join video sessions
- [ ] Can send messages

### Chat Features
- [ ] Can create private chats
- [ ] Can create group chats (admin)
- [ ] Messages send/receive correctly
- [ ] Notifications work

### Video Features
- [ ] Can join Jitsi meetings
- [ ] Video/audio works
- [ ] No duplicate players

## Common Issues & Solutions

### Issue: Backend returns 503 or times out
**Solution**: Render free tier spins down after 15 min. First request after spin-down takes ~30 seconds. This is normal.

### Issue: CORS errors
**Solution**: 
1. Check backend CORS configuration
2. Verify frontend URL is in allowed origins
3. Check `REACT_APP_API_URL` is set correctly

### Issue: MongoDB connection fails
**Solution**:
1. Verify MongoDB Atlas network access (0.0.0.0/0)
2. Check connection string in Render environment variables
3. Verify database name in connection string

### Issue: Frontend shows "Network Error"
**Solution**:
1. Check `REACT_APP_API_URL` in Vercel
2. Verify backend URL is correct
3. Check backend is running (visit backend URL in browser)

### Issue: Build fails
**Solution**:
1. Check build logs in Vercel/Render
2. Verify all dependencies in package.json
3. Check for syntax errors

## Performance Tips

1. **Render Cold Starts**: First request after 15 min inactivity takes ~30 seconds. Consider upgrading to paid tier for always-on service.

2. **MongoDB Indexes**: Already set up in models, but monitor database performance.

3. **Frontend Caching**: Vercel automatically handles this with CDN.

## Security Reminders

- ✅ Never commit `.env` files
- ✅ Use strong JWT_SECRET
- ✅ Keep MongoDB connection string secure
- ✅ HTTPS is automatic (Render/Vercel)
- ✅ CORS is configured

## Monitoring

After deployment, regularly check:
- Render logs for backend errors
- Vercel analytics for frontend performance
- MongoDB Atlas for database usage
- User feedback for issues

## Update Process

To update your deployed app:

1. Make changes locally
2. Test thoroughly
3. Commit and push:
   ```bash
   git add .
   git commit -m "Update description"
   git push
   ```
4. Render and Vercel auto-deploy
5. Test on production URLs

---

**Ready to deploy?** Follow `DEPLOYMENT_QUICK_START.md` for step-by-step instructions!

