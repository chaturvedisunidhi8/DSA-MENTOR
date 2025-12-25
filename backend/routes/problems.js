const express = require("express");
const router = express.Router();
const { authenticate, checkPermission } = require("../middleware/auth");
const {
  getAllProblems,
  getProblemBySlug,
  createProblem,
  updateProblem,
  deleteProblem,
  getAllProblemsAdmin,
  getProblemStats,
} = require("../controllers/problemController");

// Public routes (authenticated users with read permission)
router.get("/", authenticate, checkPermission("read:problems"), getAllProblems);
router.get("/stats", authenticate, checkPermission("read:problems"), getProblemStats);
router.get("/:slug", authenticate, checkPermission("read:problems"), getProblemBySlug);

// Admin routes (permission-based)
router.get("/admin/all", authenticate, checkPermission("read:problems"), getAllProblemsAdmin);
router.post("/", authenticate, checkPermission("create:problems"), createProblem);
router.put("/:id", authenticate, checkPermission("update:problems"), updateProblem);
router.delete("/:id", authenticate, checkPermission("delete:problems"), deleteProblem);

module.exports = router;
