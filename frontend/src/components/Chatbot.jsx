import React, { useState, useRef, useEffect } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Chatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm VoteBot 🤖. Ask me about past election results, party manifestos, sector-wise growth, or how to register and vote on this platform." }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setInput('');
    setSending(true);

    try {
      const endpoint = user ? '/chatbot/ask' : '/chatbot/ask-public';
      const history = newMessages.slice(-6).map(m => ({ role: m.role, text: m.text }));
      const { data } = await api.post(endpoint, { message: text, history });
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Sorry, I could not process that right now. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chatbot-wrapper">
      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <span>🤖 VoteBot — AI Election Assistant</span>
            <button onClick={() => setOpen(false)} aria-label="Close chat">×</button>
          </div>
          <div className="chatbot-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble chat-${m.role}`}>{m.text}</div>
            ))}
            {sending && <div className="chat-bubble chat-bot chat-typing">VoteBot is typing…</div>}
          </div>
          <form className="chatbot-input-row" onSubmit={send}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about elections, manifestos, or how to vote..."
            />
            <button type="submit" disabled={sending}>➤</button>
          </form>
        </div>
      )}
      <button className="chatbot-fab" onClick={() => setOpen(o => !o)} aria-label="Toggle chatbot">
        {open ? '×' : '🤖'}
      </button>
    </div>
  );
}
