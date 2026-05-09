import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, Loader2, Bot } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are the BudgetQuest Assistant. Help users with BudgetQuest features only.

FORMATTING RULES:
- AI replies MUST be broken into short paragraphs.
- Use DOUBLE newlines between EVERY paragraph and EVERY list item.
- Each paragraph should be 1–2 short sentences only.
- For instructions, use numbered steps (1., 2., etc.) on separate lines with double newlines between steps.
- For options, use simple dash bullets (-) with double newlines between bullets.
- DO NOT use Markdown symbols like **, *, _, or backticks.
- Limit answers to 4–6 short lines of text total where possible.
- Maximum of 5 steps for instructions.

TONE & SPEED:
- Respond as fast as possible.
- Be extremely direct and helpful.
- No long intros or outros.

QUICK APP GUIDE:
- Log Expenses: Tap "+" button to scan or type.
- Pockets: Create savings/spending goals.
- Categories: Set budgets for Food, Rent, etc.
- Quests: Earn XP by tracking.
- Social: See leaderboards.
- Nav: Home, Accounts, Categories, Quests, Social, Profile.`;

const SUGGESTIONS = [
  "How do I log a transaction?",
  "Where is my budget?",
  "How to track savings?",
  "How do I earn XP?",
  "What is the Social tab?",
];

interface ChatAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ChatAssistant({ isOpen, onToggle }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am your BudgetQuest Assistant.\n\nAsk me anything about using the app.\n\nI can help you log expenses or set budgets."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: newMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response.text || "I'm sorry, I couldn't process that right now. Please try again." 
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I had trouble connecting. Please try again in a moment." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        onClick={onToggle}
        className={cn(
          "fixed bottom-52 right-4 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-40 group",
          isOpen ? "bg-red-500 text-white" : "bg-dq-card text-dq-green border-2 border-dq-green/30"
        )}
        whileHover={{ rotate: 5 }}
      >
        {isOpen ? <X className="w-6 h-6 border-white" /> : <Bot className="w-7 h-7" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white dark:border-dq-bg rounded-full animate-pulse" />
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-dq-bg shadow-2xl z-50 border-l border-dq-border flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-dq-border bg-dq-card/30 backdrop-blur-md">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-dq-green/10 flex items-center justify-center text-dq-green">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="font-black text-lg tracking-tight uppercase text-dq-text">BudgetQuest Assistant</h3>
                  </div>
                  <p className="text-xs font-bold opacity-50 uppercase tracking-widest leading-none text-dq-text">Ask me how to use the app</p>
                </div>
                <button 
                  onClick={onToggle}
                  className="p-2 hover:bg-dq-bg rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 opacity-40 text-dq-text font-bold" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
            >
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex flex-col gap-1.5",
                    msg.role === 'user' ? "items-end text-right" : "items-start text-left"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] p-4 text-sm font-medium leading-relaxed shadow-sm whitespace-pre-wrap",
                    msg.role === 'user' 
                      ? "bg-dq-green text-white rounded-2xl rounded-tr-none" 
                      : "bg-dq-card text-dq-text border border-dq-border rounded-2xl rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-20 mx-1 text-dq-text">
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="bg-dq-card border border-dq-border p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-dq-green" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-dq-text">Typing...</span>
                  </div>
                </div>
              )}

              {/* Suggestions Chips (appear after every assistant message) */}
              {!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="text-[11px] font-bold px-4 py-2 rounded-full border border-dq-border bg-dq-card text-dq-text hover:bg-dq-green hover:text-white transition-all shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-dq-border bg-dq-card">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="relative"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me something..."
                  className="w-full p-4 pr-16 rounded-2xl bg-dq-bg border border-dq-border font-bold text-sm focus:ring-2 ring-dq-green outline-none transition-all text-dq-text"
                />
                <button
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-2 p-3 bg-dq-green text-white rounded-xl shadow-lg shadow-dq-green/20 disabled:opacity-30 disabled:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
