const StudyRoom = require('../models/StudyRoom');
const User = require('../models/User');
const Problem = require('../models/Problem');
const crypto = require('crypto');

/**
 * Create a new study room
 * @route POST /api/study-rooms
 */
exports.createStudyRoom = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, type, maxParticipants, problemSlug, language } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }
    
    // Generate unique slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    const slug = `${baseSlug}-${randomSuffix}`;
    
    // Get problem if provided
    let problem = null;
    if (problemSlug) {
      const foundProblem = await Problem.findOne({ slug: problemSlug });
      if (foundProblem) {
        problem = {
          problemId: foundProblem._id,
          title: foundProblem.title,
          slug: foundProblem.slug
        };
      }
    }
    
    // Generate invite code for private/invite-only rooms
    let inviteCode = null;
    if (type === 'private' || type === 'invite-only') {
      inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    }
    
    const studyRoom = await StudyRoom.create({
      name,
      slug,
      description,
      createdBy: userId,
      type: type || 'public',
      maxParticipants: maxParticipants || 10,
      currentParticipants: [{
        userId,
        role: 'owner'
      }],
      problem,
      language: language || 'javascript',
      inviteCode,
      expiresAt: new Date(Date.now() + 24 * 60 * 60000) // 24 hours
    });
    
    res.json({
      message: 'Study room created successfully',
      studyRoom: {
        _id: studyRoom._id,
        name: studyRoom.name,
        slug: studyRoom.slug,
        inviteCode: studyRoom.inviteCode
      }
    });
  } catch (error) {
    console.error('Error creating study room:', error);
    res.status(500).json({ message: 'Failed to create study room', error: error.message });
  }
};

/**
 * Get all active study rooms
 * @route GET /api/study-rooms
 */
exports.getAllStudyRooms = async (req, res) => {
  try {
    const { type, tag } = req.query;
    
    const filter = {
      status: 'active',
      type: { $in: ['public'] },
      expiresAt: { $gt: new Date() }
    };
    
    if (type) filter.type = type;
    if (tag) filter.tags = tag;
    
    const studyRooms = await StudyRoom.find(filter)
      .populate('createdBy', 'username fullName profilePicture')
      .populate('currentParticipants.userId', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    res.json({ studyRooms });
  } catch (error) {
    console.error('Error fetching study rooms:', error);
    res.status(500).json({ message: 'Failed to fetch study rooms', error: error.message });
  }
};

/**
 * Get study room details
 * @route GET /api/study-rooms/:slug
 */
exports.getStudyRoomDetails = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user?.userId;
    
    const studyRoom = await StudyRoom.findOne({ slug })
      .populate('createdBy', 'username fullName profilePicture')
      .populate('currentParticipants.userId', 'username fullName profilePicture')
      .populate('problem.problemId')
      .lean();
    
    if (!studyRoom) {
      return res.status(404).json({ message: 'Study room not found' });
    }
    
    // Check if user is a participant
    const isParticipant = studyRoom.currentParticipants.some(
      p => p.userId._id.toString() === userId
    );
    
    // Don't show chat history and code to non-participants in private rooms
    if (!isParticipant && studyRoom.type !== 'public') {
      return res.status(403).json({ message: 'This is a private study room' });
    }
    
    res.json({ studyRoom, isParticipant });
  } catch (error) {
    console.error('Error fetching study room:', error);
    res.status(500).json({ message: 'Failed to fetch study room', error: error.message });
  }
};

/**
 * Join a study room
 * @route POST /api/study-rooms/:slug/join
 */
exports.joinStudyRoom = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId;
    const { inviteCode } = req.body;
    
    const studyRoom = await StudyRoom.findOne({ slug });
    
    if (!studyRoom) {
      return res.status(404).json({ message: 'Study room not found' });
    }
    
    if (studyRoom.status !== 'active') {
      return res.status(400).json({ message: 'Study room is not active' });
    }
    
    if (studyRoom.isLocked) {
      return res.status(400).json({ message: 'Study room is locked' });
    }
    
    // Check if room is full
    if (studyRoom.currentParticipants.length >= studyRoom.maxParticipants) {
      return res.status(400).json({ message: 'Study room is full' });
    }
    
    // Check if already a participant
    const isAlreadyParticipant = studyRoom.currentParticipants.some(
      p => p.userId.toString() === userId
    );
    
    if (isAlreadyParticipant) {
      return res.status(400).json({ message: 'Already in this study room' });
    }
    
    // Verify invite code for private rooms
    if ((studyRoom.type === 'private' || studyRoom.type === 'invite-only') && 
        studyRoom.inviteCode !== inviteCode) {
      return res.status(403).json({ message: 'Invalid invite code' });
    }
    
    // Add participant
    studyRoom.currentParticipants.push({
      userId,
      role: 'participant'
    });
    
    await studyRoom.save();
    
    res.json({ message: 'Successfully joined study room' });
  } catch (error) {
    console.error('Error joining study room:', error);
    res.status(500).json({ message: 'Failed to join study room', error: error.message });
  }
};

/**
 * Leave a study room
 * @route POST /api/study-rooms/:slug/leave
 */
exports.leaveStudyRoom = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId;
    
    const studyRoom = await StudyRoom.findOne({ slug });
    
    if (!studyRoom) {
      return res.status(404).json({ message: 'Study room not found' });
    }
    
    // Check if user is owner
    if (studyRoom.createdBy.toString() === userId) {
      // If owner leaves, close the room or transfer ownership
      studyRoom.status = 'closed';
    } else {
      // Remove participant
      studyRoom.currentParticipants = studyRoom.currentParticipants.filter(
        p => p.userId.toString() !== userId
      );
    }
    
    await studyRoom.save();
    
    res.json({ message: 'Successfully left study room' });
  } catch (error) {
    console.error('Error leaving study room:', error);
    res.status(500).json({ message: 'Failed to leave study room', error: error.message });
  }
};

/**
 * Update study room settings
 * @route PUT /api/study-rooms/:slug
 */
exports.updateStudyRoom = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.userId;
    const updates = req.body;
    
    const studyRoom = await StudyRoom.findOne({ slug });
    
    if (!studyRoom) {
      return res.status(404).json({ message: 'Study room not found' });
    }
    
    // Check if user is owner or moderator
    const participant = studyRoom.currentParticipants.find(
      p => p.userId.toString() === userId
    );
    
    if (!participant || (participant.role !== 'owner' && participant.role !== 'moderator')) {
      return res.status(403).json({ message: 'Only owner or moderators can update settings' });
    }
    
    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'maxParticipants', 'tags', 'isLocked', 'language'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        studyRoom[field] = updates[field];
      }
    });
    
    await studyRoom.save();
    
    res.json({ message: 'Study room updated successfully', studyRoom });
  } catch (error) {
    console.error('Error updating study room:', error);
    res.status(500).json({ message: 'Failed to update study room', error: error.message });
  }
};

/**
 * Get user's study rooms
 * @route GET /api/study-rooms/my-rooms
 */
exports.getMyStudyRooms = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const studyRooms = await StudyRoom.find({
      'currentParticipants.userId': userId,
      status: { $in: ['active', 'paused'] }
    })
    .populate('createdBy', 'username fullName')
    .populate('currentParticipants.userId', 'username')
    .sort({ updatedAt: -1 })
    .lean();
    
    res.json({ studyRooms });
  } catch (error) {
    console.error('Error fetching my study rooms:', error);
    res.status(500).json({ message: 'Failed to fetch study rooms', error: error.message });
  }
};

module.exports = exports;
