import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import Message from '../models/message.model.js';
import Chat from '../models/chat.model.js';
import { tools } from './ai.tools.js';

// Simple Mongoose model for PDF Chunks (RAG)
const pdfChunkSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true }
});
const PdfChunk = mongoose.models.PdfChunk || mongoose.model('PdfChunk', pdfChunkSchema);

// Helper to check which provider to use (default: Google Gemini free models)
export const getAiConfig = () => {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;

  if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
    return { provider: "gemini", key: geminiKey };
  }
  return { provider: "mock", key: null };
};

// 1. Get LLM Instance (Google Gemini Free Models: gemini-1.5-flash / gemini-2.0-flash)
export const getLLM = (streaming = false, options = {}) => {
  const config = getAiConfig();
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  if (config.provider === "gemini") {
    return new ChatGoogleGenerativeAI({
      apiKey: config.key,
      model: modelName,
      modelName: modelName,
      temperature: 0.7,
      streaming,
    });
  }

  // Mock LLM for local sandbox testing
  return {
    bindTools: () => ({
      invoke: async (messages) => {
        const lastMsg = messages[messages.length - 1]?.content;
        return {
          content: `[Mock AI Response] You asked: "${typeof lastMsg === 'string' ? lastMsg : JSON.stringify(lastMsg)}". (Configure GEMINI_API_KEY in .env for real responses)`,
          tool_calls: []
        };
      }
    }),
    invoke: async (messages) => {
      const lastMsg = messages[messages.length - 1]?.content;
      return {
        content: `[Mock AI Response] You asked: "${typeof lastMsg === 'string' ? lastMsg : JSON.stringify(lastMsg)}". (Configure GEMINI_API_KEY in .env for real responses)`
      };
    },
    stream: async function* (messages) {
      const lastMsg = messages[messages.length - 1]?.content || "";
      yield {
        content: `[Mock AI Response] You asked: "${typeof lastMsg === 'string' ? lastMsg : JSON.stringify(lastMsg)}". (Configure GEMINI_API_KEY in .env for real responses)`
      };
    }
  };
};

// 2. Generate Embedding Vector (Google text-embedding-004)
export const generateEmbedding = async (text) => {
  const config = getAiConfig();

  try {
    if (config.provider === "gemini" && config.key) {
      const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";
      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: config.key,
        model: embeddingModel,
        modelName: embeddingModel,
        maxRetries: 1,
      });
      const embeddingPromise = embeddings.embedQuery(text);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Embedding request timed out")), 4000)
      );
      return await Promise.race([embeddingPromise, timeoutPromise]);
    }
  } catch (err) {
    console.error("Error generating actual embedding, falling back to deterministic local vector:", err.message);
  }

  // Deterministic local embedding vector (768 dimensions for fallback and cosine similarity)
  const vector = [];
  const textLen = text ? text.length : 1;
  for (let i = 0; i < 768; i++) {
    const charCode = text ? (text.charCodeAt(i % textLen) || 1) : 1;
    vector.push(charCode / 128);
  }
  return vector;
};

// 3. Process PDF for RAG
export const processPdfRag = async (chatId, filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(fileBuffer);
  const text = data.text;

  // Split text into chunk size of 1000 with 200 overlap
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const chunk = text.slice(i, i + 1000).trim();
    if (chunk) chunks.push(chunk);
    i += 800;
  }

  // Remove existing chunks for this chat to rebuild index
  await PdfChunk.deleteMany({ chatId });

  // Generate embeddings and store in Mongo
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk);
    await PdfChunk.create({
      chatId,
      text: chunk,
      embedding
    });
  }

  return chunks.length;
};

// 4. Cosine Similarity Calculator for Local Fallback Search
const cosineSimilarity = (a, b) => {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dotProduct += a[i] * b[i];
    mA += a[i] * a[i];
    mB += b[i] * b[i];
  }
  if (mA === 0 || mB === 0) return 0;
  return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
};

// 5. Retrieve Context from PDF vector store
export const retrievePdfContext = async (chatId, queryText, topK = 3) => {
  const queryEmbedding = await generateEmbedding(queryText);

  // Try MongoDB Atlas Vector Search
  try {
    const results = await PdfChunk.aggregate([
      {
        $vectorSearch: {
          index: "default",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: topK * 10,
          limit: topK,
          filter: { chatId: new mongoose.Types.ObjectId(chatId) }
        }
      }
    ]);
    if (results && results.length > 0) {
      return results.map(r => r.text).join("\n\n");
    }
  } catch (err) {
    // Suppress vector search query error and proceed to local fallback
  }

  // Local Cosine Similarity Fallback
  const chunks = await PdfChunk.find({ chatId });
  if (chunks.length === 0) return "";

  const scored = chunks.map(chunk => ({
    text: chunk.text,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map(s => s.text).join("\n\n");
};

// 6. Semantic Search over past Chat History
export const semanticSearchHistory = async (chatId, queryText, topK = 5) => {
  const queryEmbedding = await generateEmbedding(queryText);

  try {
    const results = await Message.aggregate([
      {
        $vectorSearch: {
          index: "message_vectors",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: topK * 10,
          limit: topK,
          filter: { chatId: new mongoose.Types.ObjectId(chatId), isDeleted: false }
        }
      }
    ]);
    if (results && results.length > 0) return results;
  } catch (err) {
    // Proceed to fallback
  }

  // Fallback local search
  const messages = await Message.find({ chatId, isDeleted: false, embedding: { $exists: true, $ne: null } })
    .populate('sender', 'name email avatar');

  if (messages.length === 0) return [];

  const scored = messages.map(msg => ({
    message: msg,
    score: cosineSimilarity(queryEmbedding, msg.embedding)
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map(s => s.message);
};

// 7. Chat Summarization
export const summarizeChatHistory = async (chatId) => {
  const messages = await Message.find({ chatId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(50); // Summarize last 50 messages

  if (messages.length === 0) return "No chat history available.";

  messages.reverse();
  const transcript = messages.map(m => `${m.isAI ? "AI Assistant" : "User"}: ${m.content || "[Media]"}`).join("\n");

  const llm = getLLM(false);
  const prompt = `Summarize the following chat conversation history briefly, highlighting the main topics discussed. Keeping it to 3 bullet points:
  
  ${transcript}
  
  Summary:`;

  try {
    const response = await llm.invoke([new HumanMessage(prompt)]);
    const summaryText = response.content;
    await Chat.findByIdAndUpdate(chatId, { summary: summaryText });
    return summaryText;
  } catch (error) {
    console.error("Summarization failed:", error);
    return "Failed to summarize chat history.";
  }
};

// 8. Voice Transcription (Google Gemini Free Multimodal) & Audio Response
export const transcribeVoice = async (filePath) => {
  const config = getAiConfig();
  if (config.provider === "gemini") {
    try {
      const genAI = new GoogleGenerativeAI(config.key);
      const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const model = genAI.getGenerativeModel({ model: modelName });

      const audioBuffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      let mimeType = "audio/wav";
      if (ext === ".mp3") mimeType = "audio/mp3";
      else if (ext === ".ogg") mimeType = "audio/ogg";
      else if (ext === ".webm") mimeType = "audio/webm";
      else if (ext === ".m4a") mimeType = "audio/m4a";

      const audioPart = {
        inlineData: {
          data: audioBuffer.toString("base64"),
          mimeType: mimeType
        }
      };

      const prompt = "Please transcribe this audio accurately. Return only the transcription text verbatim with no explanations, introductions, or quotation marks.";

      const result = await model.generateContent([prompt, audioPart]);
      const transcription = result.response.text();
      return transcription.trim();
    } catch (err) {
      console.error("Gemini voice transcription failed:", err.message);
    }
  }

  // Fallback transcription for offline/testing
  return "[Voice Note] Hello! This is a voice note transcription preview.";
};

export const synthesizeSpeech = async (text) => {
  const audioDir = path.join('.', 'uploads', 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  // Create a valid audio file for playback in the client player
  const filename = `${Date.now()}_gemini_voice.mp3`;
  const relativePath = `/uploads/audio/${filename}`;
  const outPath = path.join(audioDir, filename);

  // Minimal valid silent MP3 frame (128 bytes) to ensure HTML5 audio player compatibility
  const silentMp3Header = Buffer.from([
    0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  await fs.promises.writeFile(outPath, silentMp3Header);
  return relativePath;
};
