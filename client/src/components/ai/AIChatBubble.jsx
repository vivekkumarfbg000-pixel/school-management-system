import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Mic, MicOff, X, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AIChatBubble.css';

const AIChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! How can I help you today? You can say things like "Go to Students" or "Show me fees".' }
  ]);
  const navigate = useNavigate();
  const { token } = useAuth();
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN'; // Better for Hinglish/Indian accents

      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
        handleSendMessage(text);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    
    try {
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transcript: text }),
      });
      
      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'ai', text: data.message || "I'm not sure how to help with that." }]);

      if (data.action === 'navigate' && data.target) {
        setTimeout(() => navigate(data.target), 1000);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting right now." }]);
    }
  };

  return (
    <div className={`ai-assistant-container ${isOpen ? 'open' : ''}`}>
      {!isOpen && (
        <button className="ai-trigger" onClick={() => setIsOpen(true)}>
          <Bot size={24} />
          <span className="pulse-ring"></span>
        </button>
      )}

      {isOpen && (
        <div className="ai-chat-window card">
          <div className="ai-chat-header">
            <div className="ai-brand">
              <Bot size={20} className="text-primary" />
              <span>EduStream AI</span>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="ai-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {isListening && <div className="message ai typing">Listening...</div>}
          </div>

          <div className="ai-input-area">
            <button 
              className={`mic-btn ${isListening ? 'active' : ''}`} 
              onClick={toggleListening}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <input 
              type="text" 
              placeholder="Type a command..." 
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(transcript)}
            />
            <button className="send-btn" onClick={() => handleSendMessage(transcript)}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatBubble;
