# 💬 Chat Karo

> A modern, real-time messaging, WebRTC calling, and AI-powered collaboration platform built with React, Node.js, Express, Socket.IO, MongoDB, Redis, and Google Gemini AI.

---

## ✨ Features Overview

### 1. 💬 Real-Time Messaging & Chat
- **1-on-1 & Group Chats**: Seamlessly start direct conversations or create active group chats.
- **Instant Message Delivery**: Powered by WebSockets (Socket.IO) for instant message delivery without reloading.
- **Message Delivery Status**: 
  - ✓ **Single Tick**: Message sent to the server.
  - ✓✓ **Double Grey Ticks**: Delivered to recipient.
  - ✓✓ **Double Blue Ticks**: Read/Seen by the recipient.
- **Live Typing Indicators**: See when someone is typing in real time.
- **Real-Time Online/Offline Status**: Green dot when contacts are active, grey dot with last seen when offline.
- **Message Actions**:
  - **Edit Message**: Fix typos in sent messages.
  - **Delete Message**: Choose between *Delete for Me* or *Delete for Everyone*.
  - **Reply / Quote**: Reply directly to any message in the timeline.
  - **Forward Messages**: Forward messages to other chats easily.
  - **Star Messages**: Bookmark essential messages to view them anytime in your Starred Messages tab.
- **Search**: Fast search across all your chats and contacts.

---

### 2. 🤖 Google Gemini AI Copilot
- **AI Assistant in Every Chat**: Click the AI Sparkles icon in the chat composer to chat with Google Gemini (`gemini-1.5-flash`).
- **Live Token Streaming**: Watch the AI type out answers in real time with smooth streaming chunks.
- **Smart Agent Tools**:
  - 🧮 **Calculator**: Solves math problems directly inside the chat.
  - ⛅ **Live Weather**: Instant weather updates for any city.
  - 🌐 **Web Search**: Fetches facts and news from the web.
- **Multimodal Visual AI**: Attach an image and ask Gemini questions about it (e.g., diagrams, photos, screenshots).
- **PDF Knowledge Base (RAG)**: Upload any PDF document to the chat; Gemini will index it and answer questions based on the document.
- **Conversation Summarizer**: Click the Summarize icon in the chat header to generate a quick 3-bullet summary of your conversation.
- **Voice Assistant**: Tap the microphone, speak naturally, and Gemini transcribes your speech and answers you back.

---

### 3. 📞 WebRTC Voice & Video Calling
- **HD Voice Calls**: Crisp, low-latency 1-on-1 audio calls directly in your browser.
- **HD Video Calls**: Full-screen video conversations with peer-to-peer WebRTC streaming.
- **Incoming Call Screen**: Real-time incoming call modal with Accept and Decline buttons and ringtones.
- **In-Call Controls**: Mute/unmute microphone, enable/disable camera, and call timer.
- **Busy Indicator**: Automatically notifies callers if the recipient is already in an active call.

---

### 4. 📸 Status & Stories (24-Hour Disappearing)
- **Share Daily Stories**: Post photo or video updates that automatically disappear after 24 hours.
- **Story Viewer**: Interactive WhatsApp/Instagram-style story viewer with auto-advancing progress bars.
- **View Counters**: Track who viewed your story in real time.

---

### 5. 👥 Group Chats
- **Group Creation**: Create custom groups with a group title, description, and group icon.
- **Member Management**: Group admins can add new participants or remove existing members.
- **Pinned Messages**: Pin important messages to the top of the group header for everyone to see.

---

### 6. 📁 Media & File Sharing
- **Images & Photos**: Upload photos with automatic background WebP optimization.
- **Documents & PDFs**: Share PDF documents and files with download previews.
- **Audio Voice Notes**: Record and send voice messages directly from the composer.
- **Lightbox Preview**: Click on images or videos to view them in fullscreen.

---

### 7. 🔒 Security, Privacy & Account Settings
- **Safe Authentication**: Protected by JSON Web Tokens (JWT) with HTTP-only cookies and automatic token refresh.
- **Multi-Device Session Control**: View all devices and browsers currently logged into your account. Revoke access from a specific device or log out from all other devices with one click.
- **Profile Customization**: Update your display name, email, avatar image, and personal bio/status.
- **Block & Unblock Contacts**: Block nuisance users to prevent them from messaging or calling you.
- **User Reporting**: Report inappropriate accounts with predefined reasons to keep the platform safe.
- **Notifications & Sounds**: Real-time in-app notification center with sound alerts for messages and calls.

---

## 🛠 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Zustand, Lucide Icons, Framer Motion, Sonner Toast
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Cache & Pub/Sub**: Redis (Sessions, presence, and real-time event broadcasting)
- **Real-Time Engine**: Socket.IO
- **Calling**: WebRTC (Peer-to-peer audio & video signaling)
- **Background Tasks**: BullMQ (Media optimization & AI background jobs)
- **AI Integration**: Google Gemini (`gemini-1.5-flash`, `text-embedding-004`) via `@langchain/google-genai` and `@google/generative-ai`

---

## 🚀 How to Run Locally

### 1. Start MongoDB & Redis
Make sure MongoDB and Redis are running locally, or start them using Docker:
```bash
cd backend
docker-compose up -d
```

### 2. Start the Backend Server
```bash
cd backend
npm install
npm run dev
```
> The backend runs on `http://localhost:5000`

### 3. Start the Frontend App
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
> Open `http://localhost:5173` in your browser.

---

## 🔑 Environment Variables

Create a `.env` file in the `backend/` folder:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chat-backend
REDIS_URL=redis://localhost:6379

ACCESS_TOKEN_SECRET=your_jwt_access_secret
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret

# Google Gemini Free AI Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_EMBEDDING_MODEL=text-embedding-004

# Optional: Web Search Tool
TAVILY_API_KEY=
```

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
