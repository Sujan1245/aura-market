import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, User, Sparkles } from 'lucide-react';
import { Product, aiService } from '../services/aiService';

export const ChatBot: React.FC<{ contextProducts: Product[] }> = ({ contextProducts }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
        { role: 'assistant', text: "Greetings, I am Aura Superintelligence. How can I refine your shopping experience today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user' as const, text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await aiService.chat([...messages, userMessage], contextProducts);
            setMessages(prev => [...prev, { role: 'assistant', text: response.text }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', text: "My neural pathways are slightly congested. Please try again in a moment." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 h-14 w-14 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-300 flex items-center justify-center hover:scale-110 transition-all z-50 group"
            >
                <div className="absolute -top-12 right-0 bg-white px-4 py-2 rounded-xl text-[10px] font-black text-indigo-600 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity border border-indigo-50 whitespace-nowrap">
                    SUPERINTELLIGENCE ACTIVE
                </div>
                <MessageSquare size={24} />
            </button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-28 right-8 w-[380px] h-[500px] bg-white rounded-[32px] shadow-2xl flex flex-col z-50 border border-gray-100 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 bg-blue-600 text-white flex justify-between items-center shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="h-10 w-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center border border-white/30">
                                    <Bot size={22} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm tracking-tight text-white">Aura Superintelligence</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                                        <p className="text-[9px] text-blue-100 font-black tracking-widest uppercase">Online & Learning</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors relative z-10">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                        m.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-tr-none' 
                                            : 'bg-white text-slate-700 rounded-tl-none border border-gray-100 font-medium'
                                    }`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 italic text-xs text-blue-600 font-black flex items-center gap-3 shadow-sm">
                                        <div className="flex gap-1">
                                            <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce" />
                                            <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-.3s]" />
                                            <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-.5s]" />
                                        </div>
                                        Processing patterns...
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-5 border-t border-gray-100 bg-white">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ask anything about our catalog..."
                                    className="w-full bg-slate-50 border-gray-200 border rounded-xl py-3 pl-4 pr-12 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800"
                                />
                                <button 
                                    onClick={handleSend}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-md shadow-blue-100"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
