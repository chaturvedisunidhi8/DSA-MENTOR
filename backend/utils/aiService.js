/**
 * Hybrid AI Service - Intelligent response system with LLM integration
 * Primary: Local Ollama (Llama 3.2) for intelligent responses
 * Fallback: Pattern matching and rule-based logic
 * Optional: OpenAI GPT-4 for premium users
 */

const axios = require('axios');

// Configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4';
const AI_TIMEOUT = parseInt(process.env.AI_TIMEOUT) || 30000;

// Cache for Ollama availability check
let ollamaAvailable = null;
let lastOllamaCheck = 0;
const OLLAMA_CHECK_INTERVAL = 60000; // Check every minute

/**
 * Check if Ollama is running and available
 */
const checkOllamaAvailability = async () => {
  const now = Date.now();
  if (ollamaAvailable !== null && now - lastOllamaCheck < OLLAMA_CHECK_INTERVAL) {
    return ollamaAvailable;
  }

  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { 
      timeout: 3000 
    });
    const models = response.data.models || [];
    ollamaAvailable = models.some(m => m.name.includes(OLLAMA_MODEL));
    lastOllamaCheck = now;
    return ollamaAvailable;
  } catch (error) {
    ollamaAvailable = false;
    lastOllamaCheck = now;
    return false;
  }
};

/**
 * Generate response using Ollama
 */
const generateOllamaResponse = async (prompt, context = {}) => {
  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500
        }
      },
      { timeout: AI_TIMEOUT }
    );

    return response.data.response.trim();
  } catch (error) {
    console.error('Ollama generation error:', error.message);
    throw error;
  }
};

/**
 * Generate response using OpenAI (for premium users)
 */
const generateOpenAIResponse = async (prompt, context = {}) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an experienced coding interview mentor helping candidates prepare for technical interviews. Provide guidance without giving away complete solutions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: AI_TIMEOUT
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI generation error:', error.message);
    throw error;
  }
};

// Knowledge base for interview responses (fallback)
const interviewKnowledge = {
  greetings: [
    "Hello! Let's begin the interview. Can you start by explaining your approach to this problem?",
    "Welcome! Take a moment to read through the problem. What are your initial thoughts?",
    "Hi there! Let's work through this together. What's your understanding of the requirements?"
  ],
  
  hints: {
    dataStructures: [
      "Consider using a HashMap or Set for O(1) lookups.",
      "Would an array or linked list be more appropriate here?",
      "Think about whether a stack or queue would help maintain the order.",
      "Could a tree structure help organize this data efficiently?"
    ],
    algorithms: [
      "Have you considered a two-pointer approach?",
      "Would sorting the input help simplify the problem?",
      "Think about whether dynamic programming could optimize repeated calculations.",
      "Could binary search reduce the time complexity here?"
    ],
    complexity: [
      "What's the time complexity of your current approach? Can it be improved?",
      "Are you using extra space? Could you solve this in-place?",
      "Consider the trade-off between time and space complexity.",
      "Think about the worst-case scenario for your algorithm."
    ],
    edgeCases: [
      "What happens if the input is empty?",
      "Have you considered duplicate values?",
      "What about negative numbers or very large inputs?",
      "Think about the boundary conditions mentioned in constraints."
    ]
  },
  
  encouragement: [
    "You're on the right track! Keep going.",
    "Good thinking! Let's build on that approach.",
    "Excellent observation! How would you implement that?",
    "That's a solid start. What's your next step?"
  ],
  
  clarifications: [
    "The input will be well-formed according to the constraints provided.",
    "You can assume all inputs meet the specified format unless stated otherwise.",
    "Consider the constraints carefully - they often hint at the expected complexity.",
    "The problem guarantees certain conditions - use them to your advantage."
  ]
};

// Pattern matching for user intent
const detectIntent = (message) => {
  const msg = message.toLowerCase();
  
  if (msg.match(/\b(hint|help|stuck|don'?t know|confused)\b/)) {
    return 'needsHint';
  }
  if (msg.match(/\b(clarif|understand|mean|explain|what does)\b/)) {
    return 'needsClarification';
  }
  if (msg.match(/\b(approach|strategy|start|begin|how to)\b/)) {
    return 'needsApproach';
  }
  if (msg.match(/\b(correct|right|good|works?)\b/)) {
    return 'seekingValidation';
  }
  if (msg.match(/\b(time|space|complexity|efficient|optimize)\b/)) {
    return 'complexityQuestion';
  }
  if (msg.match(/\b(edge case|corner case|boundary|empty|null)\b/)) {
    return 'edgeCaseQuestion';
  }
  if (msg.match(/\b(data structure|array|hash|tree|stack|queue)\b/)) {
    return 'dataStructureQuestion';
  }
  if (msg.match(/\b(hello|hi|hey|start)\b/)) {
    return 'greeting';
  }
  
  return 'general';
};

// Analyze code for feedback
const analyzeCode = (code, language) => {
  const analysis = {
    hasLoops: /\b(for|while|forEach|map|filter|reduce)\b/.test(code),
    hasConditionals: /\b(if|else|switch|case|\?)\b/.test(code),
    hasRecursion: new RegExp(`\\b${getFunctionName(code, language)}\\s*\\(`).test(code),
    hasFunctions: /\bfunction\b|\b=>\b|\bdef\b|\bpublic\b|\bprivate\b/.test(code),
    usesDataStructures: /\b(HashMap|HashSet|Map|Set|Array|List|Stack|Queue|new\s+\w+\[)\b/.test(code),
    linesOfCode: code.split('\n').filter(line => line.trim().length > 0).length,
    hasComments: /\/\/|\/\*|\*\/|#/.test(code),
    properNaming: /\b[a-z][a-zA-Z0-9]*\b/.test(code)
  };
  
  return analysis;
};

const getFunctionName = (code, language) => {
  const match = code.match(/function\s+(\w+)|def\s+(\w+)|public\s+\w+\s+(\w+)/);
  return match ? (match[1] || match[2] || match[3]) : 'solution';
};

// Estimate time complexity based on code patterns
const estimateComplexity = (code) => {
  const nestedLoops = (code.match(/for|while/g) || []).length;
  const recursion = /return.*\(.*\)/.test(code);
  const sorting = /\bsort\b/.test(code);
  const binarySearch = /\b(binary|mid|left.*right)\b/.test(code);
  
  if (sorting) return { time: 'O(n log n)', space: 'O(log n)' };
  if (binarySearch) return { time: 'O(log n)', space: 'O(1)' };
  if (nestedLoops >= 3) return { time: 'O(n³)', space: 'O(1)' };
  if (nestedLoops >= 2) return { time: 'O(n²)', space: 'O(1)' };
  if (recursion) return { time: 'O(n)', space: 'O(n)' };
  if (nestedLoops >= 1) return { time: 'O(n)', space: 'O(1)' };
  
  return { time: 'O(n)', space: 'O(1)' };
};

/**
 * Generate interview response using hybrid AI approach
 * Priority: Ollama > OpenAI (premium) > Pattern matching (fallback)
 */
const generateAIResponse = async (context, userMessage, code = '') => {
  const { problem, interviewType, isPremium = false } = context;
  
  // Build intelligent prompt
  const prompt = buildInterviewPrompt(context, userMessage, code);
  
  // Try Ollama first
  const isOllamaAvailable = await checkOllamaAvailability();
  if (isOllamaAvailable) {
    try {
      const response = await generateOllamaResponse(prompt, context);
      return response;
    } catch (error) {
      console.error('Ollama failed, falling back:', error.message);
    }
  }
  
  // Try OpenAI for premium users
  if (isPremium && OPENAI_API_KEY) {
    try {
      const response = await generateOpenAIResponse(prompt, context);
      return response;
    } catch (error) {
      console.error('OpenAI failed, falling back:', error.message);
    }
  }
  
  // Fallback to pattern matching
  return generatePatternBasedResponse(context, userMessage, code);
};

/**
 * Build intelligent prompt for LLM
 */
const buildInterviewPrompt = (context, userMessage, code) => {
  const { problem, interviewType } = context;
  
  let prompt = `You are conducting a ${interviewType || 'technical'} coding interview.\n\n`;
  
  if (problem) {
    prompt += `Problem: ${problem.title}\n`;
    prompt += `Difficulty: ${problem.difficulty}\n`;
    if (problem.description) {
      prompt += `Description: ${problem.description.substring(0, 300)}...\n`;
    }
    prompt += `\n`;
  }
  
  if (code && code.length > 20) {
    prompt += `Candidate's current code:\n\`\`\`\n${code.substring(0, 500)}\n\`\`\`\n\n`;
  }
  
  prompt += `Candidate says: "${userMessage}"\n\n`;
  prompt += `Respond as an experienced interviewer. `;
  prompt += `Provide helpful guidance without giving away the complete solution. `;
  prompt += `Ask clarifying questions, suggest approaches, or provide hints. `;
  prompt += `Keep response under 100 words. Be encouraging but professional.`;
  
  return prompt;
};

/**
 * Pattern-based response (fallback when LLMs unavailable)
 */
const generatePatternBasedResponse = (context, userMessage, code = '') => {
  const intent = detectIntent(userMessage);
  const { problem, interviewType } = context;
  
  let response = '';
  
  switch (intent) {
    case 'greeting':
      response = interviewKnowledge.greetings[Math.floor(Math.random() * interviewKnowledge.greetings.length)];
      break;
      
    case 'needsHint':
      const hintCategories = Object.keys(interviewKnowledge.hints);
      const category = hintCategories[Math.floor(Math.random() * hintCategories.length)];
      const hints = interviewKnowledge.hints[category];
      response = hints[Math.floor(Math.random() * hints.length)];
      break;
      
    case 'needsClarification':
      response = interviewKnowledge.clarifications[Math.floor(Math.random() * interviewKnowledge.clarifications.length)];
      break;
      
    case 'needsApproach':
      response = "Let's break this down step by step:\n1. First, identify the input and expected output\n2. Consider a brute force solution\n3. Think about optimizations\n4. Consider edge cases\n\nWhat would be your brute force approach?";
      break;
      
    case 'seekingValidation':
      if (code && code.length > 50) {
        const analysis = analyzeCode(code, 'javascript');
        if (analysis.hasLoops && analysis.hasConditionals) {
          response = interviewKnowledge.encouragement[Math.floor(Math.random() * interviewKnowledge.encouragement.length)] + " Make sure to test with edge cases.";
        } else {
          response = "Your approach looks incomplete. Consider adding logic to handle different scenarios.";
        }
      } else {
        response = "You're thinking in the right direction! Now let's implement the solution step by step.";
      }
      break;
      
    case 'complexityQuestion':
      const complexity = code ? estimateComplexity(code) : null;
      if (complexity) {
        response = `Based on your code structure, it appears to be ${complexity.time} time complexity and ${complexity.space} space complexity. Can you confirm your analysis?`;
      } else {
        response = interviewKnowledge.hints.complexity[Math.floor(Math.random() * interviewKnowledge.hints.complexity.length)];
      }
      break;
      
    case 'edgeCaseQuestion':
      response = interviewKnowledge.hints.edgeCases[Math.floor(Math.random() * interviewKnowledge.hints.edgeCases.length)];
      break;
      
    case 'dataStructureQuestion':
      response = interviewKnowledge.hints.dataStructures[Math.floor(Math.random() * interviewKnowledge.hints.dataStructures.length)];
      break;
      
    default:
      response = "That's interesting. Can you elaborate on your current approach? What challenges are you facing?";
  }
  
  return response;
};

/**
 * Generate code feedback using hybrid AI approach
 */
const generateSolutionFeedback = async (code, language, problem, testResults) => {
  const analysis = analyzeCode(code, language);
  const complexity = estimateComplexity(code);
  const passRate = (testResults.passedTests / testResults.totalTests) * 100;
  
  // Build prompt for LLM feedback
  const prompt = buildFeedbackPrompt(code, language, problem, testResults, analysis, complexity);
  
  // Try Ollama first
  const isOllamaAvailable = await checkOllamaAvailability();
  if (isOllamaAvailable) {
    try {
      const llmFeedback = await generateOllamaResponse(prompt);
      return parseLLMFeedback(llmFeedback, testResults, complexity, analysis);
    } catch (error) {
      console.error('Ollama feedback failed, using pattern-based:', error.message);
    }
  }
  
  // Fallback to pattern-based feedback
  return generatePatternBasedFeedback(code, language, problem, testResults, analysis, complexity);
};

/**
 * Build feedback prompt for LLM
 */
const buildFeedbackPrompt = (code, language, problem, testResults, analysis, complexity) => {
  const passRate = (testResults.passedTests / testResults.totalTests) * 100;
  
  let prompt = `Analyze this ${language} solution for: ${problem.title}\n\n`;
  prompt += `Code:\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
  prompt += `Test Results: ${testResults.passedTests}/${testResults.totalTests} passed (${passRate.toFixed(0)}%)\n`;
  prompt += `Estimated Complexity: Time ${complexity.time}, Space ${complexity.space}\n\n`;
  
  prompt += `Provide structured feedback with:\n`;
  prompt += `1. Overall score (0-100)\n`;
  prompt += `2. Three strengths (bullet points)\n`;
  prompt += `3. Three improvements (bullet points)\n`;
  prompt += `4. Brief summary (2-3 sentences)\n\n`;
  prompt += `Format as:\nScore: [number]\nStrengths:\n- [point]\nImprovements:\n- [point]\nSummary: [text]`;
  
  return prompt;
};

/**
 * Parse LLM feedback into structured format
 */
const parseLLMFeedback = (llmResponse, testResults, complexity, analysis) => {
  // Extract score
  const scoreMatch = llmResponse.match(/Score:\s*(\d+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;
  
  // Extract strengths
  const strengthsMatch = llmResponse.match(/Strengths:\s*([\s\S]*?)(?=Improvements:|$)/i);
  const strengthsText = strengthsMatch ? strengthsMatch[1] : '';
  const strengths = strengthsText
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.replace(/^-\s*/, '').trim())
    .slice(0, 3);
  
  // Extract improvements
  const improvementsMatch = llmResponse.match(/Improvements:\s*([\s\S]*?)(?=Summary:|$)/i);
  const improvementsText = improvementsMatch ? improvementsMatch[1] : '';
  const improvements = improvementsText
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.replace(/^-\s*/, '').trim())
    .slice(0, 3);
  
  // Extract summary
  const summaryMatch = llmResponse.match(/Summary:\s*(.+?)(?:\n|$)/i);
  const feedback = summaryMatch ? summaryMatch[1].trim() : llmResponse.substring(0, 200);
  
  return {
    score: Math.min(100, Math.max(0, score)),
    strengths: strengths.length > 0 ? strengths : ['Solution submitted'],
    improvements: improvements.length > 0 ? improvements : ['Review test cases'],
    timeComplexity: complexity.time,
    spaceComplexity: complexity.space,
    feedback
  };
};

/**
 * Pattern-based feedback (fallback)
 */
const generatePatternBasedFeedback = (code, language, problem, testResults, analysis, complexity) => {
  const passRate = (testResults.passedTests / testResults.totalTests) * 100;
  
  // Calculate score based on test results and code quality
  let score = Math.round(passRate);
  if (analysis.hasComments) score = Math.min(100, score + 5);
  if (analysis.properNaming) score = Math.min(100, score + 5);
  if (analysis.usesDataStructures) score = Math.min(100, score + 5);
  
  // Generate strengths
  const strengths = [];
  if (testResults.success) {
    strengths.push('All test cases passed - correct solution');
    if (analysis.hasComments) strengths.push('Well-commented code');
    if (analysis.properNaming) strengths.push('Good variable naming conventions');
    if (analysis.usesDataStructures) strengths.push('Effective use of data structures');
    if (analysis.linesOfCode < 50) strengths.push('Concise and readable implementation');
  } else {
    if (passRate > 50) strengths.push('Partially correct logic');
    if (analysis.hasConditionals) strengths.push('Handles multiple scenarios');
    if (code.length > 100) strengths.push('Substantial implementation effort');
  }
  
  // Generate improvements
  const improvements = [];
  if (!testResults.success) {
    improvements.push(`Solution passes ${Math.round(passRate)}% of test cases - review failing scenarios`);
    improvements.push('Check edge cases: empty input, single element, duplicates');
    if (!analysis.hasConditionals) improvements.push('Add conditional logic for different input scenarios');
  }
  if (!analysis.hasComments && code.length > 100) {
    improvements.push('Add comments to explain complex logic');
  }
  if (complexity.time === 'O(n³)' || complexity.time === 'O(n²)') {
    improvements.push('Consider optimizing time complexity with better data structures');
  }
  
  // Generate feedback message
  let feedback = '';
  if (testResults.success) {
    feedback = `Excellent work! Your solution passes all ${testResults.totalTests} test cases. `;
    feedback += `The estimated time complexity is ${complexity.time}. `;
    feedback += improvements.length > 0 ? 'Consider: ' + improvements.join(', ') : 'Well-optimized solution!';
  } else {
    feedback = `Your solution passes ${testResults.passedTests}/${testResults.totalTests} test cases (${Math.round(passRate)}%). `;
    feedback += 'Review the failing test cases and check for edge cases like empty inputs, boundaries, or duplicate values. ';
    feedback += 'Trace through your logic step-by-step with sample inputs.';
  }
  
  return {
    score,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    timeComplexity: complexity.time,
    spaceComplexity: complexity.space,
    feedback
  };
};

/**
 * Generate interview summary using hybrid AI
 */
const generateInterviewSummary = async (interview) => {
  // Build prompt for LLM
  const prompt = buildSummaryPrompt(interview);
  
  // Try Ollama first
  const isOllamaAvailable = await checkOllamaAvailability();
  if (isOllamaAvailable) {
    try {
      const summary = await generateOllamaResponse(prompt);
      return summary;
    } catch (error) {
      console.error('Ollama summary failed, using pattern-based:', error.message);
    }
  }
  
  // Fallback to pattern-based summary
  return generatePatternBasedSummary(interview);
};

/**
 * Build summary prompt for LLM
 */
const buildSummaryPrompt = (interview) => {
  let prompt = `Summarize this coding interview performance:\n\n`;
  prompt += `Overall Score: ${interview.overallScore}/100\n`;
  prompt += `Questions Completed: ${interview.questionsCompleted}/${interview.questionCount}\n`;
  prompt += `Code Quality: ${interview.codeQualityScore}/100\n`;
  prompt += `Communication: ${interview.communicationScore}/100\n`;
  prompt += `Time Management: ${interview.timeManagementScore}/100\n`;
  prompt += `Hints Used: ${interview.totalHintsUsed}\n\n`;
  prompt += `Write a 2-3 sentence professional summary with specific feedback and improvement areas. Be encouraging but honest.`;
  
  return prompt;
};

/**
 * Pattern-based summary (fallback)
 */
const generatePatternBasedSummary = (interview) => {
  const scoreDescriptors = {
    90: 'Outstanding',
    75: 'Strong',
    60: 'Good',
    40: 'Fair',
    0: 'Needs Improvement'
  };
  
  let descriptor = 'Needs Improvement';
  for (const [threshold, desc] of Object.entries(scoreDescriptors)) {
    if (interview.overallScore >= parseInt(threshold)) {
      descriptor = desc;
      break;
    }
  }
  
  let summary = `${descriptor} performance with ${interview.overallScore}/100 overall score. `;
  summary += `You completed ${interview.questionsCompleted}/${interview.questionCount} questions`;
  
  if (interview.totalHintsUsed > 0) {
    summary += ` (used ${interview.totalHintsUsed} hints)`;
  }
  summary += '. ';
  
  // Add specific feedback
  if (interview.codeQualityScore >= 80) {
    summary += 'Your code quality was excellent. ';
  } else if (interview.codeQualityScore < 50) {
    summary += 'Focus on improving code organization and readability. ';
  }
  
  if (interview.timeManagementScore < 60) {
    summary += 'Practice solving problems faster to improve time management.';
  } else if (interview.communicationScore >= 80) {
    summary += 'Great communication of your thought process!';
  }
  
  return summary.trim();
};

module.exports = {
  generateAIResponse,
  generateSolutionFeedback,
  generateInterviewSummary,
  checkOllamaAvailability,
  isConfigured: async () => {
    // Check if any AI backend is available
    const ollama = await checkOllamaAvailability();
    return ollama || !!OPENAI_API_KEY || true; // Always true as we have fallback
  }
};

