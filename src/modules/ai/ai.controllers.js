import Message from '../../models/message.model.js';
import Chat from '../../models/chat.model.js';
import { aiQueue } from '../../jobs/ai.queue.js';
import {
  semanticSearchHistory,
  transcribeVoice,
  synthesizeSpeech,
  getLLM
} from '../../services/ai.services.js';
import { HumanMessage } from '@langchain/core/messages';
import { generateEmbedding } from '../../services/ai.services.js';

// 1. Ask AI Prompt (Asynchronous with Streaming via Sockets)
export const askAi = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { prompt, imageUrl } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt is required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    // A. Save the user's prompt as a message in the chat
    const userMessage = await Message.create({
      chatId,
      sender: req.userId,
      content: prompt,
      mediaUrl: imageUrl || null
    });

    // Generate embedding for user message in background
    const userEmbedding = await generateEmbedding(prompt);
    await Message.findByIdAndUpdate(userMessage._id, { embedding: userEmbedding });

    // B. Create a placeholder message for the AI's response
    // Using a system or specialized sender ID, or simply mapping to a flag isAI
    const aiMessagePlaceholder = await Message.create({
      chatId,
      sender: req.userId, // Map to active session user or system ID
      content: "",
      isAI: true,
      status: "sent"
    });

    // C. Queue the task to run the LangChain Agent in the background worker
    await aiQueue.add("process-ai-reply", {
      chatId,
      messageId: aiMessagePlaceholder._id,
      prompt,
      senderId: req.userId,
      imageUrl
    });

    // Respond immediately with the placeholder message.
    // The client subscribes to ReceiveAIChunk sockets to update the UI in real-time.
    res.status(201).json({
      success: true,
      userMessage,
      aiPlaceholder: aiMessagePlaceholder
    });
  } catch (error) {
    next(error);
  }
};

// 2. Upload PDF for RAG
export const uploadPdfForRag = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No PDF file uploaded" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    // Save memory buffer to disk since upload middleware uses memoryStorage
    const fs = await import('fs');
    const path = await import('path');
    const filename = `${Date.now()}_${req.file.originalname}`;
    const uploadPath = path.join('.', 'uploads', filename);

    if (!fs.existsSync(path.join('.', 'uploads'))) {
      fs.mkdirSync(path.join('.', 'uploads'), { recursive: true });
    }

    fs.writeFileSync(uploadPath, req.file.buffer);

    // Queue PDF indexing
    await aiQueue.add("process-pdf-rag", {
      chatId,
      filePath: uploadPath
    });

    res.status(202).json({
      success: true,
      message: "PDF uploaded successfully. Indexing for RAG in the background..."
    });
  } catch (error) {
    next(error);
  }
};

// 3. Semantic Search Chat History
export const searchSemanticHistory = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    const messages = await semanticSearchHistory(chatId, query);
    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

// 4. Trigger Chat Summarization
export const triggerChatSummarize = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    await aiQueue.add("summarize-chat", { chatId });

    res.status(202).json({
      success: true,
      message: "Chat summarization job queued successfully."
    });
  } catch (error) {
    next(error);
  }
};

// 5. Voice Assistant Endpoint
export const voiceAssistant = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No audio file uploaded" });
    }

    // Save memory buffer to disk for audio transcription
    const fs = await import('fs');
    const path = await import('path');
    const audioDir = path.join('.', 'uploads', 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    const filename = `${Date.now()}_voice_input.wav`;
    const uploadPath = path.join(audioDir, filename);

    fs.writeFileSync(uploadPath, req.file.buffer);

    // A. Transcribe user's audio input to text
    const transcription = await transcribeVoice(uploadPath);

    // Clean up temporary transcription input file
    try {
      fs.unlinkSync(uploadPath);
    } catch (e) {}

    // B. Run LLM on the transcription text to get a textual response
    const llm = getLLM(false);
    const response = await llm.invoke([new HumanMessage(transcription)]);
    const responseText = response.content;

    // C. Synthesize LLM's response back to audio speech
    const audioUrl = await synthesizeSpeech(responseText);

    res.status(200).json({
      success: true,
      prompt: transcription,
      replyText: responseText,
      audioUrl
    });
  } catch (error) {
    next(error);
  }
};
