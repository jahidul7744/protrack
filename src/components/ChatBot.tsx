'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getGeminiResponse, ChatMessage } from '@/src/services/geminiService';
import { cn } from '@/lib/utils';

interface ChatBotProps {
  appContext: string;
}

export function ChatBot({ appContext }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello! I am ProTrack AI. How can I help you manage your projects today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Use the stable and fast 1.5 Flash model for all queries
      let model: 'gemini-1.5-flash' | 'gemini-1.5-flash-latest' = 'gemini-1.5-flash';

      const response = await getGeminiResponse(newMessages, appContext, model);
      setMessages([...newMessages, { role: 'model', text: response }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, y: 30, filter: 'blur(10px)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
              "mb-4 w-[420px] max-w-[calc(100vw-3rem)] shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden border border-white/20 bg-white/80 backdrop-blur-xl ring-1 ring-black/5",
              isMinimized ? "h-16" : "h-[600px]"
            )}
          >
            <div className="h-full flex flex-col">
              <div className="p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground flex flex-row items-center justify-between shadow-lg relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">ProTrack AI</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-[10px] font-medium opacity-80">Online & Ready</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-primary-foreground hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => setIsMinimized(!isMinimized)}
                  >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-primary-foreground hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {!isMinimized && (
                <>
                  <CardContent className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20" ref={scrollRef}>
                    {messages.map((msg, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={cn(
                          "flex gap-3",
                          msg.role === 'user' ? "flex-row-reverse text-right" : "flex-row"
                        )}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                          msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-white border text-primary"
                        )}>
                          {msg.role === 'user' ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
                        </div>
                        <div className={cn(
                          "max-w-[85%] p-3.5 rounded-2xl text-[13.5px] leading-relaxed shadow-sm",
                          msg.role === 'user' 
                            ? "bg-primary text-primary-foreground rounded-tr-none" 
                            : "bg-white border rounded-tl-none text-gray-700"
                        )}>
                          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                            <ReactMarkdown>
                              {msg.text}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex gap-3"
                      >
                        <div className="w-9 h-9 rounded-2xl bg-white border flex items-center justify-center shrink-0 text-primary shadow-sm">
                          <Bot className="w-4.5 h-4.5" />
                        </div>
                        <div className="bg-white border p-3 rounded-2xl rounded-tl-none flex items-center gap-3 shadow-sm">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" />
                          </div>
                          <span className="text-xs text-muted-foreground font-medium italic">ProTrack AI is thinking...</span>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                  
                  <div className="p-4 border-t bg-white/50 backdrop-blur-sm">
                    <form 
                      onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                      className="flex gap-2"
                    >
                      <Input 
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="bg-white border-gray-200/50 focus-visible:ring-primary/20 h-11 rounded-xl shadow-inner text-sm"
                        disabled={isLoading}
                      />
                      <Button type="submit" size="icon" className="h-11 w-11 rounded-xl shadow-lg shadow-primary/20 shrink-0" disabled={isLoading || !input.trim()}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </form>
                    <p className="text-[10px] text-center text-muted-foreground mt-2 font-medium opacity-50">Powered by Gemini · Connected to Live Data</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "w-16 h-16 rounded-[24px] shadow-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden group",
          isOpen ? "bg-white text-primary ring-1 ring-black/5" : "bg-primary text-primary-foreground"
        )}
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {isOpen ? <X className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-primary rounded-full animate-pulse" />
        )}
      </motion.button>
    </div>
  );
}
