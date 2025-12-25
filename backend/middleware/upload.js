const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directories exist
const resumeUploadDir = path.join(__dirname, "../uploads/resumes");
const profileUploadDir = path.join(__dirname, "../uploads/profiles");

if (!fs.existsSync(resumeUploadDir)) {
  fs.mkdirSync(resumeUploadDir, { recursive: true });
}
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on fieldname
    if (file.fieldname === "profilePicture") {
      cb(null, profileUploadDir);
    } else {
      cb(null, resumeUploadDir);
    }
  },
  filename: function (req, file, cb) {
    // Create unique filename: userId-timestamp-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `${req.user._id}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// File filter - accept PDF for resumes and images for profile pictures
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "resume") {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only PDF files are allowed for resumes."),
        false
      );
    }
  } else if (file.fieldname === "profilePicture") {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only JPG, PNG, and GIF images are allowed."),
        false
      );
    }
  } else {
    cb(null, true);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = upload;
