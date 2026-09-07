import React, { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles, Minimize2 } from "lucide-react";
import axios from "axios";
import "./Chatbot.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const QUICK_ACTIONS = [
  { label: "📝 Resume Tips", message: "Give me tips to improve my resume" },
  { label: "🎯 Job Search", message: "How can I find the right job for me?" },
  { label: "🎤 Interview Prep", message: "Help me prepare for a job interview" },
  { label: "💡 Career Advice", message: "I need career guidance" },
];

const GREETING = {
  role: "bot",
  content:
    "Hi there! 👋 I'm **JobBot**, your AI career assistant. I can help you with:\n\n• 📝 Resume & profile tips\n• 🔍 Job search strategies\n• 🎤 Interview preparation\n• 💼 Career guidance\n\nHow can I help you today?",
  timestamp: new Date(),
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const toggleChat = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      setHasUnread(false);
    } else {
      setIsOpen(false);
    }
  };

  const formatMarkdown = (text) => {
    // Bold
    let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Bullet points
    formatted = formatted.replace(/^[•●]\s?(.+)$/gm, "<li>$1</li>");
    formatted = formatted.replace(
      /(<li>.*<\/li>\n?)+/g,
      (match) => `<ul>${match}</ul>`
    );
    // Numbered lists
    formatted = formatted.replace(/^\d+\.\s(.+)$/gm, "<li>$1</li>");
    // Line breaks
    formatted = formatted.replace(/\n/g, "<br/>");
    // Clean up double br in lists
    formatted = formatted.replace(/<br\/><li>/g, "<li>");
    formatted = formatted.replace(/<\/li><br\/>/g, "</li>");
    return formatted;
  };

  const sendMessage = async (messageText) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMsg = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Build history for API (excluding greeting and current message)
    const history = messages
      .filter((m) => m !== GREETING)
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));

    try {
      const response = await axios.post(`${API_BASE}/api/chatbot/message`, {
        message: text,
        history,
      });

      if (response.data.success) {
        const botMsg = {
          role: "bot",
          content: response.data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);

        if (!isOpen || isMinimized) {
          setHasUnread(true);
        }
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      const errorMsg = {
        role: "bot",
        content:
          "I'm sorry, I couldn't process your request right now. Please try again in a moment. 🔄",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickAction = (message) => {
    sendMessage(message);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`chatbot-window ${isMinimized ? "chatbot-minimized" : ""}`}
          id="chatbot-window"
        >
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar-header">
                <Bot size={20} />
              </div>
              <div>
                <h4 className="chatbot-title">JobBot</h4>
                <span className="chatbot-status">
                  <span className="chatbot-status-dot"></span>
                  Online
                </span>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="chatbot-header-btn"
                aria-label="Minimize"
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={toggleChat}
                className="chatbot-header-btn"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="chatbot-body" ref={chatBodyRef}>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`chatbot-message ${
                      msg.role === "user"
                        ? "chatbot-message-user"
                        : "chatbot-message-bot"
                    } ${msg.isError ? "chatbot-message-error" : ""}`}
                  >
                    {msg.role !== "user" && (
                      <div className="chatbot-msg-avatar">
                        <Bot size={14} />
                      </div>
                    )}
                    <div className="chatbot-msg-content">
                      <div
                        className="chatbot-msg-bubble"
                        dangerouslySetInnerHTML={{
                          __html: formatMarkdown(msg.content),
                        }}
                      />
                      <span className="chatbot-msg-time">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    {msg.role === "user" && (
                      <div className="chatbot-msg-avatar chatbot-msg-avatar-user">
                        <User size={14} />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="chatbot-message chatbot-message-bot">
                    <div className="chatbot-msg-avatar">
                      <Bot size={14} />
                    </div>
                    <div className="chatbot-msg-content">
                      <div className="chatbot-typing">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions — only show when few messages */}
              {messages.length <= 1 && (
                <div className="chatbot-quick-actions">
                  {QUICK_ACTIONS.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickAction(action.message)}
                      className="chatbot-quick-btn"
                      disabled={isLoading}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="chatbot-footer">
                <div className="chatbot-input-wrapper">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="chatbot-input"
                    disabled={isLoading}
                    maxLength={2000}
                    id="chatbot-input"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="chatbot-send-btn"
                    aria-label="Send message"
                    id="chatbot-send-btn"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <div className="chatbot-footer-badge">
                  <Sparkles size={10} />
                  Powered by Gemini AI
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className={`chatbot-fab ${isOpen ? "chatbot-fab-active" : ""}`}
        aria-label="Open chatbot"
        id="chatbot-fab"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <>
            <MessageCircle size={24} />
            {hasUnread && <span className="chatbot-fab-badge"></span>}
          </>
        )}
      </button>
    </>
  );
};

export default Chatbot;
