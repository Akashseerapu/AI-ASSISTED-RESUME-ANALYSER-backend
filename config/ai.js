const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI = null;

const getAIInstance = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. AI analysis features will fail.");
      return null;
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

const getModel = (modelName = "gemini-2.5-flash") => {
  const aiInstance = getAIInstance();
  if (!aiInstance) return null;
  return aiInstance.getGenerativeModel({ model: modelName });
};

module.exports = {
  getAIInstance,
  getModel
};
