const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
function getClient() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set in .env');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

// Free-tier friendly, fast model. Change to 'gemini-1.5-pro' if you have access.
const MODEL_NAME = 'gemini-1.5-flash';

async function askGemini(systemInstruction, userPrompt) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODEL_NAME, systemInstruction });
  const result = await model.generateContent(userPrompt);
  return result.response.text();
}

module.exports = { askGemini };
