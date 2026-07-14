// constants/gemini.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { SettingsModel } = require("../models/settingsModel");

//  Cache for model
let cachedModel = null;
let cachedModelName = null;
let cacheTime = null;
const CACHE_TTL = 60 * 1000; // 1 minute cache

//  Available models
const AVAILABLE_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-pro", 
  "gemini-2.0-flash-exp",
  "gemini-3.5-flash"
];

//  Initialize Gemini with API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing in .env file!");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Get model from database with caching
const getGeminiModel = async () => {
  try {
    //  Check cache
    const now = Date.now();
    if (cachedModel && cachedModelName && cacheTime && (now - cacheTime) < CACHE_TTL) {
      console.log(`📦 Using cached model: ${cachedModelName}`);
      return cachedModel;
    }
    
    //  Fetch from database
    console.log("📊 Fetching model from database...");
    const modelName = await SettingsModel.get('gemini_model');
    
    if (!modelName) {
      console.warn("⚠️ No model found in database, using default: gemini-3.5-flash");
      const defaultModel = "gemini-3.5-flash";
      await SettingsModel.set('gemini_model', defaultModel, 'Default Gemini model');
      cachedModelName = defaultModel;
    } else {
      cachedModelName = modelName;
    }
    
    // Validate model name
    if (!AVAILABLE_MODELS.includes(cachedModelName)) {
      console.warn(`⚠️ Invalid model "${cachedModelName}", using default`);
      cachedModelName = "gemini-3.5-flash";
      await SettingsModel.set('gemini_model', cachedModelName, 'Default Gemini model (invalid model fixed)');
    }
    
    // Create model instance
    cachedModel = genAI.getGenerativeModel({ model: cachedModelName });
    cacheTime = now;
    
    console.log(`✅ Gemini model initialized: ${cachedModelName}`);
    return cachedModel;
    
  } catch (error) {
    console.error("❌ Error getting model from database:", error);
    //  Fallback to default
    console.log("⚠️ Using fallback model: gemini-3.5-flash");
    return genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
  }
};

//  Get current model name
const getCurrentModelName = async () => {
  try {
    const modelName = await SettingsModel.get('gemini_model');
    return modelName || "gemini-3.5-flash";
  } catch (error) {
    return "gemini-3.5-flash";
  }
};

//  Update model
const updateGeminiModel = async (modelName) => {
  if (!AVAILABLE_MODELS.includes(modelName)) {
    throw new Error(`Invalid model: ${modelName}. Available: ${AVAILABLE_MODELS.join(', ')}`);
  }
  
  await SettingsModel.set('gemini_model', modelName, `Gemini model updated to ${modelName}`);
  
  //  Clear cache
  cachedModel = null;
  cachedModelName = null;
  cacheTime = null;
  
  console.log(` Model updated to: ${modelName}`);
  return modelName;
};

// ✅ Force refresh cache
const refreshModel = async () => {
  cachedModel = null;
  cachedModelName = null;
  cacheTime = null;
  return await getGeminiModel();
};

module.exports = {
  AVAILABLE_MODELS,
  genAI,
  getGeminiModel,
  getCurrentModelName,
  updateGeminiModel,
  refreshModel
};