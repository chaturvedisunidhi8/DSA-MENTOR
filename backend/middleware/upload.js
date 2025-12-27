const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directories exist
const resumeUploadDir = path.join(__dirname, "../uploads/resumes");
const profileUploadDir = path.join(__dirname, "../uploads/profiles");
const bulkUploadDir = path.join(__dirname, "../uploads/bulk");

if (!fs.existsSync(resumeUploadDir)) {
  fs.mkdirSync(resumeUploadDir, { recursive: true });
}
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}
if (!fs.existsSync(bulkUploadDir)) {
  fs.mkdirSync(bulkUploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on fieldname
    if (file.fieldname === "profilePicture") {
      cb(null, profileUploadDir);
    } else if (file.fieldname === "bulkFile") {
      cb(null, bulkUploadDir);
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
  } else if (file.fieldname === "bulkFile") {
    const allowedTypes = [
      "text/csv",
      "application/json",
      "application/vnd.ms-excel",
      "text/plain"
    ];
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.endsWith('.csv') || 
        file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only CSV and JSON files are allowed for bulk upload."),
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
    fileSize: 10 * 1024 * 1024, // 10MB limit for bulk uploads
  },
});

module.exports = upload;
