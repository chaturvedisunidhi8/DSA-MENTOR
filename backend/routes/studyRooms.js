const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createStudyRoom,
  getAllStudyRooms,
  getStudyRoomDetails,
  joinStudyRoom,
  leaveStudyRoom,
  updateStudyRoom,
  getMyStudyRooms
} = require('../controllers/studyRoomController');

// Protected routes
router.post('/', auth, createStudyRoom);
router.get('/', getAllStudyRooms);
router.get('/my-rooms', auth, getMyStudyRooms);
router.get('/:slug', getStudyRoomDetails);
router.post('/:slug/join', auth, joinStudyRoom);
router.post('/:slug/leave', auth, leaveStudyRoom);
router.put('/:slug', auth, updateStudyRoom);

module.exports = router;
