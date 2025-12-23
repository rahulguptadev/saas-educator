# Setup Guide

## Prerequisites

1. **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
2. **MongoDB** - You can use:
   - Local MongoDB installation
   - MongoDB Atlas (free cloud database) - [Sign up](https://www.mongodb.com/cloud/atlas)

## Installation Steps

### 1. Install Dependencies

From the root directory, run:

```bash
npm run install-all
```

This will install dependencies for:
- Root package (concurrently)
- Backend (Express, Mongoose, etc.)
- Frontend (React, etc.)

### 2. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a `.env` file:
```bash
cp env.example .env
```

3. Edit the `.env` file with your configuration:
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/jitsi-classroom
# OR for MongoDB Atlas (Free tier available):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jitsi-classroom?retryWrites=true&w=majority

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

**Important:** 
- Replace `your-super-secret-jwt-key-change-this-in-production` with a strong random string
- For MongoDB Atlas, see [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed setup instructions
- For local MongoDB, use the default connection string above

### 3. Start MongoDB

If using local MongoDB, make sure MongoDB is running:

**macOS (using Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Windows:**
Start MongoDB as a service or run `mongod.exe`

### 4. Run the Application

From the root directory:

```bash
npm run dev
```

This will start:
- **Backend server** on http://localhost:5001
- **Frontend app** on http://localhost:3000

### 5. Create Your First Account

1. Open http://localhost:3000
2. Click "Register here" or go to http://localhost:3000/register
3. Create an account with role "Admin" to get full access

## Project Structure

```
jitsi/
├── backend/
│   ├── models/          # MongoDB models (User, Class)
│   ├── routes/          # API routes (auth, users, classes, admin)
│   ├── middleware/      # Authentication middleware
│   ├── server.js        # Express server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components (Dashboards, Login, etc.)
│   │   ├── services/    # API service functions
│   │   ├── context/     # React context (Auth)
│   │   └── App.js       # Main app component
│   └── package.json
└── package.json         # Root package.json
```

## Features

### Admin Dashboard
- View platform statistics
- Manage teachers and students
- Activate/deactivate users
- View all classes

### Teacher Dashboard
- Create and schedule classes
- Select students for classes
- View upcoming and past classes
- Join video sessions

### Student Dashboard
- View scheduled classes
- Join video sessions
- See class details (teacher name, time, etc.)

### Privacy Features
- Student email and phone numbers are hidden from teachers
- Only admins can see full user information

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check your `MONGODB_URI` in `.env`
- For MongoDB Atlas, ensure your IP is whitelisted

### Port Already in Use
- Change `PORT` in backend `.env` file
- Or kill the process using the port

### Jitsi Not Loading
- Check browser console for errors
- Ensure you have a stable internet connection
- Jitsi Meet requires HTTPS in production (works on HTTP in development)

## Production Deployment

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Set `NODE_ENV=production` in backend `.env`

3. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start backend/server.js
```

4. Serve the frontend build folder using a web server (nginx, Apache, etc.)

## Support

For issues or questions, check the main README.md file.

