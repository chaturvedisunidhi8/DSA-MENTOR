# 🚀 Quick Setup Reference Card

## Prerequisites
- Node.js (v14+)
- MongoDB (v4.4+)
- npm

## Setup Commands

### 1️⃣ Start MongoDB
```bash
# Linux
sudo systemctl start mongod

# macOS
brew services start mongodb-community

# Windows
net start MongoDB
```

### 2️⃣ Backend Setup
```bash
cd backend
npm install
cp .env.example .env

# Generate JWT secrets (run twice):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Edit .env and add the generated secrets
# Then create superadmin:
npm run create-superadmin

# Start server:
npm run dev
```

### 3️⃣ Frontend Setup (New Terminal)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 4️⃣ Login
- URL: http://localhost:5173/login
- Email: Check `backend/.env` → `SUPERADMIN_EMAIL`
- Password: Check `backend/.env` → `SUPERADMIN_PASSWORD`

## Default Credentials
```
Email: admin@dsamentor.com
Password: SuperAdmin@123 (or your custom value)
```

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect to server | Check if backend is running on port 5000 |
| Invalid credentials | Run `npm run create-superadmin` again |
| MongoDB error | Verify MongoDB is running: `mongosh` |
| Port in use | Kill process: `lsof -ti:5000 \| xargs kill -9` |
| Missing .env | Run `cp .env.example .env` |

## Health Check
```bash
# Backend health
curl http://localhost:5000/api/health

# MongoDB connection
mongosh

# Frontend
curl http://localhost:5173
```

## Important Files
- `backend/.env` - Backend configuration
- `frontend/.env` - Frontend configuration
- `backend/README.md` - Detailed backend docs
- `SETUP_GUIDE.md` - Complete setup guide

## Remember
✅ Change password after first login!
✅ Never commit .env files
✅ Use strong passwords in production
✅ Generate unique JWT secrets

---

**Need more help?** See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.
