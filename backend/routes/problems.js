const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const checkRole = require("../middleware/roleCheck");
const {
  getAllProblems,
  getProblemBySlug,
  createProblem,
  updateProblem,
  deleteProblem,
  getAllProblemsAdmin,
  getProblemStats,
} = require("../controllers/problemController");
// Public routes (authenticated users)
router.get("/", authenticate, getAllProblems);
router.get("/stats", authenticate, getProblemStats);
router.get("/:slug", authenticate, getProblemBySlug);
// Admin routes
router.get("/admin/all", authenticate, checkRole("superadmin"), getAllProblemsAdmin);
router.post("/", authenticate, checkRole("superadmin"), createProblem);
router.put("/:id", authenticate, checkRole("superadmin"), updateProblem);
router.delete("/:id", authenticate, checkRole("superadmin"), deleteProblem);
module.exports = router;
