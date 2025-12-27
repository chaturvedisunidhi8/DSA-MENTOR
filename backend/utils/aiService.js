const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Check if OpenAI is configured
const isConfigured = () => {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0);
};

/**
 * Generate AI response for interview conversation
 * @param {Object} context - Interview context
 * @param {string} userMessage - User's message
 * @param {string} code - Current code (if any)
 * @returns {Promise<string>} AI response
 */
const generateAIResponse = async (context, userMessage, code = '') => {
  // Fallback to keyword-based responses if OpenAI not configured
  if (!isConfigured()) {
    console.warn('OpenAI API key not configured, using fallback responses');
    return generateFallbackResponse(userMessage, code);
  }

  try {
    const { problem, interviewType, conversationHistory = [] } = context;
    
    const systemPrompt = `You are an expert technical interviewer conducting a ${interviewType || 'mock'} coding interview.

Your role:
- Guide the candidate through solving: "${problem.title}"
- Ask clarifying questions about edge cases and constraints
- Provide hints when asked, but don't give away the full solution
- Encourage the candidate to think out loud
- Be supportive and professional
- Focus on problem-solving approach, not just code

Problem Description: ${problem.description}
Constraints: ${problem.constraints || 'Standard constraints'}

Guidelines:
- Don't provide complete solutions
- Ask probing questions to help candidates think through the problem
- Acknowledge good approaches and suggest improvements
- If candidate is stuck, offer small hints that guide rather than solve
- Keep responses concise (2-3 sentences)`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content
      })),
      {
        role: 'user',
        content: code 
          ? `${userMessage}\n\nMy current code:\n\`\`\`\n${code}\n\`\`\``
          : userMessage
      }
    ];

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateFallbackResponse(userMessage, code);
  }
};

/**
 * Generate code feedback using AI
 * @param {string} code - User's code
 * @param {string} language - Programming language
 * @param {Object} problem - Problem details
 * @param {Object} testResults - Test execution results
 * @returns {Promise<Object>} Feedback object
 */
const generateSolutionFeedback = async (code, language, problem, testResults) => {
  if (!isConfigured()) {
    console.warn('OpenAI API key not configured, using fallback feedback');
    return generateFallbackFeedback(testResults);
  }

  try {
    const prompt = `Analyze this ${language} solution for the coding problem: "${problem.title}"

Problem Description: ${problem.description}

Code:
\`\`\`${language}
${code}
\`\`\`

Test Results: ${testResults.passedTests}/${testResults.totalTests} passed
${testResults.success ? 'All tests passed!' : 'Some tests failed.'}

Provide feedback in JSON format with:
1. score (0-100): Based on correctness, code quality, and efficiency
2. strengths (array): 2-3 positive aspects of the solution
3. improvements (array): 2-3 suggestions for improvement (empty if perfect)
4. timeComplexity: Big O notation
5. spaceComplexity: Big O notation
6. feedback (string): 2-3 sentences of constructive feedback

Be specific and actionable. Focus on both correctness and code quality.`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert code reviewer providing technical feedback. Always respond with valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const feedback = JSON.parse(response.choices[0].message.content);
    
    // Validate feedback structure
    return {
      score: feedback.score || calculateBasicScore(testResults),
      strengths: feedback.strengths || ['Code compiles successfully'],
      improvements: feedback.improvements || [],
      timeComplexity: feedback.timeComplexity || 'O(n)',
      spaceComplexity: feedback.spaceComplexity || 'O(1)',
      feedback: feedback.feedback || 'Good attempt at solving the problem.'
    };
  } catch (error) {
    console.error('Error generating AI feedback:', error);
    return generateFallbackFeedback(testResults);
  }
};

/**
 * Generate interview summary using AI
 * @param {Object} interview - Interview data
 * @returns {Promise<string>} Summary text
 */
const generateInterviewSummary = async (interview) => {
  if (!isConfigured()) {
    return `Interview completed with an overall score of ${interview.overallScore}/100. You answered ${interview.questionsCompleted}/${interview.questionCount} questions.`;
  }

  try {
    const prompt = `Generate a concise interview performance summary.

Interview Details:
- Type: ${interview.interviewType}
- Questions Attempted: ${interview.questionsCompleted}/${interview.questionCount}
- Overall Score: ${interview.overallScore}/100
- Problem Solving: ${interview.problemSolvingScore}/100
- Code Quality: ${interview.codeQualityScore}/100
- Communication: ${interview.communicationScore}/100
- Time Management: ${interview.timeManagementScore}/100
- Hints Used: ${interview.totalHintsUsed}

Write 2-3 sentences highlighting performance and key takeaways.`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a technical interview evaluator.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.6,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating summary:', error);
    return `Interview completed with an overall score of ${interview.overallScore}/100. You answered ${interview.questionsCompleted}/${interview.questionCount} questions.`;
  }
};

// Fallback response generator (keyword-based)
const generateFallbackResponse = (userMessage, code) => {
  const message = userMessage.toLowerCase();
  
  if (message.includes('hint') || message.includes('help') || message.includes('stuck')) {
    return "Let's think about this step by step. What data structure might help you efficiently access or store the information you need? Consider the time complexity of different approaches.";
  }
  
  if (message.includes('clarif') || message.includes('understand') || message.includes('explain')) {
    return "That's a good question! The input will be well-formed according to the constraints. Consider edge cases like empty inputs or single elements. What would be the expected output in those scenarios?";
  }
  
  if (message.includes('approach') || message.includes('strategy')) {
    return "There are multiple valid approaches here. Consider starting with a brute force solution to ensure correctness, then think about how you might optimize it. What's the bottleneck in your current approach?";
  }
  
  if (message.includes('correct') || message.includes('right') || message.includes('good')) {
    return "You're on the right track! Now think about edge cases and whether your solution handles all scenarios mentioned in the problem constraints.";
  }
  
  if (code && code.length > 50) {
    return "Good progress on your implementation! Make sure to test it with the sample inputs. Consider whether your logic handles all edge cases mentioned in the problem.";
  }
  
  if (message.includes('time complexity') || message.includes('space complexity')) {
    return "Let's analyze the complexity. Count how many times you iterate through the data and what additional space you're using. Can you identify the dominant operations?";
  }
  
  return "That's an interesting observation! Keep thinking through the problem systematically. Break it down into smaller steps and tackle each one. What's your next step?";
};

// Fallback feedback generator
const generateFallbackFeedback = (testResults) => {
  const score = calculateBasicScore(testResults);
  const passRate = (testResults.passedTests / testResults.totalTests) * 100;
  
  return {
    score,
    strengths: testResults.success 
      ? ['All test cases passed', 'Code executes without errors', 'Correct logic implementation']
      : ['Code compiles successfully', 'Partially correct solution'],
    improvements: testResults.success 
      ? []
      : ['Review failing test cases', 'Check edge case handling', 'Verify algorithm logic'],
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    feedback: testResults.success
      ? 'Excellent work! Your solution passes all test cases. Consider reviewing time and space complexity optimizations.'
      : `Your solution passes ${Math.round(passRate)}% of test cases. Review the failing cases and consider edge scenarios that might not be handled correctly.`
  };
};

const calculateBasicScore = (testResults) => {
  return Math.round((testResults.passedTests / testResults.totalTests) * 100);
};

module.exports = {
  generateAIResponse,
  generateSolutionFeedback,
  generateInterviewSummary,
  isConfigured
};
