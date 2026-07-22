import { Worker } from "bullmq";
import { redis } from "../config/redis.js";
import { pub } from "../config/redisPubSub.js";
import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";
import { ToolMessage, SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import {
  getLLM,
  generateEmbedding,
  retrievePdfContext,
  summarizeChatHistory,
  processPdfRag
} from "../services/ai.services.js";
import { tools } from "../services/ai.tools.js";

const worker = new Worker(
  "ai-processing",
  async (job) => {
    const { name, data } = job;
    console.log(`Processing AI job: ${name} (id: ${job.id})`);

    try {
      if (name === "process-ai-reply") {
        const { chatId, messageId, prompt, senderId, imageUrl } = data;

        // 1. Retrieve RAG Context (if any PDFs uploaded)
        const pdfContext = await retrievePdfContext(chatId, prompt);

        // 2. Fetch Conversation History (last 10 messages for memory)
        const pastMessages = await Message.find({ chatId, isDeleted: false })
          .sort({ createdAt: -1 })
          .limit(10);
        pastMessages.reverse();

        const history = pastMessages.map(m => {
          if (m.isAI) {
            return new AIMessage(m.content || "");
          } else {
            return new HumanMessage(m.content || "");
          }
        });

        // 3. Setup System Instructions
        let systemPrompt = `You are a helpful AI Assistant in a real-time collaborative chat.
You have access to tools like a Calculator, Weather info, and Web Search.
Always use tools when you need to perform math, fetch live weather, or search for current news/facts.`;

        if (pdfContext) {
          systemPrompt += `\n\nHere is relevant context from the chat's PDF uploads:\n${pdfContext}\nUse this context to answer the user's question accurately.`;
        }

        const systemMessage = new SystemMessage(systemPrompt);

        // Multimodal Image input handling
        let humanMessageContent = prompt;
        if (imageUrl) {
          // Read local image file and convert to base64 for multimodal LLM prompt
          try {
            const fs = await import('fs');
            const path = await import('path');
            const localPath = path.join('.', imageUrl);
            if (fs.existsSync(localPath)) {
              const imageBuffer = fs.readFileSync(localPath);
              const base64Image = imageBuffer.toString('base64');
              const mimeType = imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
              
              humanMessageContent = [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
              ];
            }
          } catch (err) {
            console.error("Failed to read image for multimodal request:", err);
          }
        }

        const humanMessage = new HumanMessage({ content: humanMessageContent });
        const messages = [systemMessage, ...history, humanMessage];

        // 4. Initial LLM Call (Non-streaming to determine Tool calls)
        let llm = getLLM(false);
        const boundLlm = llm.bindTools ? llm.bindTools(tools) : llm;
        const initialResponse = await boundLlm.invoke(messages);

        let finalMessages = [...messages];

        // 5. Execute Tool Calls if requested
        if (initialResponse.tool_calls && initialResponse.tool_calls.length > 0) {
          console.log(`AI requested tool call: ${initialResponse.tool_calls[0].name}`);
          finalMessages.push(initialResponse);

          for (const toolCall of initialResponse.tool_calls) {
            const targetTool = tools.find(t => t.name === toolCall.name);
            let toolResult = "";
            try {
              if (targetTool) {
                toolResult = await targetTool.invoke(toolCall.args);
              } else {
                toolResult = `Tool ${toolCall.name} not found.`;
              }
            } catch (err) {
              toolResult = `Error executing tool: ${err.message}`;
            }

            finalMessages.push(new ToolMessage({
              content: toolResult,
              tool_call_id: toolCall.id,
              name: toolCall.name
            }));
          }
        }

        // 6. Final LLM Call (Streaming response chunks)
        const streamingLlm = getLLM(true);
        const responseStream = await streamingLlm.stream(finalMessages);

        let fullContent = "";
        let isFirst = true;

        for await (const chunk of responseStream) {
          const text = chunk.content;
          if (text) {
            fullContent += text;
            await pub.publish("AI_STREAM", JSON.stringify({
              chatId,
              messageId,
              chunk: text,
              isFirst,
              isLast: false
            }));
            isFirst = false;
          }
        }

        // Send final chunk
        await pub.publish("AI_STREAM", JSON.stringify({
          chatId,
          messageId,
          chunk: "",
          isFirst: false,
          isLast: true,
          fullText: fullContent
        }));

        // 7. Save complete AI message to the database
        await Message.findByIdAndUpdate(messageId, {
          content: fullContent,
          status: "sent"
        });

        // Trigger message embedding in background
        await redis.lpush("ai-processing", JSON.stringify({
          name: "embed-message",
          data: { messageId, content: fullContent }
        }));
      }

      else if (name === "embed-message") {
        const { messageId, content } = data;
        if (content) {
          const embedding = await generateEmbedding(content);
          await Message.findByIdAndUpdate(messageId, { embedding });
          console.log(`Saved embedding for message: ${messageId}`);
        }
      }

      else if (name === "summarize-chat") {
        const { chatId } = data;
        const summary = await summarizeChatHistory(chatId);
        console.log(`Saved summary for chat: ${chatId}`);
      }

      else if (name === "process-pdf-rag") {
        const { chatId, filePath } = data;
        const chunkCount = await processPdfRag(chatId, filePath);
        console.log(`Indexed PDF for RAG: ${filePath} (${chunkCount} chunks)`);
      }
    } catch (err) {
      console.error(`Error executing AI job ${name}:`, err);
    }
  },
  { connection: redis }
);

export default worker;
