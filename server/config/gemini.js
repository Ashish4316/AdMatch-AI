const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

if (!process.env.GEMINI_API_KEY) {
  logger.warn('GEMINI_API_KEY is not set. AI features will not work.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

/**
 * Get a configured Gemini generative model instance.
 * @param {string} [modelName] - Override the default model.
 * @param {object} [generationConfig] - Gemini generation config overrides.
 */
const getGeminiModel = (modelName = DEFAULT_MODEL, generationConfig = {}) => {
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      ...generationConfig,
    },
  });
};

/**
 * Send a single prompt to Gemini and return the text response.
 * @param {string} prompt
 * @param {string} [modelName]
 * @param {object} [generationConfig]
 * @returns {Promise<string>}
 */
const generateContent = async (prompt, modelName, generationConfig) => {
  try {
    const model = getGeminiModel(modelName, generationConfig);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    logger.error(`Gemini generateContent error: ${error.message}`);
    throw error;
  }
};

/**
 * Start a multi-turn chat session.
 * @param {Array} [history=[]] - Previous chat history.
 * @param {string} [modelName]
 */
const startChatSession = (history = [], modelName) => {
  const model = getGeminiModel(modelName);
  return model.startChat({ history });
};

module.exports = { genAI, getGeminiModel, generateContent, startChatSession };
