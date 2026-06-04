import { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiSend, FiMessageCircle, FiX, FiUser } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';   // a cute robot icon for the assistant

const quickReplies = [
  "My orders",
  "Track delivery",
  "Recommend products",
  "Payment help",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  if (!user) return null;

  // User display info
  const username = user?.username || 'User';
  const userInitial = username.charAt(0).toUpperCase();

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setMessages(prev => [...prev, { sender: 'user', text: msg }]);
    setInput('');
    setTyping(true);
    try {
      const { data } = await chatWithAI(msg);
      setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I'm having trouble. Please try again later." }]);
    } finally {
      setTyping(false);
    }
  };

  const handleQuickReply = (reply) => send(reply);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 bg-green-600 text-white w-14 h-14 rounded-full shadow-xl z-50 flex items-center justify-center text-2xl hover:bg-green-700 transition"
      >
        {open ? <FiX className="w-6 h-6" /> : <FiMessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-5 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Bot avatar in header */}
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <RiRobot2Line className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">FreshMart Assistant</p>
                <p className="text-xs text-green-100">Online • replies instantly</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50" style={{ maxHeight: '350px' }}>
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <RiRobot2Line className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm">How can I help you today?</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {quickReplies.map(reply => (
                    <button
                      key={reply}
                      onClick={() => handleQuickReply(reply)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700 hover:bg-green-50 hover:border-green-300 transition"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <RiRobot2Line className="w-4 h-4 text-green-600" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                    m.sender === 'user'
                      ? 'bg-green-600 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                  }`}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {m.text}
                </div>
                {m.sender === 'user' && (
                  <div className="w-7 h-7 bg-green-700 text-white rounded-full flex items-center justify-center ml-2 flex-shrink-0 mt-1 font-bold text-xs">
                    {userInitial}
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <RiRobot2Line className="w-4 h-4 text-green-600" />
                </div>
                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-md text-sm text-gray-500">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div className="p-3 border-t bg-white">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && send()}
                placeholder="Type your message..."
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim()}
                className="w-9 h-9 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 disabled:opacity-50 transition"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}