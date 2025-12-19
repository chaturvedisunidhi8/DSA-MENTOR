const fs = require("fs");
const pdf = require("pdf-parse");

/**
 * Extract text from PDF file
 */
const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
};

/**
 * Parse resume text and extract relevant information
 */
const parseResumeData = (text) => {
  const data = {
    skills: [],
    experience: "",
    education: "",
    phone: "",
    email: "",
    github: "",
    linkedin: "",
  };

  // Extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailRegex);
  if (emails && emails.length > 0) {
    data.email = emails[0];
  }

  // Extract phone number (various formats)
  const phoneRegex =
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex);
  if (phones && phones.length > 0) {
    data.phone = phones[0].trim();
  }

  // Extract GitHub URL
  const githubRegex = /github\.com\/[\w-]+/gi;
  const github = text.match(githubRegex);
  if (github && github.length > 0) {
    data.github = `https://${github[0].toLowerCase()}`;
  }

  // Extract LinkedIn URL
  const linkedinRegex = /linkedin\.com\/in\/[\w-]+/gi;
  const linkedin = text.match(linkedinRegex);
  if (linkedin && linkedin.length > 0) {
    data.linkedin = `https://${linkedin[0].toLowerCase()}`;
  }

  // Extract skills - common programming languages and technologies
  const skillKeywords = [
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "C\\+\\+",
    "C#",
    "React",
    "Angular",
    "Vue",
    "Node\\.js",
    "Express",
    "MongoDB",
    "SQL",
    "PostgreSQL",
    "MySQL",
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "GCP",
    "Git",
    "HTML",
    "CSS",
    "REST API",
    "GraphQL",
    "Redux",
    "Django",
    "Flask",
    "Spring",
    "Microservices",
    "Agile",
    "Scrum",
    "TDD",
    "CI/CD",
    "Jenkins",
    "Linux",
    "Machine Learning",
    "Data Structures",
    "Algorithms",
    "System Design",
  ];

  const foundSkills = new Set();
  skillKeywords.forEach((skill) => {
    const regex = new RegExp(`\\b${skill}\\b`, "gi");
    if (regex.test(text)) {
      foundSkills.add(skill.replace(/\\\./g, ".").replace(/\\\+/g, "+"));
    }
  });
  data.skills = Array.from(foundSkills);

  // Extract experience section (basic heuristic)
  const experienceRegex =
    /(experience|work history|employment)(.*?)(education|skills|projects|$)/is;
  const experienceMatch = text.match(experienceRegex);
  if (experienceMatch && experienceMatch[2]) {
    data.experience = experienceMatch[2].trim().substring(0, 1000); // Limit to 1000 chars
  }

  // Extract education section (basic heuristic)
  const educationRegex =
    /(education|academic|qualifications)(.*?)(experience|skills|projects|$)/is;
  const educationMatch = text.match(educationRegex);
  if (educationMatch && educationMatch[2]) {
    data.education = educationMatch[2].trim().substring(0, 1000); // Limit to 1000 chars
  }

  return data;
};

/**
 * Main function to parse resume PDF
 */
const parseResume = async (filePath) => {
  try {
    const text = await extractTextFromPDF(filePath);
    const parsedData = parseResumeData(text);
    return {
      success: true,
      data: parsedData,
      rawText: text.substring(0, 2000), // Store first 2000 chars of raw text
    };
  } catch (error) {
    console.error("Error parsing resume:", error);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

module.exports = {
  parseResume,
  extractTextFromPDF,
  parseResumeData,
};
