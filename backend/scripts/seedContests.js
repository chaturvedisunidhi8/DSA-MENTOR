const mongoose = require('mongoose');
const { Contest } = require('../models/Contest');
require('dotenv').config();

// Helper to get next Saturday 8 PM IST
function getNextSaturday8PM() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  
  const nextSaturday = new Date(now);
  nextSaturday.setDate(now.getDate() + daysUntilSaturday);
  nextSaturday.setHours(20, 0, 0, 0); // 8 PM
  
  return nextSaturday;
}

const contests = [
  {
    title: 'Weekly Speed Challenge #1',
    slug: 'weekly-speed-challenge-1',
    description: 'Test your problem-solving speed with 3 carefully curated problems. Top 3 performers get special badges!',
    type: 'weekly',
    difficulty: 'Mixed',
    startTime: getNextSaturday8PM(),
    endTime: new Date(getNextSaturday8PM().getTime() + 90 * 60000), // 90 minutes
    duration: 90,
    problems: [], // Will be populated with actual problems
    rules: [
      'Contest duration: 90 minutes',
      'All submissions are final',
      'Wrong submissions add 10-minute penalty',
      'Cheating will result in disqualification',
      'Top 3 performers get badges'
    ],
    prizes: [
      { rank: 1, description: 'Gold Badge', badge: '🥇' },
      { rank: 2, description: 'Silver Badge', badge: '🥈' },
      { rank: 3, description: 'Bronze Badge', badge: '🥉' }
    ],
    isPublic: true,
    status: 'upcoming',
    registrationRequired: true,
    tags: ['weekly', 'speed', 'mixed-difficulty']
  },
  {
    title: 'Array Masters Contest',
    slug: 'array-masters-contest',
    description: 'Master array manipulation with challenging problems focusing on sliding window, two pointers, and advanced techniques.',
    type: 'special',
    difficulty: 'Medium',
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60000), // 7 days from now
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60000 + 120 * 60000), // 2 hours
    duration: 120,
    problems: [],
    rules: [
      'Contest duration: 120 minutes',
      'Focus on array problems',
      'All submissions are final',
      'Top 10 get recognition'
    ],
    prizes: [
      { rank: 1, description: 'Array Master Badge', badge: '🏆' },
      { rank: 2, description: 'Array Expert Badge', badge: '⭐' },
      { rank: 3, description: 'Array Specialist Badge', badge: '🌟' }
    ],
    isPublic: true,
    status: 'upcoming',
    registrationRequired: true,
    tags: ['arrays', 'medium', 'special']
  },
  {
    title: 'Dynamic Programming Championship',
    slug: 'dp-championship',
    description: 'Challenge yourself with advanced DP problems. Are you ready to optimize?',
    type: 'special',
    difficulty: 'Hard',
    startTime: new Date(Date.now() + 14 * 24 * 60 * 60000), // 14 days from now
    endTime: new Date(Date.now() + 14 * 24 * 60 * 60000 + 180 * 60000), // 3 hours
    duration: 180,
    problems: [],
    rules: [
      'Contest duration: 180 minutes',
      'Advanced DP problems only',
      'All submissions are final',
      'Top 5 get special recognition'
    ],
    prizes: [
      { rank: 1, description: 'DP Champion Badge', badge: '👑' },
      { rank: 2, description: 'DP Expert Badge', badge: '💎' },
      { rank: 3, description: 'DP Master Badge', badge: '✨' }
    ],
    isPublic: true,
    status: 'upcoming',
    registrationRequired: true,
    maxParticipants: 500,
    tags: ['dynamic-programming', 'hard', 'championship']
  }
];

async function seedContests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing contests
    await Contest.deleteMany({});
    console.log('Cleared existing contests');

    // Insert new contests
    const inserted = await Contest.insertMany(contests);
    console.log(`✓ Created ${inserted.length} contests:`);
    
    inserted.forEach(contest => {
      console.log(`  - ${contest.title}`);
      console.log(`    Start: ${contest.startTime.toLocaleString()}`);
      console.log(`    Duration: ${contest.duration} minutes`);
    });

    console.log('\n✓ Contest seeding completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Add problems to each contest via admin panel');
    console.log('2. Test registration and submission flow');
    console.log('3. Set up automated contest status updates');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding contests:', error);
    process.exit(1);
  }
}

seedContests();
