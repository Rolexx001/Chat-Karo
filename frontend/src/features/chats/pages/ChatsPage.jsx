import React from 'react';
import { useChatStore } from '../store/chatStore.js';
import ChatList from '../components/ChatList.jsx';
import ChatWindow from '../../messages/components/ChatWindow.jsx';

export const ChatsPage = () => {
  const { chats, activeChatId } = useChatStore();
  const activeChat = chats.find((c) => c._id === activeChatId) || null;

  return (
    <div className="flex-1 flex w-full h-full overflow-hidden bg-[#0B0E14]">
      {/* Conversation List Sidebar */}
      <div
        className={`w-full md:w-auto h-full ${
          activeChatId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ChatList />
      </div>

      {/* Main Chat Workspace */}
      <div
        className={`flex-1 h-full ${
          !activeChatId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ChatWindow chat={activeChat} />
      </div>
    </div>
  );
};

export default ChatsPage;
