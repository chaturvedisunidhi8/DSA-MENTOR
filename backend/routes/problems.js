const express = require("express");
const router = express.Router();
const { authenticate, checkPermission } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  getAllProblems,
  getProblemBySlug,
  createProblem,
  updateProblem,
  deleteProblem,
  getAllProblemsAdmin,
  getProblemStats,
  runProblem,
  submitProblem,
  reportInterview,
  getInterviewFrequency,
  bulkUploadProblems,
} = require("../controllers/problemController");

// Public routes (authenticated users with read permission)
router.get("/", authenticate, checkPermission("read:problems"), getAllProblems);
router.get("/stats", authenticate, checkPermission("read:problems"), getProblemStats);
router.get("/:slug", authenticate, checkPermission("read:problems"), getProblemBySlug);
router.get("/:slug/frequency", getInterviewFrequency); // Public - no auth required
router.post("/:slug/run", authenticate, checkPermission("read:problems"), runProblem);
router.post("/:slug/submit", authenticate, checkPermission("read:problems"), submitProblem);
router.post("/:slug/report-interview", authenticate, reportInterview);

// Admin routes (permission-based)
router.get("/admin/all", authenticate, checkPermission("read:problems"), getAllProblemsAdmin);
router.post("/bulk-upload", authenticate, checkPermission("create:problems"), upload.single("bulkFile"), bulkUploadProblems);
router.post("/", authenticate, checkPermission("create:problems"), createProblem);
router.put("/:id", authenticate, checkPermission("update:problems"), updateProblem);
router.delete("/:id", authenticate, checkPermission("delete:problems"), deleteProblem);

module.exports = router;
