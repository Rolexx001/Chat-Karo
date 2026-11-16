import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/chat-backend",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  AI_PROVIDER: process.env.AI_PROVIDER || "gemini",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004",
  TAVILY_API_KEY: process.env.TAVILY_API_KEY || "",
};

export default ENV;
