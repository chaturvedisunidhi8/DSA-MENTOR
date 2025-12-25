# Profile Picture Upload - Complete Implementation

## Changes Made

### Backend Changes

#### 1. User Model (`backend/models/User.js`)
- Added `profilePicture` field (String, stores full URL)
- Added `profilePictureUploadedAt` field (Date)

#### 2. Auth Controller (`backend/controllers/authController.js`)
- Added `uploadProfilePicture` function:
  - Accepts image file upload
  - Deletes old profile picture if exists
  - Saves new picture with full URL (e.g., `http://localhost:5000/uploads/profiles/filename.jpg`)
  - Returns updated user object with permissions
- Added `deleteProfilePicture` function:
  - Removes profile picture file from server
  - Clears profilePicture field from user
  - Returns updated user object

#### 3. Upload Middleware (`backend/middleware/upload.js`)
- Updated to handle both resumes and profile pictures
- Separate directories: `uploads/resumes/` and `uploads/profiles/`
- File validation:
  - Resumes: PDF only
  - Profile pictures: JPG, PNG, GIF (max 5MB)

#### 4. Auth Routes (`backend/routes/auth.js`)
- Added POST `/api/auth/profile/picture` - Upload profile picture
- Added DELETE `/api/auth/profile/picture` - Delete profile picture

### Frontend Changes

#### 1. API Utils (`frontend/src/utils/api.js`)
- Added `uploadProfilePicture` function
- Added `deleteProfilePicture` function

#### 2. Auth Context (`frontend/src/context/AuthContext.jsx`)
- Added `uploadProfilePicture` method
- Added `deleteProfilePicture` method
- Both update local user state and localStorage

#### 3. Settings Page (`frontend/src/pages/client/SettingsPage.jsx`)
- Added profile picture upload section
- Shows circular preview (120px)
- Auto-uploads on file selection
- Remove button to delete picture
- Updates preview when user changes

#### 4. Client Dashboard (`frontend/src/components/ClientDashboard.jsx`)
- Updated sidebar avatar to show profile picture
- Updated header avatar to show profile picture
- Falls back to initial if no picture uploaded

#### 5. CSS (`frontend/src/styles/Dashboard.css`)
- Added styles for `.user-avatar img` and `.avatar img`
- Proper circular display with `object-fit: cover`

## How to Test

### 1. Start Backend Server
```bash
cd backend
npm run dev
```

### 2. Start Frontend Server
```bash
cd frontend
npm run dev
```

### 3. Test Profile Picture Upload
1. Login to the application
2. Navigate to Settings
3. Click "Choose Picture" button
4. Select an image file (JPG, PNG, or GIF)
5. Image should immediately appear in the preview
6. Check browser console for upload logs
7. Verify image appears in:
   - Settings page preview
   - Sidebar avatar (bottom left)
   - Header avatar (top right)

### 4. Test Profile Picture Delete
1. Click "Remove" button on Settings page
2. Confirm the deletion
3. Avatar should revert to showing user initial
4. All avatars should update immediately

## Troubleshooting

### Image Not Showing After Upload
1. Check browser console for errors
2. Verify backend server is running on correct port
3. Check if `uploads/profiles/` directory exists in backend
4. Verify BASE_URL in backend .env file
5. Check network tab for upload request/response

### Upload Fails
1. Check file size (must be < 5MB)
2. Verify file type (JPG, PNG, or GIF only)
3. Check backend logs for errors
4. Verify multer middleware is working

### Images Not Loading
1. Verify static file serving is configured: `app.use("/uploads", express.static(...))`
2. Check CORS settings if frontend/backend on different ports
3. Verify uploaded files exist in `backend/uploads/profiles/`

## Environment Variables

Add to `backend/.env`:
```
BASE_URL=http://localhost:5000
PORT=5000
```

## File Structure
```
backend/
├── uploads/
│   ├── profiles/     # Profile pictures stored here
│   └── resumes/      # Resume PDFs stored here
└── ...

frontend/
└── src/
    ├── pages/client/
    │   └── SettingsPage.jsx   # Profile picture upload UI
    └── components/
        └── ClientDashboard.jsx # Displays avatars
```

## Success Indicators
- ✅ File upload completes without errors
- ✅ Success message shows "Profile picture updated successfully!"
- ✅ Preview updates with uploaded image
- ✅ Sidebar avatar shows uploaded image
- ✅ Header avatar shows uploaded image
- ✅ Image persists after page refresh
- ✅ Image URL is stored in user object in database
