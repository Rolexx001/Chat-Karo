import express from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { uploadSingle } from '../../middleware/upload.middleware.js';
import {
  askAi,
  uploadPdfForRag,
  searchSemanticHistory,
  triggerChatSummarize,
  voiceAssistant
} from './ai.controllers.js';

const router = express.Router();

// AI Chat prompt endpoint
router.post('/chat/:chatId/ask', protect, askAi);

// RAG PDF upload endpoint
router.post('/chat/:chatId/pdf', protect, uploadSingle, uploadPdfForRag);

// Semantic search history endpoint
router.get('/chat/:chatId/semantic-search', protect, searchSemanticHistory);

// Periodical/manual chat summary trigger
router.post('/chat/:chatId/summarize', protect, triggerChatSummarize);

// Voice transcription and response assistant
router.post('/voice', protect, uploadSingle, voiceAssistant);

export default router;
