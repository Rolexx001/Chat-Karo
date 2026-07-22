import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
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

// Helper to check which provider to use
const getAiConfig = () => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
    return { provider: "gemini", key: geminiKey };
  } else if (openaiKey && openaiKey !== "your_openai_api_key_here") {
    return { provider: "openai", key: openaiKey };
  }
  return { provider: "mock", key: null };
};

// 1. Get LLM Instance
export const getLLM = (streaming = false) => {
  const config = getAiConfig();

  if (config.provider === "gemini") {
    return new ChatGoogleGenerativeAI({
      apiKey: config.key,
      modelName: "gemini-1.5-flash",
      temperature: 0.7,
      streaming,
    });
  } else if (config.provider === "openai") {
    return new ChatOpenAI({
      apiKey: config.key,
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      streaming,
    });
  }

  // Mock LLM for local sandbox testing
  return {
    bindTools: () => ({
      invoke: async (messages) => {
        const lastMsg = messages[messages.length - 1].content;
        return {
          content: `[Mock AI Response] You asked: "${lastMsg}". (Configure GEMINI_API_KEY or OPENAI_API_KEY in .env for real responses)`,
          tool_calls: []
        };
      }
    }),
    invoke: async (messages) => {
      const lastMsg = messages[messages.length - 1].content;
      return {
        content: `[Mock AI Response] You asked: "${lastMsg}". (Configure GEMINI_API_KEY or OPENAI_API_KEY in .env for real responses)`
      };
    }
  };
};

// 2. Generate Embedding Vector
export const generateEmbedding = async (text) => {
  const config = getAiConfig();

  try {
    if (config.provider === "gemini") {
      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: config.key,
        modelName: "text-embedding-004"
      });
      return await embeddings.embedQuery(text);
    } else if (config.provider === "openai") {
      const embeddings = new OpenAIEmbeddings({
        apiKey: config.key
      });
      return await embeddings.embedQuery(text);
    }
  } catch (err) {
    console.error("Error generating actual embedding, falling back to mock:", err.message);
  }

  // Mock embedding vector (768 dimensions for fallback)
  const vector = [];
  for (let i = 0; i < 768; i++) {
    vector.push((text.charCodeAt(i % text.length) || 1) / 128);
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

// 8. Voice Transcription (Whisper) & Text-to-Speech (TTS)
export const transcribeVoice = async (filePath) => {
  const config = getAiConfig();
  if (config.provider === "openai") {
    try {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: config.key });
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-1",
      });
      return transcription.text;
    } catch (err) {
      console.error("Whisper transcription failed:", err);
    }
  }

  // Mock transcription for local testing
  return "[Mock Voice Transcription] Hello! This is a mock transcription of your audio file.";
};

export const synthesizeSpeech = async (text) => {
  const config = getAiConfig();
  const audioDir = path.join('.', 'uploads', 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }
  const filename = `${Date.now()}_ai_voice.mp3`;
  const relativePath = `/uploads/audio/${filename}`;
  const outPath = path.join(audioDir, filename);

  if (config.provider === "openai") {
    try {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: config.key });
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: text,
      });
      const buffer = Buffer.from(await mp3.arrayBuffer());
      await fs.promises.writeFile(outPath, buffer);
      return relativePath;
    } catch (err) {
      console.error("TTS generation failed:", err);
    }
  }

  // Create a silent dummy MP3 for local fallback testing
  const dummyBuffer = Buffer.alloc(100); // 100 bytes mock file
  await fs.promises.writeFile(outPath, dummyBuffer);
  return relativePath;
};
