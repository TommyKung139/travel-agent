import { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChatMessage, ExpenseCategory } from '../services/ai';

interface Props {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
}

const expenseIcons: Record<ExpenseCategory, string> = {
  food: '🍜',
  transport: '🚃',
  shopping: '🛍️',
  lodging: '🏨',
  entertainment: '🎮',
  other: '📌'
};

export default function ChatArea({ messages, onSendMessage, isTyping }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6 relative" style={{ backgroundImage: 'url("/assets/pattern-bg.png")', backgroundSize: '200px', backgroundBlendMode: 'overlay', backgroundColor: 'rgba(255,255,255,0.95)' }}>
        
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <motion.div 
              key={msg.id} 
              className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse self-end' : 'self-start'}`}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
            >
              {!isUser && (
                <motion.div 
                  className="w-8 h-8 rounded-full bg-pikmin-cream flex items-center justify-center shadow-card shrink-0 text-xs"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 3, delay: i * 0.2 }}
                >
                  咻
                </motion.div>
              )}
              
              <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
                {/* Main Bubble */}
                <div className={`px-4 py-3 shadow-sm text-[15px] leading-relaxed ${
                  isUser 
                    ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md' 
                    : 'bg-card border border-border text-foreground rounded-2xl rounded-bl-md shadow-card'
                }`}>
                  {msg.content}
                </div>
                
                {/* Attached Data (if any) */}
                {(msg.location || (msg.expenses && msg.expenses.length > 0)) && (
                  <div className="flex flex-col gap-1 mt-1 shrink-0 w-full">
                    {msg.location && (
                      <div className="inline-flex items-center self-end sm:self-auto gap-1 bg-pikmin-sky/15 text-pikmin-sky px-2.5 py-1 rounded-full text-xs font-bold border border-pikmin-sky/20 w-fit">
                        📍 {msg.location.name}
                      </div>
                    )}
                    {msg.expenses?.map(exp => (
                      <div key={exp.id} className="flex items-center gap-2 bg-pikmin-cream/50 border border-border rounded-xl px-3 py-2 text-sm w-fit self-end sm:self-auto">
                        <span className="text-lg">{expenseIcons[exp.category] || '📌'}</span>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">{exp.description}</span>
                          <span className="font-display font-bold text-pikmin-earth">{exp.currency} {exp.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <span className="text-[10px] text-muted-foreground mx-1">
                  {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </motion.div>
          );
        })}

        {isTyping && (
          <div className="flex items-end gap-2 self-start">
            <motion.div className="w-8 h-8 rounded-full bg-pikmin-cream flex items-center justify-center shadow-card shrink-0 text-xs text-muted-foreground">...</motion.div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-md shadow-card px-4 py-4 flex items-center gap-1">
              {[0, 1, 2].map(dot => (
                <motion.div 
                  key={dot}
                  className="w-2 h-2 rounded-full bg-pikmin-leaf"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: dot * 0.15, ease: "easeInOut" }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-background border-t border-border mt-auto shrink-0 pb-safe">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-card border border-border rounded-2xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/30 transition-shadow">
          <div className="flex items-center gap-1 self-end mb-1 ml-1 text-muted-foreground">
            <button type="button" className="p-2 hover:bg-muted hover:text-pikmin-sky rounded-full transition-colors"><MapPin size={20} /></button>
            <button type="button" className="p-2 hover:bg-muted hover:text-pikmin-bloom rounded-full transition-colors"><Camera size={20} /></button>
          </div>
          
          <textarea 
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="打卡？記帳？問行程？"
            className="flex-1 bg-transparent border-none outline-none resize-none px-2 py-3 text-sm max-h-[120px] min-h-[44px]"
            style={{ fieldSizing: "content" } as any}
          />
          
          <button 
            type="submit" 
            disabled={!input.trim()}
            className="self-end mb-1 mr-1 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-nature text-primary-foreground transition-transform active:scale-90 disabled:opacity-40 disabled:active:scale-100"
          >
            <Send size={18} className="translate-x-[1px] translate-y-[1px]" />
          </button>
        </form>
      </div>
    </div>
  );
}
