# DSA Mentor - Complete Setup Guide for New Systems

This guide will help you set up the DSA Mentor application on a new system from scratch.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Troubleshooting](#troubleshooting)
5. [First Login](#first-login)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** (optional, for cloning) - [Download](https://git-scm.com/)
- **npm** (comes with Node.js)

### Verify Installations

```bash
node --version   # Should show v14.x.x or higher
npm --version    # Should show 6.x.x or higher
mongosh         # Should connect to MongoDB
```

---

## Quick Start

### For the Impatient 🚀

```bash
# 1. Start MongoDB
sudo systemctl start mongod  # Linux
# OR brew services start mongodb-community  # macOS
# OR net start MongoDB  # Windows

# 2. Backend Setup
cd backend
npm install
cp .env.example .env
# Edit .env and generate JWT secrets (see below)
npm run create-superadmin
npm run dev

# 3. Frontend Setup (in new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev

# 4. Open browser
# Navigate to http://localhost:5173/login
# Login with credentials from backend/.env
```

---

## Detailed Setup

### Step 1: Clone or Download the Project

```bash
# If using Git
git clone <repository-url>
cd DSA-MENTOR

# Or extract the ZIP file and navigate to the directory
```

### Step 2: MongoDB Setup

#### Install MongoDB (if not already installed)

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
sudo systemctl enable mongod
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

#### Verify MongoDB is Running

```bash
mongosh
# You should see: "Connected to: mongodb://127.0.0.1:27017"
# Type 'exit' to quit
```

### Step 3: Backend Setup

#### 3.1 Install Dependencies

```bash
cd backend
npm install
```

#### 3.2 Create Environment File

```bash
cp .env.example .env
```

#### 3.3 Configure Environment Variables

Edit the `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/dsa-mentor

# JWT Secrets - GENERATE NEW ONES!
ACCESS_TOKEN_SECRET=<paste-generated-secret-here>
REFRESH_TOKEN_SECRET=<paste-generated-secret-here>

# CORS Configuration
CLIENT_URL=http://localhost:5173

# Superadmin Credentials
SUPERADMIN_EMAIL=admin@dsamentor.com
SUPERADMIN_PASSWORD=YourSecurePassword123!
SUPERADMIN_USERNAME=admin
```

#### 3.4 Generate JWT Secrets

Run this command **twice** to generate two different secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the first output to `ACCESS_TOKEN_SECRET` and the second to `REFRESH_TOKEN_SECRET`.

**Example:**
```env
ACCESS_TOKEN_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
REFRESH_TOKEN_SECRET=f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1
```

#### 3.5 Customize Superadmin Credentials (Optional but Recommended)

In the `.env` file, change the superadmin credentials:

```env
SUPERADMIN_EMAIL=youremail@example.com
SUPERADMIN_PASSWORD=YourStrongPassword123!
SUPERADMIN_USERNAME=yourusername
```

#### 3.6 Create Superadmin Account

```bash
npm run create-superadmin
```

**Expected Output:**
```
🔄 Starting superadmin creation process...

📊 Configuration:
   Database: mongodb://localhost:27017/dsa-mentor
   Email: admin@dsamentor.com
   Username: admin

🔌 Connecting to MongoDB...
✅ Connected to MongoDB successfully

🔍 Checking for existing superadmin account...
👤 Creating new superadmin account...

✅ Superadmin account created successfully!

============================================================
🎉 SETUP COMPLETE!
============================================================

📝 Login Credentials:
   Email:    admin@dsamentor.com
   Password: YourSecurePassword123!
   Role:     superadmin

🌐 Login URL:
   http://localhost:5173/login

⚠️  SECURITY REMINDER:
   • Change your password immediately after first login
   • Never share these credentials
   • Use a strong, unique password

============================================================
```

#### 3.7 Start Backend Server

```bash
npm run dev
```

**Expected Output:**
```
✅ Environment variables validated successfully
Server running on port 5000
MongoDB connected...
🚀 Server running on port 5000
📍 Environment: development
🌐 Frontend URL: http://localhost:5173
```

**Leave this terminal running!**

### Step 4: Frontend Setup

Open a **new terminal window/tab**.

#### 4.1 Install Dependencies

```bash
cd frontend
npm install
```

#### 4.2 Create Environment File

```bash
cp .env.example .env
```

#### 4.3 Configure Environment (if needed)

The default values should work for local development. Edit `.env` only if you changed the backend port:

```env
VITE_API_URL=http://localhost:5000/api
```

#### 4.4 Start Frontend Server

```bash
npm run dev
```

**Expected Output:**
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## First Login

### Access the Application

1. Open your browser and navigate to: **http://localhost:5173**
2. Click on **Login** or navigate to **http://localhost:5173/login**
3. Enter the credentials from your `backend/.env` file:
   - **Email:** Value from `SUPERADMIN_EMAIL`
   - **Password:** Value from `SUPERADMIN_PASSWORD`
4. Click **Login**

### Expected Behavior

- ✅ You should be redirected to the **Superadmin Dashboard** at `/dashboard/admin`
- ✅ You should see your username in the header
- ✅ You can access admin features like managing users, problems, and viewing analytics

### Important Security Steps

🔒 **Change your password immediately after first login!**

1. Navigate to **Settings** in the dashboard
2. Update your password to something more secure
3. Consider using a password manager

---

## Troubleshooting

### Issue 1: "Cannot connect to server" in Frontend

**Symptoms:**
- Login button shows "Unable to connect to server"
- Network errors in browser console

**Solutions:**

1. **Check if backend is running:**
   ```bash
   curl http://localhost:5000/api/health
   # Should return JSON with status
   ```

2. **Verify backend port:**
   - Check `backend/.env` → `PORT=5000`
   - Check `frontend/.env` → `VITE_API_URL=http://localhost:5000/api`
   - They must match!

3. **Check for CORS errors:**
   - Open browser console (F12)
   - Look for CORS-related errors
   - Ensure `CLIENT_URL` in `backend/.env` is `http://localhost:5173`

### Issue 2: "Invalid email or password"

**Solutions:**

1. **Verify credentials:**
   ```bash
   # Check what credentials were used
   cat backend/.env | grep SUPERADMIN
   ```

2. **Recreate superadmin:**
   ```bash
   cd backend
   npm run create-superadmin
   # This updates the password if account exists
   ```

3. **Check for typos:**
   - Email and password are case-sensitive
   - No extra spaces in `.env` file
   - Password must match exactly

### Issue 3: "MongoDB connection refused"

**Symptoms:**
- Backend crashes on startup
- Error: `MongoNetworkError: connect ECONNREFUSED`

**Solutions:**

1. **Start MongoDB:**
   ```bash
   # Linux
   sudo systemctl start mongod
   sudo systemctl status mongod
   
   # macOS
   brew services start mongodb-community
   brew services list | grep mongodb
   
   # Windows
   net start MongoDB
   ```

2. **Verify MongoDB is running:**
   ```bash
   mongosh
   # Should connect without errors
   ```

3. **Check MongoDB connection string:**
   ```bash
   # In backend/.env
   MONGO_URI=mongodb://localhost:27017/dsa-mentor
   ```

### Issue 4: "Missing required environment variables"

**Symptoms:**
- Backend exits immediately on startup
- Error message lists missing variables

**Solutions:**

1. **Ensure `.env` file exists:**
   ```bash
   ls -la backend/.env
   # File should exist
   ```

2. **Copy from example:**
   ```bash
   cd backend
   cp .env.example .env
   ```

3. **Verify all variables are set:**
   ```bash
   cat backend/.env
   # Should contain all variables from .env.example
   ```

### Issue 5: "Port already in use"

**Symptoms:**
- Error: `EADDRINUSE: address already in use :::5000`

**Solutions:**

1. **Find and kill the process:**
   ```bash
   # Linux/macOS
   lsof -ti:5000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID_from_above> /F
   ```

2. **Or use a different port:**
   ```bash
   # In backend/.env
   PORT=5001
   
   # Update frontend/.env
   VITE_API_URL=http://localhost:5001/api
   ```

### Issue 6: "JWT secrets using default values"

**Symptoms:**
- Backend exits with JWT secret error
- Security warning about placeholders

**Solutions:**

```bash
# Generate two new secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET in backend/.env with both values
```

---

## Project Structure

```
DSA-MENTOR/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth & validation
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── scripts/         # Setup scripts
│   ├── utils/           # Helper functions
│   ├── .env             # Environment variables (create this!)
│   ├── .env.example     # Environment template
│   ├── package.json
│   ├── server.js        # Application entry
│   └── README.md        # Backend documentation
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   ├── hooks/       # Custom hooks
│   │   ├── styles/      # CSS files
│   │   └── utils/       # Helper functions
│   ├── .env             # Environment variables (create this!)
│   ├── .env.example     # Environment template
│   └── package.json
└── SETUP_GUIDE.md       # This file
```

---

## Running in Production

### Environment Variables

1. Set `NODE_ENV=production` in backend
2. Update `MONGO_URI` to production database
3. Update `CLIENT_URL` to production frontend URL
4. Update `VITE_API_URL` to production backend URL
5. Use strong, unique passwords
6. Enable HTTPS

### Security Checklist

- [ ] Changed default superadmin password
- [ ] Generated new JWT secrets
- [ ] Using HTTPS
- [ ] MongoDB has authentication enabled
- [ ] Environment variables are in secure vault (not in code)
- [ ] CORS is configured for production domain only
- [ ] Rate limiting is enabled
- [ ] Logs are monitored

---

## Additional Resources

- [Backend README](backend/README.md) - Detailed backend documentation
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)

---

## Support

If you encounter issues not covered in this guide:

1. Check all environment variables are set correctly
2. Verify MongoDB is running and accessible
3. Check server logs for error messages
4. Ensure all dependencies are installed (`npm install`)
5. Try restarting both backend and frontend servers

---

## Summary of Commands

```bash
# Setup (one time)
cd backend && npm install && cp .env.example .env
# Edit .env with your values
npm run create-superadmin
cd ../frontend && npm install && cp .env.example .env

# Run (every time)
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Access
# Open http://localhost:5173/login in browser
```

---

## Success! 🎉

You should now have a fully functional DSA Mentor application running locally. Enjoy!
