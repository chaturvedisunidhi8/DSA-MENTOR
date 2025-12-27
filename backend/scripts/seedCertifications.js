const mongoose = require('mongoose');
const { Certification } = require('../models/Certification');
require('dotenv').config();

const certifications = [
  {
    title: 'Arrays & Strings Mastery',
    slug: 'arrays-strings-mastery',
    description: 'Master fundamental array and string manipulation techniques used in top tech companies. Covers sliding window, two pointers, prefix sums, and string algorithms.',
    category: 'DSA',
    difficulty: 'Intermediate',
    price: 500,
    currency: 'INR',
    duration: 90,
    passingScore: 70,
    prerequisites: ['Basic programming knowledge', 'Understanding of arrays and strings'],
    skills: ['Arrays', 'Strings', 'Sliding Window', 'Two Pointers', 'Hash Maps'],
    badgeImage: '/badges/arrays-strings.png',
    problems: [], // Will be populated with actual problem IDs
    isActive: true
  },
  {
    title: 'Dynamic Programming Expert',
    slug: 'dynamic-programming-expert',
    description: 'Become an expert in Dynamic Programming patterns. Master memoization, tabulation, and optimization techniques for solving complex problems efficiently.',
    category: 'DSA',
    difficulty: 'Advanced',
    price: 500,
    currency: 'INR',
    duration: 90,
    passingScore: 70,
    prerequisites: ['Strong understanding of recursion', 'Arrays mastery'],
    skills: ['Dynamic Programming', 'Memoization', 'Tabulation', 'Optimization'],
    badgeImage: '/badges/dp-expert.png',
    problems: [],
    isActive: true
  },
  {
    title: 'System Design Fundamentals',
    slug: 'system-design-fundamentals',
    description: 'Learn to design scalable distributed systems. Covers load balancing, caching, databases, microservices, and real-world system design patterns.',
    category: 'System Design',
    difficulty: 'Advanced',
    price: 1000,
    currency: 'INR',
    duration: 120,
    passingScore: 70,
    prerequisites: ['2+ years of development experience', 'Understanding of web architecture'],
    skills: ['System Design', 'Scalability', 'Load Balancing', 'Caching', 'Databases', 'Microservices'],
    badgeImage: '/badges/system-design.png',
    problems: [],
    isActive: true
  },
  {
    title: 'Trees & Graphs Certification',
    slug: 'trees-graphs-certification',
    description: 'Master tree and graph data structures. Learn traversals, shortest paths, MST, topological sort, and advanced graph algorithms.',
    category: 'DSA',
    difficulty: 'Intermediate',
    price: 500,
    currency: 'INR',
    duration: 90,
    passingScore: 70,
    prerequisites: ['Basic DSA knowledge', 'Understanding of recursion'],
    skills: ['Trees', 'Graphs', 'DFS', 'BFS', 'Dijkstra', 'Topological Sort'],
    badgeImage: '/badges/trees-graphs.png',
    problems: [],
    isActive: true
  },
  {
    title: 'Advanced Algorithms Expert',
    slug: 'advanced-algorithms-expert',
    description: 'Master advanced algorithmic techniques including backtracking, greedy algorithms, divide & conquer, and complex optimization problems.',
    category: 'DSA',
    difficulty: 'Expert',
    price: 750,
    currency: 'INR',
    duration: 120,
    passingScore: 75,
    prerequisites: ['Strong DSA foundation', 'Experience with medium-hard problems'],
    skills: ['Backtracking', 'Greedy Algorithms', 'Divide & Conquer', 'Advanced DP', 'Bit Manipulation'],
    badgeImage: '/badges/advanced-algorithms.png',
    problems: [],
    isActive: true
  }
];

async function seedCertifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing certifications
    await Certification.deleteMany({});
    console.log('Cleared existing certifications');

    // Insert new certifications
    const inserted = await Certification.insertMany(certifications);
    console.log(`✓ Created ${inserted.length} certifications:`);
    
    inserted.forEach(cert => {
      console.log(`  - ${cert.title} (₹${cert.price})`);
    });

    console.log('\n✓ Certification seeding completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Add problems to each certification via admin panel');
    console.log('2. Configure payment gateway (Razorpay/Stripe)');
    console.log('3. Design certificate templates');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding certifications:', error);
    process.exit(1);
  }
}

seedCertifications();
