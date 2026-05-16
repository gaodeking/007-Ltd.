import { useState, useEffect, useRef } from 'react';
import { broadcastApi } from '../api';

function ChatSidebar() {
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await broadcastApi.getMessages();
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to load broadcast messages');
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const getRarityStyle = (rarity) => {
    switch (rarity) {
      case 'ssr': return 'text-[#f59e0b] font-bold';
      case 'sr': return 'text-[#a855f7]';
      case 'r': return 'text-[#3b82f6]';
      default: return 'text-[#6b5b5b]';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#d4c8c8] p-4 h-full flex flex-col">
      <h3 className="text-lg font-bold text-[#4a3a3a] mb-3">跨服通讯贝</h3>
      <div className="flex-1 bg-[#f5f0f0] rounded-lg p-4 overflow-y-auto text-sm space-y-2">
        {messages.length === 0 ? (
          <div className="text-[#9ca3af] text-center py-4">暂无通讯记录</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`break-words ${getRarityStyle(msg.rarity)}`}>
              {msg.content}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

export default ChatSidebar;
