const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentorController');
const { authenticate, checkPermission } = require('../middleware/auth');

// All mentor routes require authentication
router.use(authenticate);

// Mentor dashboard and student management
router.get('/dashboard', checkPermission('mentor:students'), mentorController.getMentorDashboard);
router.post('/students', checkPermission('mentor:students'), mentorController.addStudent);
router.delete('/students/:studentId', checkPermission('mentor:students'), mentorController.removeStudent);
router.get('/students/:studentId/progress', checkPermission('mentor:students'), mentorController.getStudentProgress);
router.get('/students/comparison', checkPermission('mentor:students'), mentorController.getStudentComparison);

// Assignment features
router.post('/assign-track', checkPermission('mentor:assignments'), mentorController.assignTrack);
router.post('/assign-problems', checkPermission('mentor:assignments'), mentorController.assignProblems);

module.exports = router;
