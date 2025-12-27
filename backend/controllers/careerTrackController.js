const { CareerTrack, UserTrackProgress } = require('../models/CareerTrack');
const Problem = require('../models/Problem');
const User = require('../models/User');
const { checkAndUnlockAchievements } = require('./achievementController');

// Get all career tracks (with filters)
exports.getAllTracks = async (req, res) => {
  try {
    const { category, difficulty, isPremium, tag, search, sort = '-enrollmentCount' } = req.query;
    
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (isPremium !== undefined) filter.isPremium = isPremium === 'true';
    if (tag) filter.tags = tag;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { targetRole: { $regex: search, $options: 'i' } }
      ];
    }
    
    const tracks = await CareerTrack.find(filter)
      .select('-modules.lessons.problemId.solution -modules.lessons.problemId.hiddenTestCases')
      .sort(sort)
      .lean();
    
    // If user is authenticated, include their progress
    if (req.user) {
      const progressData = await UserTrackProgress.find({
        userId: req.user._id,
        trackId: { $in: tracks.map(t => t._id) }
      }).lean();
      
      const progressMap = {};
      progressData.forEach(p => {
        progressMap[p.trackId.toString()] = p;
      });
      
      tracks.forEach(track => {
        track.userProgress = progressMap[track._id.toString()] || null;
      });
    }
    
    res.json({
      success: true,
      count: tracks.length,
      tracks
    });
  } catch (error) {
    console.error('Error fetching career tracks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch career tracks',
      error: error.message
    });
  }
};

// Get single track with full details
exports.getTrackBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const track = await CareerTrack.findOne({ slug, isActive: true })
      .populate({
        path: 'modules.lessons.problemId',
        select: '-solution -hiddenTestCases'
      })
      .lean();
    
    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Career track not found'
      });
    }
    
    // Get user progress if authenticated
    let userProgress = null;
    let unlockedModuleIds = [];
    
    if (req.user) {
      userProgress = await UserTrackProgress.findOne({
        userId: req.user._id,
        trackId: track._id
      }).lean();
      
      if (userProgress) {
        unlockedModuleIds = userProgress.unlockedModules.map(m => m.moduleId.toString());
      }
    }
    
    // Determine which modules are unlocked
    track.modules.forEach((module, index) => {
      const moduleId = module._id.toString();
      
      // Check if module is unlocked based on requirements
      let isUnlocked = false;
      
      if (module.unlockRequirement.type === 'always_unlocked') {
        isUnlocked = true;
      } else if (userProgress) {
        if (unlockedModuleIds.includes(moduleId)) {
          isUnlocked = true;
        } else if (module.unlockRequirement.type === 'module_completed') {
          const prereqModuleId = module.unlockRequirement.moduleId?.toString();
          const isPrereqCompleted = userProgress.completedModules.some(
            cm => cm.moduleId.toString() === prereqModuleId
          );
          isUnlocked = isPrereqCompleted;
        }
      }
      
      module.isUnlocked = isUnlocked;
      
      // Add completion status for lessons
      if (userProgress) {
        module.lessons.forEach(lesson => {
          const isCompleted = userProgress.completedLessons.some(
            cl => cl.lessonId.toString() === lesson._id.toString()
          );
          lesson.isCompleted = isCompleted;
        });
      }
    });
    
    res.json({
      success: true,
      track,
      userProgress
    });
  } catch (error) {
    console.error('Error fetching track:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch career track',
      error: error.message
    });
  }
};

// Enroll in a track
exports.enrollInTrack = async (req, res) => {
  try {
    const { trackId } = req.params;
    const userId = req.user._id;
    
    const track = await CareerTrack.findById(trackId);
    if (!track || !track.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Career track not found'
      });
    }
    
    // Check if already enrolled
    let progress = await UserTrackProgress.findOne({ userId, trackId });
    
    if (progress) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this track'
      });
    }
    
    // Create progress record
    progress = new UserTrackProgress({
      userId,
      trackId,
      status: 'enrolled'
    });
    
    // Unlock first module (or all modules with 'always_unlocked')
    const unlockedModules = track.modules
      .filter(m => m.unlockRequirement.type === 'always_unlocked')
      .map(m => ({ moduleId: m._id }));
    
    progress.unlockedModules = unlockedModules;
    
    await progress.save();
    
    // Increment enrollment count
    track.enrollmentCount += 1;
    await track.save();
    
    res.json({
      success: true,
      message: 'Successfully enrolled in track',
      progress
    });
  } catch (error) {
    console.error('Error enrolling in track:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in track',
      error: error.message
    });
  }
};

// Mark lesson as completed
exports.completeLesson = async (req, res) => {
  try {
    const { trackId, moduleId, lessonId } = req.params;
    const { score, timeSpent } = req.body;
    const userId = req.user._id;
    
    const progress = await UserTrackProgress.findOne({ userId, trackId });
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Not enrolled in this track'
      });
    }
    
    const track = await CareerTrack.findById(trackId);
    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found'
      });
    }
    
    // Find the module and lesson
    const module = track.modules.id(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }
    
    const lesson = module.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }
    
    // Check if already completed
    const alreadyCompleted = progress.completedLessons.some(
      cl => cl.lessonId.toString() === lessonId
    );
    
    if (!alreadyCompleted) {
      progress.completedLessons.push({
        lessonId,
        problemId: lesson.problemId,
        completedAt: new Date(),
        score: score || 0,
        timeSpent: timeSpent || 0
      });
      
      progress.totalTimeSpent += timeSpent || 0;
      progress.status = 'in-progress';
    }
    
    // Check if module is completed
    const moduleLessons = module.lessons.map(l => l._id.toString());
    const completedModuleLessons = progress.completedLessons.filter(
      cl => moduleLessons.includes(cl.lessonId.toString())
    );
    
    if (completedModuleLessons.length === moduleLessons.length) {
      // Module completed
      const moduleAlreadyCompleted = progress.completedModules.some(
        cm => cm.moduleId.toString() === moduleId
      );
      
      if (!moduleAlreadyCompleted) {
        progress.completedModules.push({
          moduleId,
          completedAt: new Date()
        });
        
        // Unlock next modules based on prerequisites
        track.modules.forEach(mod => {
          if (mod.unlockRequirement.type === 'module_completed' &&
              mod.unlockRequirement.moduleId?.toString() === moduleId) {
            const alreadyUnlocked = progress.unlockedModules.some(
              um => um.moduleId.toString() === mod._id.toString()
            );
            if (!alreadyUnlocked) {
              progress.unlockedModules.push({ moduleId: mod._id });
            }
          }
        });
      }
    }
    
    // Check if entire track is completed
    const totalLessons = track.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
    if (progress.completedLessons.length === totalLessons) {
      progress.status = 'completed';
      progress.completedAt = new Date();
      
      // Increment track completion count
      track.completionCount += 1;
      await track.save();
      
      // Check for achievements
      await checkAndUnlockAchievements(userId);
    }
    
    await progress.save();
    
    res.json({
      success: true,
      message: 'Lesson marked as completed',
      progress
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete lesson',
      error: error.message
    });
  }
};

// Get user's enrolled tracks
exports.getMyTracks = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;
    
    const filter = { userId };
    if (status) filter.status = status;
    
    const progressRecords = await UserTrackProgress.find(filter)
      .populate('trackId')
      .sort('-updatedAt')
      .lean();
    
    const tracks = progressRecords.map(p => {
      const track = p.trackId;
      const totalLessons = track.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
      const completionPercentage = totalLessons > 0 
        ? Math.round((p.completedLessons.length / totalLessons) * 100)
        : 0;
      
      return {
        ...track,
        userProgress: {
          ...p,
          completionPercentage
        }
      };
    });
    
    res.json({
      success: true,
      count: tracks.length,
      tracks
    });
  } catch (error) {
    console.error('Error fetching user tracks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your tracks',
      error: error.message
    });
  }
};

// Rate a track
exports.rateTrack = async (req, res) => {
  try {
    const { trackId } = req.params;
    const { score, review } = req.body;
    const userId = req.user._id;
    
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating score must be between 1 and 5'
      });
    }
    
    const progress = await UserTrackProgress.findOne({ userId, trackId });
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'You must be enrolled in this track to rate it'
      });
    }
    
    const track = await CareerTrack.findById(trackId);
    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found'
      });
    }
    
    const hadPreviousRating = progress.rating && progress.rating.score;
    const previousScore = hadPreviousRating ? progress.rating.score : 0;
    
    // Update user's rating
    progress.rating = {
      score,
      review: review || '',
      ratedAt: new Date()
    };
    await progress.save();
    
    // Update track's average rating
    if (hadPreviousRating) {
      // Update existing rating
      const totalScore = (track.rating.average * track.rating.count) - previousScore + score;
      track.rating.average = totalScore / track.rating.count;
    } else {
      // New rating
      const totalScore = (track.rating.average * track.rating.count) + score;
      track.rating.count += 1;
      track.rating.average = totalScore / track.rating.count;
    }
    
    await track.save();
    
    res.json({
      success: true,
      message: 'Track rated successfully',
      rating: progress.rating
    });
  } catch (error) {
    console.error('Error rating track:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate track',
      error: error.message
    });
  }
};

// Admin: Create a career track
exports.createTrack = async (req, res) => {
  try {
    const trackData = req.body;
    trackData.createdBy = req.user._id;
    
    const track = new CareerTrack(trackData);
    await track.save();
    
    res.status(201).json({
      success: true,
      message: 'Career track created successfully',
      track
    });
  } catch (error) {
    console.error('Error creating track:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create career track',
      error: error.message
    });
  }
};

// Admin: Update a career track
exports.updateTrack = async (req, res) => {
  try {
    const { trackId } = req.params;
    const updates = req.body;
    
    const track = await CareerTrack.findByIdAndUpdate(
      trackId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Track updated successfully',
      track
    });
  } catch (error) {
    console.error('Error updating track:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update track',
      error: error.message
    });
  }
};

// Admin: Delete a career track
exports.deleteTrack = async (req, res) => {
  try {
    const { trackId } = req.params;
    
    const track = await CareerTrack.findByIdAndUpdate(
      trackId,
      { isActive: false },
      { new: true }
    );
    
    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Track deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting track:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete track',
      error: error.message
    });
  }
};

// Get track statistics (admin)
exports.getTrackStats = async (req, res) => {
  try {
    const { trackId } = req.params;
    
    const track = await CareerTrack.findById(trackId);
    if (!track) {
      return res.status(404).json({
        success: false,
        message: 'Track not found'
      });
    }
    
    const progressRecords = await UserTrackProgress.find({ trackId });
    
    const stats = {
      enrollmentCount: track.enrollmentCount,
      completionCount: track.completionCount,
      completionRate: track.enrollmentCount > 0 
        ? Math.round((track.completionCount / track.enrollmentCount) * 100)
        : 0,
      activeUsers: progressRecords.filter(p => p.status === 'in-progress').length,
      averageRating: track.rating.average,
      ratingCount: track.rating.count,
      averageCompletionTime: 0 // Calculate from completed users
    };
    
    // Calculate average completion time
    const completedRecords = progressRecords.filter(p => p.status === 'completed');
    if (completedRecords.length > 0) {
      const totalTime = completedRecords.reduce((sum, p) => {
        return sum + (p.completedAt - p.enrolledAt);
      }, 0);
      stats.averageCompletionTime = Math.round(totalTime / completedRecords.length / (1000 * 60 * 60 * 24)); // days
    }
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching track stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch track statistics',
      error: error.message
    });
  }
};
