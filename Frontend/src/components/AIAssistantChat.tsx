import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

const AI_RESPONSES: Record<string, string> = {
    default: "I'm your AgriFlux AI assistant! Ask me about crop yield, irrigation schedules, soil health, or climate risk.",
    yield: "For optimal yield, ensure your soil NPK levels are balanced. Rice typically yields 3,500-5,000 kg/ha under good conditions. Use the Yield Prediction module for personalized forecasts.",
    irrigation: "Irrigation should be based on crop water requirements, soil moisture, and weather forecasts. Rice needs 450-700mm of water per season. Check the Irrigation Intelligence module for your schedule.",
    soil: "Healthy soil should have pH 6-7, adequate NPK levels, and >1.5% organic carbon. Add compost regularly and practice crop rotation. Use the Soil Advisor for personalized recommendations.",
    climate: "Climate change is increasing drought and heat stress risks. The Climate Simulator can help you plan for future scenarios. Consider climate-resilient varieties if your risk score is high.",
    fertilizer: "Over-fertilizing wastes money and harms soil health. Apply NPK based on soil test results. Split application (multiple smaller doses) improves uptake efficiency by 20-30%.",
    weather: "Check the Climate Risk Forecasting page for 7-day weather forecasts and seasonal climate trends. Always plan irrigation around rainfall predictions.",
    sustainability: "Your farm sustainability score measures fertilizer efficiency, water conservation, crop diversity, and soil health. Aim for a score above 70 to qualify as sustainable.",
};

const getResponse = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes('yield') || lower.includes('crop') || lower.includes('production')) return AI_RESPONSES.yield;
    if (lower.includes('irrigation') || lower.includes('water') || lower.includes('drip')) return AI_RESPONSES.irrigation;
    if (lower.includes('soil') || lower.includes('npk') || lower.includes('ph') || lower.includes('nitrogen')) return AI_RESPONSES.soil;
    if (lower.includes('climate') || lower.includes('weather') || lower.includes('rain') || lower.includes('drought')) return AI_RESPONSES.climate;
    if (lower.includes('fertilizer') || lower.includes('urea') || lower.includes('compost')) return AI_RESPONSES.fertilizer;
    if (lower.includes('sustainability') || lower.includes('score') || lower.includes('eco')) return AI_RESPONSES.sustainability;
    return AI_RESPONSES.default;
};

interface Message { role: 'user' | 'assistant'; text: string; }

const AIAssistantChat: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', text: "👋 Hi! I'm AgriFlux AI. Ask me anything about farming, crops, or climate!" }
    ]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typing]);

    const sendMessage = async () => {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setTyping(true);
        await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
        setTyping(false);
        setMessages(prev => [...prev, { role: 'assistant', text: getResponse(userMsg) }]);
    };

    return (
        <>
            {/* Float Button */}
            <button
                id="ai-chat-button"
                onClick={() => setOpen(!open)}
                className="fixed bottom-6 right-6 w-14 h-14 gradient-green rounded-full shadow-lg dark:shadow-dark-xl flex items-center justify-center text-white hover:scale-110 transition-all duration-200 z-50"
                aria-label="AI Assistant"
            >
                {open ? <X size={22} /> : <MessageCircle size={22} />}
            </button>

            {/* Chat Panel */}
            {open && (
                <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-dark-xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col overflow-hidden animate-slide-up" style={{ maxHeight: '480px' }}>
                    {/* Header */}
                    <div className="gradient-green p-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                            <Bot size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-sm">AgriFlux AI</p>
                            <p className="text-primary-100 text-xs flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-300 rounded-full inline-block animate-pulse" />
                                Online
                            </p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'assistant' ? 'gradient-green' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                    {m.role === 'assistant' ? <Bot size={12} className="text-white" /> : <User size={12} className="text-gray-600 dark:text-gray-300" />}
                                </div>
                                <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm leading-relaxed ${m.role === 'assistant'
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                                        : 'bg-primary-500 text-white rounded-tr-sm'
                                    }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {typing && (
                            <div className="flex gap-2">
                                <div className="w-7 h-7 rounded-full gradient-green flex items-center justify-center">
                                    <Bot size={12} className="text-white" />
                                </div>
                                <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-xl rounded-tl-sm">
                                    <div className="flex gap-1">
                                        {[0, 1, 2].map(i => (
                                            <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Quick suggestions */}
                    <div className="px-3 py-2 flex gap-2 overflow-x-auto">
                        {['Yield tips', 'Irrigation', 'Soil health', 'Climate risk'].map(s => (
                            <button key={s} onClick={() => { setInput(s); }}
                                className="flex-shrink-0 text-xs px-2.5 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full hover:bg-primary-100 transition-colors">
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            placeholder="Ask about crops, soil, weather..."
                            className="flex-1 text-sm px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800 dark:text-gray-200 placeholder-gray-400"
                        />
                        <button onClick={sendMessage} disabled={!input.trim()}
                            className="w-9 h-9 gradient-green rounded-xl flex items-center justify-center text-white disabled:opacity-50 hover:scale-105 transition-transform">
                            <Send size={15} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIAssistantChat;
