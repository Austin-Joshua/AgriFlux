import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Mic, MicOff, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Message {
    role: 'user' | 'assistant';
    text: string;
    confidence?: number;
}

// Web Speech API – local interface (avoids lib.dom TS conflicts)
interface ISpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((event: ISpeechRecognitionEvent) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
}
interface ISpeechRecognitionEvent {
    results: { [index: number]: { [index: number]: { transcript: string } } };
}
interface ISpeechRecognitionConstructor { new(): ISpeechRecognition; }
declare global {
    interface Window {
        SpeechRecognition: ISpeechRecognitionConstructor;
        webkitSpeechRecognition: ISpeechRecognitionConstructor;
    }
}

const rndInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const TAMIL_RESPONSES: Record<string, string> = {
    yield:       'உங்கள் நிலத்தில் நெல் சாகுபடி ஏக்கருக்கு 4,200 கிலோ வரை விளைச்சல் கிடைக்கும். உரம் மற்றும் நீர்ப்பாசனம் சரியாக இருந்தால் 15% வரை அதிகரிக்கலாம்.',
    soil:        'உங்கள் மண்ணின் pH அளவு 6.5 ஆக உள்ளது. நைட்ரஜன் சத்து சற்று குறைவாக உள்ளது. இயற்கை உரம் பயன்படுத்துவது நல்லது.',
    irrigation:  'இந்த வாரம் மழை வரும் வாய்ப்பு 70%. நீர்ப்பாசனத்தை 2 நாட்கள் தள்ளிப்போடுங்கள். சொட்டு நீர்ப்பாசனம் 30% நீரை மிச்சப்படுத்தும்.',
    climate:     'வட கிழக்கு பருவமழை நன்றாக இருக்கும். வெப்பநிலை 28°C முதல் 32°C வரை இருக்கும். பயிர்களுக்கு ஏற்ற சீதோஷ்ண நிலை.',
    market:      `தற்போது நெல் விலை கிலோவுக்கு ₹${rndInt(21, 26)} முதல் ₹${rndInt(27, 32)} வரை உள்ளது. ஆந்திரா மற்றும் தெலங்கானா மண்டிகளில் நல்ல தேவை உள்ளது.`,
    default:     'நான் AgriFlux AI. விவசாயம், மண், பயிர், சந்தை விலை பற்றிய கேள்விகளுக்கு உதவுகிறேன். தமிழிலோ அல்லது ஆங்கிலத்திலோ கேளுங்கள்!',
};

const AIAssistantChat: React.FC = () => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [lang, setLang] = useState<'en' | 'ta'>('en');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [listening, setListening] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<ISpeechRecognition | null>(null);

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                text: t('ai.responses.greeting', "👋 Hi! I'm AgriFlux AI. Ask me anything about farming, crops, or climate!"),
                confidence: 100,
            }]);
        }
    }, [t, messages.length]);

    // Build responses based on active language
    const getResponse = (msg: string): { text: string; confidence: number } => {
        const lower = msg.toLowerCase();
        const conf = rndInt(86, 97);

        if (lang === 'ta') {
            if (lower.includes('விளைச்சல்') || lower.includes('yield') || lower.includes('crop')) return { text: TAMIL_RESPONSES.yield, confidence: conf };
            if (lower.includes('மண்') || lower.includes('soil'))         return { text: TAMIL_RESPONSES.soil, confidence: conf };
            if (lower.includes('நீர்') || lower.includes('irrigation') || lower.includes('water')) return { text: TAMIL_RESPONSES.irrigation, confidence: conf };
            if (lower.includes('வானிலை') || lower.includes('climate') || lower.includes('weather')) return { text: TAMIL_RESPONSES.climate, confidence: conf };
            if (lower.includes('விலை') || lower.includes('market') || lower.includes('price'))  return { text: TAMIL_RESPONSES.market, confidence: conf };
            return { text: TAMIL_RESPONSES.default, confidence: conf };
        }

        // English responses
        if (lower.includes('yield') || lower.includes('crop')) 
            return { text: t('ai.responses.yield'), confidence: conf };
        if (lower.includes('irrigation') || lower.includes('water'))
            return { text: t('ai.responses.irrigation'), confidence: conf };
        if (lower.includes('soil') || lower.includes('npk'))
            return { text: t('ai.responses.soil'), confidence: conf };
        if (lower.includes('climate') || lower.includes('weather'))
            return { text: t('ai.responses.climate'), confidence: conf };
        if (lower.includes('fertilizer') || lower.includes('urea'))
            return { text: t('ai.responses.fertilizer'), confidence: conf };
        if (lower.includes('sustainabl') || lower.includes('eco'))
            return { text: t('ai.responses.sustainability'), confidence: conf };
        if (lower.includes('pest') || lower.includes('insect'))
            return { text: t('ai.responses.pests'), confidence: conf };
        if (lower.includes('disease') || lower.includes('fungus'))
            return { text: t('ai.responses.diseases'), confidence: conf };
        if (lower.includes('market') || lower.includes('price'))
            return { text: `${t('ai.responses.market')} Current mandi price: ₹${rndInt(21, 26)}–₹${rndInt(27, 33)}/kg.`, confidence: conf };
        if (lower.includes('subsidy') || lower.includes('government'))
            return { text: t('ai.responses.subsidies'), confidence: conf };
        if (lower.includes('loan') || lower.includes('kcc'))
            return { text: t('ai.responses.loans'), confidence: conf };
        if (lower.includes('machine') || lower.includes('tractor') || lower.includes('rent'))
            return { text: t('ai.responses.machinery'), confidence: conf };
        if (lower.includes('seed'))
            return { text: t('ai.responses.seeds'), confidence: conf };
        if (lower.includes('harvest'))
            return { text: t('ai.responses.harvest'), confidence: conf };
        if (lower.includes('organic'))
            return { text: t('ai.responses.organic'), confidence: conf };
        return { text: t('ai.responses.default'), confidence: conf };
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typing]);

    const sendMessage = async (text?: string) => {
        const userMsg = (text ?? input).trim();
        if (!userMsg) return;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setTyping(true);
        await new Promise(r => setTimeout(r, 900 + Math.random() * 700));
        setTyping(false);
        const { text: responseText, confidence } = getResponse(userMsg);
        setMessages(prev => [...prev, { role: 'assistant', text: responseText, confidence }]);
    };

    // Text-to-Speech (TTS) for responses
    useEffect(() => {
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'assistant') {
                const synth = window.speechSynthesis;
                if (synth) {
                    synth.cancel(); // Stop any previous speech
                    const utterance = new SpeechSynthesisUtterance(lastMsg.text);
                    utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
                    utterance.rate = 1.0;
                    utterance.pitch = 1.0;
                    synth.speak(utterance);
                }
            }
        }
    }, [messages, lang]);

    const toggleVoice = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            alert('Voice input not supported in this browser.');
            return;
        }
        if (listening && recognitionRef.current) {
            recognitionRef.current.stop();
            setListening(false);
            return;
        }
        const recognition = new SR() as ISpeechRecognition;
        recognition.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = (event) => {
            const spoken = event.results[0][0].transcript;
            setInput(spoken);
            setListening(false);
            // Auto-Submit Feature
            sendMessage(spoken);
        };
        recognition.onerror = () => setListening(false);
        recognition.onend = () => setListening(false);
        recognitionRef.current = recognition;
        recognition.start();
        setListening(true);
    };

    return (
        <>
            {/* Float Button — sits above bottom nav on mobile */}
            <button
                id="ai-chat-button"
                onClick={() => setOpen(!open)}
                className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 w-14 h-14 gradient-green rounded-full shadow-lg dark:shadow-dark-xl flex items-center justify-center text-white hover:scale-110 transition-all duration-200 z-50"
                aria-label="AI Assistant"
            >
                {open ? <X size={22} /> : <MessageCircle size={22} />}
            </button>

            {/* Chat Panel */}
            {open && (
                <div className="fixed bottom-40 lg:bottom-24 right-4 lg:right-6 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-dark-xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col overflow-hidden animate-slide-up" style={{ maxHeight: '480px' }}>
                    {/* Header */}
                    <div className="gradient-green p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
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
                        {/* Language Toggle */}
                        <button
                            onClick={() => setLang(l => l === 'en' ? 'ta' : 'en')}
                            className="flex items-center gap-1 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-bold transition-all"
                            title="Toggle Language"
                        >
                            <Globe size={13} />
                            {lang === 'en' ? 'EN' : 'TA'}
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'assistant' ? 'gradient-green' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                    {m.role === 'assistant' ? <Bot size={12} className="text-white" /> : <User size={12} className="text-gray-600 dark:text-gray-300" />}
                                </div>
                                <div className="flex flex-col gap-1 max-w-[75%]">
                                    <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${m.role === 'assistant'
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                                        : 'bg-primary-500 text-white rounded-tr-sm'}`}>
                                        {m.text}
                                    </div>
                                    {m.role === 'assistant' && m.confidence && (
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 pl-1">
                                            Confidence: {m.confidence}%
                                        </span>
                                    )}
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
                        {(lang === 'en'
                            ? [t('ai.tags.yield', 'Yield tips'), t('ai.tags.irrigation', 'Irrigation'), t('ai.tags.soil', 'Soil health'), 'Market price', 'Disease']
                            : ['விளைச்சல்', 'நீர்ப்பாசனம்', 'மண் ஆரோக்கியம்', 'சந்தை விலை']
                        ).map(s => (
                            <button key={s} onClick={() => { setInput(s); sendMessage(s); }}
                                className="flex-shrink-0 text-xs font-medium px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors border border-primary-100/50 dark:border-primary-800/50">
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                        <button
                            onClick={toggleVoice}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-primary-600'}`}
                            title="Voice Input"
                        >
                            {listening ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            placeholder={lang === 'ta' ? 'கேள்வி கேளுங்கள்...' : t('ai.placeholder', 'Ask about crops, soil, weather...')}
                            className="flex-1 text-sm px-3 py-2 bg-gray-100 dark:bg-gray-700/50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-gray-800 dark:text-gray-200 placeholder-gray-400 transition-all"
                        />
                        <button onClick={() => sendMessage()} disabled={!input.trim()}
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
