import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Mic, MicOff, X, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import './AIChatBubble.css';

const AIChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Operational. I am EduStream AI. State your command or query for immediate processing.' }
  ]);
  const navigate = useNavigate();
  const { token } = useAuth();
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isListening]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';

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
    setTranscript('');
    
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
      
      setMessages(prev => [...prev, { role: 'ai', text: data.message || "Query resolution failed. State alternative parameters." }]);

      if (data.action === 'navigate' && data.target) {
        setTimeout(() => navigate(data.target), 1000);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Uplink disrupted. Check network integrity." }]);
    }
  };

  return (
    <div className="ai-assistant-container">
      <AnimatePresence>
        {!isOpen && (
          <motion.button 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            className="ai-trigger" 
            onClick={() => setIsOpen(true)}
          >
            <Sparkles size={28} />
            <span className="pulse-ring"></span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
            className="ai-chat-window glass-card"
          >
            <div className="ai-chat-header">
              <div className="ai-brand">
                <div className="ai-icon-mini">
                  <Sparkles size={14} color="black" />
                </div>
                <span>CYBER ASSISTANT</span>
                <div className="status-indicator online"></div>
              </div>
              <button className="btn-icon" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="ai-messages">
              {messages.map((msg, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: msg.role === 'ai' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`message ${msg.role}`}
                >
                  {msg.text}
                </motion.div>
              ))}
              {isListening && (
                <div className="message ai typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="ai-input-area">
              <button 
                className={`mic-btn ${isListening ? 'active' : ''}`} 
                onClick={toggleListening}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <input 
                type="text" 
                placeholder="Synchronizing protocol..." 
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(transcript)}
              />
              <button className="send-btn" onClick={() => handleSendMessage(transcript)}>
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIChatBubble;
