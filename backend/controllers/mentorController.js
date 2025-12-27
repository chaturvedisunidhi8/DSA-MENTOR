const User = require('../models/User');
const Problem = require('../models/Problem');
const CareerTrack = require('../models/CareerTrack').CareerTrack;
const UserTrackProgress = require('../models/CareerTrack').UserTrackProgress;

/**
 * Get mentor dashboard overview
 * @route GET /api/mentor/dashboard
 */
exports.getMentorDashboard = async (req, res) => {
  try {
    const mentorId = req.user.userId;

    const mentor = await User.findById(mentorId)
      .populate('mentorInfo.students', 'username fullName email problemsSolved accuracy currentStreak')
      .lean();

    if (!mentor || mentor.role !== 'mentor') {
      return res.status(403).json({ message: 'Access denied. Mentor role required.' });
    }

    const students = mentor.mentorInfo.students || [];
    
    // Calculate aggregate stats
    const totalStudents = students.length;
    const avgProblemsolved = students.reduce((sum, s) => sum + (s.problemsSolved || 0), 0) / totalStudents || 0;
    const avgAccuracy = students.reduce((sum, s) => sum + (s.accuracy || 0), 0) / totalStudents || 0;
    const activeStudents = students.filter(s => s.currentStreak > 0).length;

    res.json({
      mentor: {
        organization: mentor.mentorInfo.organization,
        specializations: mentor.mentorInfo.specializations,
        yearsOfExperience: mentor.mentorInfo.yearsOfExperience,
        isVerified: mentor.mentorInfo.isVerified
      },
      stats: {
        totalStudents,
        activeStudents,
        avgProblemsSolved: Math.round(avgProblemsolved),
        avgAccuracy: Math.round(avgAccuracy * 10) / 10
      },
      students: students.map(s => ({
        _id: s._id,
        username: s.username,
        fullName: s.fullName,
        email: s.email,
        problemsSolved: s.problemsSolved || 0,
        accuracy: s.accuracy || 0,
        currentStreak: s.currentStreak || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching mentor dashboard:', error);
    res.status(500).json({ message: 'Failed to fetch mentor dashboard', error: error.message });
  }
};

/**
 * Add student to mentor's roster
 * @route POST /api/mentor/students
 */
exports.addStudent = async (req, res) => {
  try {
    const mentorId = req.user.userId;
    const { studentEmail } = req.body;

    if (!studentEmail) {
      return res.status(400).json({ message: 'Student email is required' });
    }

    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(403).json({ message: 'Access denied. Mentor role required.' });
    }

    const student = await User.findOne({ email: studentEmail, role: 'client' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found or not a client user' });
    }

    // Check if student already added
    if (mentor.mentorInfo.students.includes(student._id)) {
      return res.status(400).json({ message: 'Student already in your roster' });
    }

    mentor.mentorInfo.students.push(student._id);
    await mentor.save();

    res.json({
      message: 'Student added successfully',
      student: {
        _id: student._id,
        username: student.username,
        fullName: student.fullName,
        email: student.email
      }
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ message: 'Failed to add student', error: error.message });
  }
};

/**
 * Remove student from mentor's roster
 * @route DELETE /api/mentor/students/:studentId
 */
exports.removeStudent = async (req, res) => {
  try {
    const mentorId = req.user.userId;
    const { studentId } = req.params;

    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(403).json({ message: 'Access denied. Mentor role required.' });
    }

    mentor.mentorInfo.students = mentor.mentorInfo.students.filter(
      id => id.toString() !== studentId
    );
    await mentor.save();

    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    console.error('Error removing student:', error);
    res.status(500).json({ message: 'Failed to remove student', error: error.message });
  }
};

/**
 * Get detailed progress for a specific student
 * @route GET /api/mentor/students/:studentId/progress
 */
exports.getStudentProgress = async (req, res) => {
  try {
    const mentorId = req.user.userId;
    const { studentId } = req.params;

    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(403).json({ message: 'Access denied. Mentor role required.' });
    }

    // Verify student belongs to this mentor
    if (!mentor.mentorInfo.students.some(id => id.toString() === studentId)) {
      return res.status(403).json({ message: 'This student is not in your roster' });
    }

    const student = await User.findById(studentId)
      .select('username fullName email problemsSolved accuracy solvedProblems currentStreak longestStreak interviewsCompleted achievements')
      .lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get career track progress
    const trackProgress = await UserTrackProgress.find({ userId: studentId })
      .populate('trackId', 'title slug difficulty')
      .lean();

    // Analyze problems solved by difficulty and topic
    const problemStats = {
      byDifficulty: {
        easy: student.solvedProblems.filter(p => p.difficulty === 'Easy').length,
        medium: student.solvedProblems.filter(p => p.difficulty === 'Medium').length,
        hard: student.solvedProblems.filter(p => p.difficulty === 'Hard').length
      },
      byTopic: {}
    };

    student.solvedProblems.forEach(p => {
      if (p.topic) {
        problemStats.byTopic[p.topic] = (problemStats.byTopic[p.topic] || 0) + 1;
      }
    });

    res.json({
      student: {
        _id: student._id,
        username: student.username,
        fullName: student.fullName,
        email: student.email,
        problemsSolved: student.problemsSolved,
        accuracy: student.accuracy,
        currentStreak: student.currentStreak,
        longestStreak: student.longestStreak,
        interviewsCompleted: student.interviewsCompleted,
        achievements: student.achievements
      },
      problemStats,
      trackProgress: trackProgress.map(tp => ({
        track: tp.trackId,
        enrolledAt: tp.enrolledAt,
        lastActivityAt: tp.lastActivityAt,
        completionPercentage: tp.completionPercentage,
        completedLessons: tp.progress.filter(p => p.completed).length,
        totalLessons: tp.progress.length
      }))
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({ message: 'Failed to fetch student progress', error: error.message });
  }
};

/**
 * Assign career track to student(s)
 * @route POST /api/mentor/assign-track
 */
exports.assignTrack = async (req, res) => {
  try {
    const mentorId = req.user.userId;
    const { studentIds, trackSlug } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Student IDs array is required' });
    }

    if (!trackSlug) {
      return res.status(400).json({ message: 'Track slug is required' });
    }

    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(403).json({ message: 'Access denied. Mentor role required.' });
    }

    // Verify all students belong to this mentor
    const invalidStudents = studentIds.filter(
      id => !mentor.mentorInfo.students.some(sid => sid.toString() === id)
    );

    if (invalidStudents.length > 0) {
      return res.status(403).json({ 
        message: 'Some students are not in your roster',
        invalidStudents
      });
    }

    const track = await CareerTrack.findOne({ slug: trackSlug });
    if (!track) {
      return res.status(404).json({ message: 'Career track not found' });
    }

    // Enroll students in the track
    const enrollResults = await Promise.all(
      studentIds.map(async (studentId) => {
        const existingProgress = await UserTrackProgress.findOne({
          userId: studentId,
          trackId: track._id
        });

        if (existingProgress) {
          return { studentId, status: 'already_enrolled' };
        }

        // Create progress entry with all lessons
        const allLessons = track.modules.flatMap(module => 
          module.lessons.map(lesson => ({
            lessonId: lesson._id,
            completed: false,
            score: 0
          }))
        );

        await UserTrackProgress.create({
          userId: studentId,
          trackId: track._id,
          progress: allLessons,
          unlockedModules: [track.modules[0]._id] // Unlock first module
        });

        return { studentId, status: 'enrolled' };
      })
    );

    res.json({
      message: 'Track assignment completed',
      track: {
        _id: track._id,
        title: track.title,
        slug: track.slug
      },
      results: enrollResults
    });
  } catch (error) {
    console.error('Error assigning track:', error);
    res.status(500).json({ message: 'Failed to assign track', error: error.message });
  }
};

/**
 * Assign specific problems to student(s)
 * @route POST /api/mentor/assign-problems
 */
exports.assignProblems = async (req, res) => {
  try {
    const mentorId = req.user.userId;
    const { studentIds, problemIds, dueDate } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Student IDs array is required' });
    }

    if (!problemIds || !Array.isArray(problemIds) || problemIds.length === 0) {
      return res.status(400).json({ message: 'Problem IDs array is required' });
    }

    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(403).json({ message: 'Access denied. Mentor role required.' });
    }

    // Verify all students belong to this mentor
    const invalidStudents = studentIds.filter(
      id => !mentor.mentorInfo.students.some(sid => sid.toString() === id)
    );

    if (invalidStudents.length > 0) {
      return res.status(403).json({ 
        message: 'Some students are not in your roster',
        invalidStudents
      });
    }

    // Verify problems exist
    const problems = await Problem.find({ _id: { $in: problemIds } })
      .select('title difficulty topic');

    if (problems.length !== problemIds.length) {
      return res.status(404).json({ message: 'Some problems not found' });
    }

    // In a full implementation, you'd create an Assignment model to track these
    // For now, we'll return success with the assignment details
    res.json({
      message: 'Problems assigned successfully',
      assignment: {
        students: studentIds.length,
        problems: problems.map(p => ({
          _id: p._id,
          title: p.title,
          difficulty: p.difficulty,
          topic: p.topic
        })),
        dueDate: dueDate || null,
        assignedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error assigning problems:', error);
    res.status(500).json({ message: 'Failed to assign problems', error: error.message });
  }
};

/**
 * Get comparison stats for all students
 * @route GET /api/mentor/students/comparison
 */
exports.getStudentComparison = async (req, res) => {
  try {
    const mentorId = req.user.userId;

    const mentor = await User.findById(mentorId)
      .populate('mentorInfo.students', 'username fullName problemsSolved accuracy currentStreak interviewsCompleted')
      .lean();

    if (!mentor || mentor.role !== 'mentor') {
      return res.status(403).json({ message: 'Access denied. Mentor role required.' });
    }

    const students = mentor.mentorInfo.students || [];

    // Sort by different metrics
    const comparison = {
      byProblems: [...students].sort((a, b) => (b.problemsSolved || 0) - (a.problemsSolved || 0)),
      byAccuracy: [...students].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0)),
      byStreak: [...students].sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0)),
      byInterviews: [...students].sort((a, b) => (b.interviewsCompleted || 0) - (a.interviewsCompleted || 0))
    };

    res.json(comparison);
  } catch (error) {
    console.error('Error fetching student comparison:', error);
    res.status(500).json({ message: 'Failed to fetch student comparison', error: error.message });
  }
};
