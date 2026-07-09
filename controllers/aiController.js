const Resume = require("../models/Resume");
const Analysis = require("../models/Analysis");
const JobMatch = require("../models/JobMatch");
const { getModel } = require("../config/ai");

// Fallback Mock Analysis Generator (in case API key is missing or fails)
const getMockAnalysis = (resumeText) => {
  // Extract simple email/phone if possible via regex
  const emailRegex = /[\w.-]+@[\w.-]+\.[\w.-]+/i;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  
  const emailMatch = resumeText.match(emailRegex);
  const phoneMatch = resumeText.match(phoneRegex);

  return {
    name: "John Doe (Mock Analysis)",
    email: emailMatch ? emailMatch[0] : "john.doe@example.com",
    phone: phoneMatch ? phoneMatch[0] : "+1 (555) 123-4567",
    skills: ["JavaScript", "React.js", "Node.js", "Express.js", "MongoDB", "REST APIs", "Tailwind CSS"],
    projects: [
      "E-Commerce Web App - Integrated Stripe payments and Redux state management.",
      "Task Planner Application - Responsive drag-and-drop board built with React."
    ],
    education: [
      "B.S. in Computer Science - State University (GPA: 3.8/4.0)"
    ],
    experience: [
      "Software Developer Intern at TechCorp (6 months) - Built frontend features in React.",
      "Freelance Web Developer (1 year) - Designed clean responsive websites for clients."
    ],
    certifications: [
      "AWS Certified Cloud Practitioner",
      "React Developer Certification"
    ],
    score: 78,
    atsScore: 72,
    missingKeywords: ["TypeScript", "CI/CD Pipelines", "Docker", "Unit Testing"],
    grammarSuggestions: [
      "Change 'responsible for building frontend features' to 'Engineered core UI modules to increase responsiveness.'"
    ],
    formattingSuggestions: [
      "Make margins consistent on all pages.",
      "Add a dedicated Skills summary section at the top of page."
    ],
    strengths: [
      "Strong foundational MERN stack knowledge.",
      "Good inclusion of measurable project impact.",
      "Clear clean layouts."
    ],
    weaknesses: [
      "Lacks DevOps and cloud deployment tools listing.",
      "Experience description is a bit brief; needs more action verbs."
    ],
    improvementTips: [
      "Incorporate more industry keywords such as Kubernetes, Redis, or Jest.",
      "Use the STAR method (Situation, Task, Action, Result) to write professional experience bullet points."
    ]
  };
};

// Fallback Mock Job Match Generator
const getMockJobMatch = (resumeText, jobDescription) => {
  return {
    matchPercentage: 82,
    missingSkills: ["TypeScript", "Docker", "CI/CD", "AWS Lambda"],
    matchingSkills: ["React.js", "Node.js", "Express.js", "MongoDB", "JavaScript", "Tailwind CSS"],
    recommendedSkills: ["TypeScript", "Jest (Testing Framework)", "Docker Containerization"],
    recommendation: "Strong candidate matching 80%+ of core frontend and API technologies. Recommend adding TypeScript skills and basic containerization concepts to resume before applying."
  };
};

// Analyze Resume
exports.analyzeResume = async (req, res) => {
  try {
    const { resumeId } = req.body;
    if (!resumeId) {
      return res.status(400).json({ message: "Resume ID is required" });
    }

    const resume = await Resume.findOne({ _id: resumeId, user: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Check if analysis already exists
    const existingAnalysis = await Analysis.findOne({ resume: resumeId, user: req.user.id });
    if (existingAnalysis) {
      return res.json(existingAnalysis);
    }

    const model = getModel();
    let analysisResult;

    if (model && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `
          You are an expert ATS (Applicant Tracking System) parser and senior recruiter.
          Analyze the following resume text and perform a complete evaluation.
          You MUST respond with a valid JSON object matching the schema below. 
          Do not include any markdown comments, formatting blocks, or surrounding text outside of the JSON payload.
          
          JSON Schema:
          {
            "name": "Full Name as string (use 'Unknown' if not found)",
            "email": "Email as string (use 'Unknown' if not found)",
            "phone": "Phone number as string (use 'Unknown' if not found)",
            "skills": ["Array of parsed professional technical/soft skills"],
            "projects": ["Array of project names and details"],
            "education": ["Array of degrees, schools, and majors"],
            "experience": ["Array of professional work experience entries"],
            "certifications": ["Array of certifications or courses"],
            "score": Integer between 0 and 100 representing overall resume quality,
            "atsScore": Integer between 0 and 100 representing system friendliness and parsing layout score,
            "missingKeywords": ["List of typical tech/business keywords this profile should have but lacks"],
            "grammarSuggestions": ["Grammar or wording improvements"],
            "formattingSuggestions": ["Layout, spacing, font, or structure adjustments"],
            "strengths": ["Key professional strengths"],
            "weaknesses": ["Key areas for improvement/weaknesses"],
            "improvementTips": ["Actionable steps to elevate this resume"]
          }

          Resume Text:
          ${resume.extractedText}
        `;

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        });

        const textResponse = result.response.text();
        analysisResult = JSON.parse(textResponse);
      } catch (err) {
        console.error("Gemini API call failed, using mock data:", err.message);
        analysisResult = getMockAnalysis(resume.extractedText);
      }
    } else {
      console.log("No Gemini API key found, generating mock analysis");
      analysisResult = getMockAnalysis(resume.extractedText);
    }

    // Save Analysis to Database
    const analysis = new Analysis({
      user: req.user.id,
      resume: resume._id,
      extractedInfo: {
        name: analysisResult.name,
        email: analysisResult.email,
        phone: analysisResult.phone,
        skills: analysisResult.skills,
        projects: analysisResult.projects,
        education: analysisResult.education,
        experience: analysisResult.experience,
        certifications: analysisResult.certifications
      },
      score: analysisResult.score,
      atsScore: analysisResult.atsScore,
      missingKeywords: analysisResult.missingKeywords,
      grammarSuggestions: analysisResult.grammarSuggestions,
      formattingSuggestions: analysisResult.formattingSuggestions,
      strengths: analysisResult.strengths,
      weaknesses: analysisResult.weaknesses,
      improvementTips: analysisResult.improvementTips
    });

    await analysis.save();
    res.status(201).json(analysis);
  } catch (error) {
    res.status(500).json({ message: "Server error during AI analysis", error: error.message });
  }
};

// Job Matching Analysis
exports.jobMatch = async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;

    if (!resumeId || !jobDescription) {
      return res.status(400).json({ message: "Resume ID and Job Description are required" });
    }

    const resume = await Resume.findOne({ _id: resumeId, user: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const model = getModel();
    let matchResult;

    if (model && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `
          You are an expert recruiter matching resumes against a target job description.
          Compare the resume text and the job description.
          Return a valid JSON object matching the schema below.
          Do not include any markdown comments, formatting blocks, or surrounding text.

          JSON Schema:
          {
            "matchPercentage": Integer between 0 and 100,
            "missingSkills": ["Array of skills requested in job desc but missing in resume"],
            "matchingSkills": ["Array of skills requested in job desc that match resume keywords"],
            "recommendedSkills": ["Additional related skills recommended to bridge the gap"],
            "recommendation": "Overall recommendation summary as string"
          }

          Resume Text:
          ${resume.extractedText}

          Job Description:
          ${jobDescription}
        `;

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        });

        const textResponse = result.response.text();
        matchResult = JSON.parse(textResponse);
      } catch (err) {
        console.error("Gemini JobMatch API call failed, using mock data:", err.message);
        matchResult = getMockJobMatch(resume.extractedText, jobDescription);
      }
    } else {
      console.log("No Gemini API key found, generating mock job match");
      matchResult = getMockJobMatch(resume.extractedText, jobDescription);
    }

    // Save Job Match log
    const jobMatch = new JobMatch({
      user: req.user.id,
      resume: resume._id,
      jobDescription,
      matchPercentage: matchResult.matchPercentage,
      missingSkills: matchResult.missingSkills,
      matchingSkills: matchResult.matchingSkills,
      recommendedSkills: matchResult.recommendedSkills,
      recommendation: matchResult.recommendation
    });

    await jobMatch.save();
    res.status(201).json(jobMatch);
  } catch (error) {
    res.status(500).json({ message: "Server error during job matching", error: error.message });
  }
};

// Get analyses history (for Dashboard list and Charts)
exports.getAnalyses = async (req, res) => {
  try {
    const analyses = await Analysis.find({ user: req.user.id })
      .populate("resume", "fileName")
      .sort({ createdAt: -1 });

    res.json(analyses);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching analyses", error: error.message });
  }
};

// Get single analysis details
exports.getAnalysisDetail = async (req, res) => {
  try {
    const analysis = await Analysis.findOne({ _id: req.params.id, user: req.user.id })
      .populate("resume", "fileName createdAt");
      
    if (!analysis) {
      return res.status(404).json({ message: "Analysis details not found" });
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching analysis details", error: error.message });
  }
};

// Get Job Matches history
exports.getJobMatches = async (req, res) => {
  try {
    const matches = await JobMatch.find({ user: req.user.id })
      .populate("resume", "fileName")
      .sort({ createdAt: -1 });

    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching job matches", error: error.message });
  }
};
