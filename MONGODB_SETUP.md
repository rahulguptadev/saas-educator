# MongoDB Atlas Setup Guide (Free Tier)

This guide will walk you through creating a free MongoDB cluster on MongoDB Atlas.

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Click **"Try Free"** or **"Sign Up"**
3. Fill in your details:
   - Email address
   - Password
   - First and Last name
4. Click **"Create your Atlas account"**
5. Verify your email address if prompted

## Step 2: Create a Free Cluster

1. After logging in, you'll see the **"Deploy a cloud database"** screen
2. Select **"M0 FREE"** (Free Shared Cluster) - This is the free tier
3. Choose your **Cloud Provider**:
   - AWS (Recommended)
   - Google Cloud
   - Azure
4. Select a **Region** closest to you:
   - For example: `N. Virginia (us-east-1)` or `Mumbai (ap-south-1)`
   - **Note**: Some regions may not have free tier available, choose one that does
5. Leave **Cluster Name** as default (e.g., "Cluster0") or customize it
6. Click **"Create Cluster"**
7. Wait 3-5 minutes for the cluster to be created

## Step 3: Create Database User

1. You'll see a **"Create Database User"** screen
2. Choose **"Password"** authentication method
3. Enter:
   - **Username**: (e.g., `admin` or `jitsi-user`)
   - **Password**: Create a strong password (save this!)
4. Click **"Create Database User"**

## Step 4: Configure Network Access

1. You'll see **"Where would you like to connect from?"** screen
2. For development, click **"Add My Current IP Address"**
3. Click **"Add IP Address"**
4. **For production**, you can add:
   - Specific IP addresses
   - Or click **"Allow Access from Anywhere"** (0.0.0.0/0) - **Less secure but convenient for development**

## Step 5: Get Your Connection String

1. Click **"Connect"** button on your cluster
2. Select **"Connect your application"**
3. Choose **"Node.js"** as your driver
4. Copy the connection string - it will look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Configure Your Project

1. Open your project's `backend/.env` file
2. Replace the `MONGODB_URI` with your connection string:

```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/jitsi-classroom?retryWrites=true&w=majority
```

**Important**: 
- Replace `<username>` with your database username
- Replace `<password>` with your database password (URL encode special characters if needed)
- Replace `cluster0.xxxxx` with your actual cluster name
- Add `/jitsi-classroom` before the `?` to specify the database name

### URL Encoding Special Characters

If your password contains special characters, encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`

**Example:**
- Password: `MyP@ss#123`
- Encoded: `MyP%40ss%23123`

## Step 7: Test Your Connection

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. You should see: `MongoDB Connected` in the console

3. If you see connection errors:
   - Check your username and password
   - Verify your IP address is whitelisted
   - Check the connection string format

## Troubleshooting

### Connection Timeout
- **Solution**: Make sure your IP address is whitelisted in Network Access

### Authentication Failed
- **Solution**: Double-check your username and password in the connection string
- Make sure special characters are URL-encoded

### Cluster Not Found
- **Solution**: Verify the cluster name in your connection string matches your actual cluster

### Free Tier Limitations
- **Storage**: 512 MB (plenty for development)
- **RAM**: Shared
- **No credit card required** for free tier
- **Perfect for development and small projects**

## Security Best Practices

1. **Never commit your `.env` file** to version control
2. **Use strong passwords** for database users
3. **Restrict IP access** in production (don't use 0.0.0.0/0)
4. **Rotate passwords** regularly
5. **Use environment variables** for all sensitive data

## Alternative: Local MongoDB

If you prefer to use local MongoDB instead:

1. **Install MongoDB locally**:
   - macOS: `brew install mongodb-community`
   - Linux: `sudo apt-get install mongodb`
   - Windows: Download from [mongodb.com](https://www.mongodb.com/try/download/community)

2. **Start MongoDB**:
   - macOS: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`
   - Windows: Run as service or `mongod.exe`

3. **Use local connection string** in `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/jitsi-classroom
   ```

## Need Help?

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Community Forums](https://developer.mongodb.com/community/forums/)
- Check the main `SETUP.md` file for project-specific setup

