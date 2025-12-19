# DSA Mentor - Backend Setup Guide

## Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher) - Must be running before starting the server
- **npm** or **yarn** package manager

## Initial Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/dsa-mentor

# JWT Secrets (Generate secure random strings - see below)
ACCESS_TOKEN_SECRET=your_64_character_access_secret_here
REFRESH_TOKEN_SECRET=your_64_character_refresh_secret_here

# CORS Configuration
CLIENT_URL=http://localhost:5173

# Superadmin Credentials (Change these!)
SUPERADMIN_EMAIL=admin@dsamentor.com
SUPERADMIN_PASSWORD=SuperAdmin@123
SUPERADMIN_USERNAME=admin
```

#### Generating Secure JWT Secrets

Run this command twice to generate two different secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy each output to `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`.

### 3. Start MongoDB

Ensure MongoDB is running on your system:

**Linux/macOS:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

**Windows:**
```bash
net start MongoDB
```

**Verify MongoDB is running:**
```bash
mongosh
# Should connect without errors
```

### 4. Create Superadmin Account

Run the superadmin creation script:

```bash
npm run create-superadmin
```

This script will:
- Connect to your MongoDB database
- Create or update the superadmin account with credentials from `.env`
- Hash the password securely using bcrypt
- Confirm successful creation

**Expected Output:**
```
MongoDB connected...
Superadmin created/updated successfully!
Email: admin@dsamentor.com
Username: admin
Role: superadmin
```

### 5. Start the Development Server

```bash
npm run dev
```

The server should start on `http://localhost:5000`

**Expected Output:**
```
Server running on port 5000
MongoDB connected...
```

## Troubleshooting

### Issue: "MongoNetworkError: connect ECONNREFUSED"

**Cause:** MongoDB is not running

**Solution:**
1. Start MongoDB service (see step 3 above)
2. Verify MongoDB is running: `mongosh`
3. Check your `MONGO_URI` in `.env` matches your MongoDB connection string

### Issue: "Error: Cannot find module 'dotenv'"

**Cause:** Dependencies not installed

**Solution:**
```bash
npm install
```

### Issue: "TypeError: Cannot read property 'ACCESS_TOKEN_SECRET' of undefined"

**Cause:** Missing `.env` file or missing environment variables

**Solution:**
1. Ensure `.env` file exists in `backend/` directory
2. Verify all required variables are present (see step 2)
3. Restart the server after creating/editing `.env`

### Issue: "Error: Port 5000 already in use"

**Cause:** Another process is using port 5000

**Solution:**
1. Change `PORT` in `.env` to a different number (e.g., 5001)
2. Update `VITE_API_URL` in frontend `.env` to match
3. Or kill the process using port 5000:
   ```bash
   # Linux/macOS
   lsof -ti:5000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

### Issue: Cannot login with superadmin credentials

**Causes & Solutions:**

1. **Superadmin not created**
   - Run: `npm run create-superadmin`
   - Check for success message

2. **Wrong credentials**
   - Verify credentials in `.env` match what you're entering
   - Email and password are case-sensitive

3. **Database connection issues**
   - Check MongoDB is running: `mongosh`
   - Verify `MONGO_URI` in `.env`

4. **CORS errors (frontend can't reach backend)**
   - Ensure `CLIENT_URL` in backend `.env` matches frontend URL
   - Default: `http://localhost:5173`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with nodemon |
| `npm start` | Start production server |
| `npm run create-superadmin` | Create/update superadmin account |
| `node scripts/resetAdmin.js` | Hard reset admin account to defaults |

## API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `POST /auth/refresh` - Refresh access token
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

### Problems (Client)
- `GET /problems` - Get all problems
- `GET /problems/:id` - Get problem by ID
- `POST /problems/:id/submit` - Submit problem solution

### Interviews (Client)
- `POST /interview/setup` - Setup interview session
- `GET /interview/:sessionId` - Get interview details
- `POST /interview/:sessionId/submit` - Submit interview solution

### Admin Routes
- `GET /dashboard/stats` - Get dashboard statistics (superadmin only)

## Security Recommendations

### For Production Deployment:

1. **Change Default Credentials**
   - Immediately change superadmin password after first login
   - Use strong passwords (min 12 characters, mixed case, numbers, symbols)

2. **Secure JWT Secrets**
   - Generate new secrets for production
   - Never commit `.env` to version control
   - Use environment variable management (e.g., AWS Secrets Manager)

3. **Database Security**
   - Use MongoDB authentication
   - Example: `mongodb://username:password@host:port/database`
   - Enable SSL/TLS for database connections

4. **HTTPS**
   - Deploy behind HTTPS (use Let's Encrypt, Cloudflare, etc.)
   - Update `CLIENT_URL` to use `https://`

5. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use proper secret management for cloud deployments

## Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   ├── authController.js  # Authentication logic
│   ├── interviewController.js
│   └── problemController.js
├── middleware/
│   ├── auth.js            # JWT verification
│   ├── roleCheck.js       # Role-based access control
│   └── upload.js          # File upload handling
├── models/
│   ├── User.js            # User schema (with password hashing)
│   ├── Problem.js
│   └── Interview.js
├── routes/
│   ├── auth.js            # Auth endpoints
│   ├── problems.js
│   ├── interview.js
│   └── dashboard.js
├── scripts/
│   ├── createSuperadmin.js  # Create superadmin account
│   └── resetAdmin.js        # Reset admin account
├── utils/
│   ├── tokenUtils.js      # JWT generation/verification
│   └── resumeParser.js
├── uploads/               # File upload storage
├── .env                   # Environment variables (create this!)
├── package.json
└── server.js              # Application entry point
```

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Verify all environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Check server logs for detailed error messages

## First Time Login

After completing the setup:

1. Navigate to: `http://localhost:5173/login` (frontend must be running)
2. Login with credentials from your `.env` file:
   - **Email:** Value from `SUPERADMIN_EMAIL`
   - **Password:** Value from `SUPERADMIN_PASSWORD`
3. You should be redirected to the superadmin dashboard
4. **Important:** Change your password immediately after first login!

## License

[Add your license information here]
