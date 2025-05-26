// src/components/ChatBot.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatBot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m your AI career counselor assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };

    // Optimistically update the UI with the user's message
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Filter out the initial assistant message if it's the first in the 'messages' array
      // This is crucial for the Gemini API's 'history' requirement (must start with 'user').
      const messagesToSendToAPI = messages.filter((msg, index) => {
        // If the first message in the state is from assistant, exclude it from history sent to API
        if (index === 0 && msg.role === 'assistant' && messages.length > 0) {
          return false;
        }
        return true;
      });

      // Now add the new user message to the filtered history to send.
      const fullHistoryForAPI = [...messagesToSendToAPI, userMessage];

      const response = await fetch('/api/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'chat', input: fullHistoryForAPI }),
      });

      let data;
      try {
        // Attempt to parse JSON. This is where "Unexpected end of JSON input" occurs
        // if the server sends an empty or malformed response.
        data = await response.json();
      } catch (jsonError: any) {
        console.error("JSON parsing error:", jsonError);
        // Attempt to read raw response text for better debugging
        const rawResponseText = await response.text();
        console.error("Raw server response text (if available):", rawResponseText);
        throw new Error("Failed to parse server response as JSON. Server might have sent malformed JSON or an empty response. Check server logs.");
      }


      if (!response.ok) {
        // If response.ok is false, 'data' should contain an error object from tool.ts's catch block
        const errorMessage = data.error || 'Failed to get response from API (non-2xx status)';
        console.error("API error response:", errorMessage);
        throw new Error(errorMessage);
      }

      // If response.ok is true, 'data' should contain { content: "AI response" }
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (error: any) {
      console.error('Chat submission error:', error);
      // Display a user-friendly error message in the chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, an error occurred: ${error.message || 'Please try again.'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl border-2 border-blue-500 overflow-hidden transform transition-all duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white flex justify-between items-center">
        <h3 className="font-bold text-lg">Career Counselor AI</h3>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 focus:outline-none"
        >
          ×
        </button>
      </div>

      <div className="h-96 overflow-y-auto p-4 bg-gray-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about careers..."
            className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}