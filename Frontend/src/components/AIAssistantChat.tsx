import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Message { role: 'user' | 'assistant'; text: string; }

const AIAssistantChat: React.FC = () => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);

    // Initialize first message using translation
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{ role: 'assistant', text: t('ai.responses.greeting', "👋 Hi! I'm AgriFlux AI. Ask me anything about farming, crops, or climate!") }]);
        }
    }, [t, messages.length]);

    const getResponse = (msg: string): string => {
        const lower = msg.toLowerCase();

        // Multi-domain keyword mapping using translated data
        if (lower.includes('yield') || lower.includes('crop') || lower.includes(t('ai.tags.yield').toLowerCase())) return t('ai.responses.yield');
        if (lower.includes('irrigation') || lower.includes('water') || lower.includes(t('ai.tags.irrigation').toLowerCase())) return t('ai.responses.irrigation');
        if (lower.includes('soil') || lower.includes('npk') || lower.includes(t('ai.tags.soil').toLowerCase())) return t('ai.responses.soil');
        if (lower.includes('climate') || lower.includes('weather') || lower.includes(t('ai.tags.climate').toLowerCase())) return t('ai.responses.climate');

        // Expanded topics
        if (lower.includes('fertilizer') || lower.includes('urea') || lower.includes('compost')) return t('ai.responses.fertilizer');
        if (lower.includes('sustainabl') || lower.includes('eco')) return t('ai.responses.sustainability');
        if (lower.includes('pest') || lower.includes('insect') || lower.includes('aphid')) return t('ai.responses.pests');
        if (lower.includes('disease') || lower.includes('fungus')) return t('ai.responses.diseases');
        if (lower.includes('market') || lower.includes('price')) return t('ai.responses.market');
        if (lower.includes('msp') || lower.includes('support price')) return t('ai.responses.msp');
        if (lower.includes('subsidy') || lower.includes('scheme') || lower.includes('government')) return t('ai.responses.subsidies');
        if (lower.includes('drone')) return t('ai.responses.drones');
        if (lower.includes('satellite') || lower.includes('ndvi')) return t('ai.responses.satellites');
        if (lower.includes('loan') || lower.includes('kcc') || lower.includes('credit')) return t('ai.responses.loans');
        if (lower.includes('organic')) return t('ai.responses.organic');
        if (lower.includes('weed') || lower.includes('mulch')) return t('ai.responses.weeds');
        if (lower.includes('harvest')) return t('ai.responses.harvest');
        if (lower.includes('storage') || lower.includes('silo') || lower.includes('grain')) return t('ai.responses.storage');
        if (lower.includes('machine') || lower.includes('tractor') || lower.includes('rent')) return t('ai.responses.machinery');
        if (lower.includes('livestock') || lower.includes('cow') || lower.includes('cattle')) return t('ai.responses.livestock');
        if (lower.includes('seed') || lower.includes('hyv')) return t('ai.responses.seeds');
        if (lower.includes('insurance') || lower.includes('pmfby')) return t('ai.responses.insurance');

        return t('ai.responses.default');
    };
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
                            <p className="font-bold text-white text-sm">{t('ai.title', 'AgriFlux AI')}</p>
                            <p className="text-primary-100 text-xs flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-300 rounded-full inline-block animate-pulse" />
                                {t('ai.online', 'Online')}
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
                    <div className="px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar">
                        {[
                            t('ai.tags.yield', 'Yield tips'),
                            t('ai.tags.irrigation', 'Irrigation'),
                            t('ai.tags.soil', 'Soil health'),
                            t('ai.tags.climate', 'Climate risk')
                        ].map(s => (
                            <button key={s} onClick={() => { setInput(s); }}
                                className="flex-shrink-0 text-xs font-medium px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors border border-primary-100/50 dark:border-primary-800/50">
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
                            placeholder={t('ai.placeholder', 'Ask about crops, soil, weather...')}
                            className="flex-1 text-sm px-3 py-2 bg-gray-100 dark:bg-gray-700/50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-gray-800 dark:text-gray-200 placeholder-gray-400 transition-all"
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
