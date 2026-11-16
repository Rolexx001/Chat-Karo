# PulseChat — Frontend Client

A high-performance real-time messaging application frontend built with **React**, **Vite**, **Tailwind CSS**, **Zustand**, and **Socket.IO**. Fully integrated with the PulseChat Node.js + MongoDB + Redis + Groq AI backend.

---

## 🛠 Features

- **⚡ Real-Time Messaging**: Socket.IO bidirectional event flow with instant message delivery, cursor-based pagination, typing indicators, and read receipts.
- **🤖 Groq AI Copilot**: Token-by-token streaming responses with Markdown rendering, PDF upload for Chat RAG retrieval, 3-bullet conversation summarization, and end-to-end voice assistant.
- **📞 WebRTC Calling**: Native peer-to-peer voice and video calls with dynamic ICE server configuration, ringers, mute, camera toggle, and active call duration timers.
- **📸 24-Hour Stories (Status)**: Instagram/WhatsApp-style stories with image/video uploads, captions, progress timers, and viewer metrics.
- **👥 Group Management**: Dynamic member add/remove, chat pinning, and chat clearing.
- **🔒 Multi-Device Session Control**: JWT access token in memory with automatic rotation via HTTP-Only refresh cookie. Remote device revocation listeners.
- **🎨 Custom Midnight Design System**: Dark-first UI tokens, soft violet glow, electric cyan highlights, and responsive layouts.

---

## 🚀 Getting Started

### Prerequisites
Make sure the backend is running at `http://localhost:5000`.

### Install Dependencies
```bash
cd frontend
npm install
```

### Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### Production Build
```bash
npm run build
```
Verify the production build output with:
```bash
npm run preview
```
