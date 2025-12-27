const express = require('express');
const router = express.Router();
const {
  getAllTracks,
  getTrackBySlug,
  enrollInTrack,
  completeLesson,
  getMyTracks,
  rateTrack,
  createTrack,
  updateTrack,
  deleteTrack,
  getTrackStats
} = require('../controllers/careerTrackController');
const { authenticate, checkPermission } = require('../middleware/auth');

// Public routes
router.get('/', getAllTracks);

// Authenticated user routes (specific routes before parameterized ones)
router.get('/my/enrolled', authenticate, getMyTracks);
router.post('/:trackId/enroll', authenticate, enrollInTrack);
router.post('/:trackId/modules/:moduleId/lessons/:lessonId/complete', authenticate, completeLesson);
router.post('/:trackId/rate', authenticate, rateTrack);

// Public parameterized routes (must come after specific routes)
router.get('/:slug', getTrackBySlug);

// Admin routes
router.post('/', authenticate, checkPermission('create:tracks'), createTrack);
router.put('/:trackId', authenticate, checkPermission('update:tracks'), updateTrack);
router.delete('/:trackId', authenticate, checkPermission('delete:tracks'), deleteTrack);
router.get('/:trackId/stats', authenticate, checkPermission('view:analytics'), getTrackStats);

module.exports = router;
