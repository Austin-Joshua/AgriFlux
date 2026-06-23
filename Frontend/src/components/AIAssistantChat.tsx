import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Mic, MicOff, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

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
    const { user } = useAuth();
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
            let greet = "👋 Hi! I'm AgriFlux AI. Ask me anything about farming, crops, or climate!";
            if (user?.role === 'agronomist') {
                greet = `👋 Hello Dr. ${user.name.split(' ')[0]}! I'm AgriFlux AI. Ready to retrieve soil analytics, pathological trends, or consultation schedules.`;
            } else if (user?.role === 'admin') {
                greet = "👋 Welcome System Admin! I'm AgriFlux AI. I can monitor active IoT nodes, system metrics, and warning dispatch logs.";
            } else if (user?.role === 'farmer') {
                greet = `👋 Hi ${user.name}! I'm AgriFlux AI. Ask me about crop yields, soil advice, weather forecast, or local mandi prices!`;
            }
            if (lang === 'ta') {
                greet = "வணக்கம்! நான் AgriFlux AI. விவசாயம், மண், பயிர் மற்றும் நீர்ப்பாசனம் பற்றிய உங்கள் கேள்விகளுக்கு பதிலளிக்க தயாராக உள்ளேன்.";
                if (user?.role === 'agronomist') {
                    greet = "வணக்கம் வேளாண் வல்லுநரே! நான் AgriFlux AI. மண் பகுப்பாய்வு, பயிர் நோயியல் மற்றும் ஆலோசனை சந்திப்புகளை நிர்வகிக்க உதவ தயாராக உள்ளேன்.";
                } else if (user?.role === 'admin') {
                    greet = "நிர்வாகி பகுதிக்கு வரவேற்கிறோம்! கணினி நிலை மற்றும் நேரடி IoT முனைகளை நிர்வகிக்க நான் தயாராக உள்ளேன்.";
                }
            }
            setMessages([{
                role: 'assistant',
                text: greet,
                confidence: 100,
            }]);
        }
    }, [user, lang, messages.length]);

    // Build responses based on active language and user role
    const getResponse = (msg: string): { text: string; confidence: number } => {
        const lower = msg.toLowerCase();
        const conf = rndInt(92, 99);
        const role = user?.role || 'farmer';

        if (lang === 'ta') {
            if (role === 'farmer') {
                if (lower.includes('விளைச்சல்') || lower.includes('yield') || lower.includes('crop') || lower.includes('பயிர்')) {
                    return { text: 'நெல் மற்றும் கரும்பு சாகுபடியில் ஏக்கருக்கு முறையே 4,200 கிலோ மற்றும் 45 டன்கள் வரை விளைச்சல் பெறலாம். உகந்த உரம் மற்றும் நீர்ப்பாசனத்தால் 15% வரை விளைச்சல் அதிகரிக்கும்.', confidence: conf };
                }
                if (lower.includes('மண்') || lower.includes('soil')) {
                    return { text: 'உங்கள் மண்ணின் pH அளவு 6.5 ஆகவும், NPK சத்துக்கள் நடுத்தர அளவிலும் உள்ளன. நைட்ரஜன் பற்றாக்குறையை போக்க ஏக்கருக்கு 50 கிலோ யூரியா அல்லது இயற்கை மண்புழு உரம் பயன்படுத்துங்கள்.', confidence: conf };
                }
                if (lower.includes('நீர்') || lower.includes('irrigation') || lower.includes('water')) {
                    return { text: 'சொட்டு நீர்ப்பாசன முறையை கடைப்பிடிப்பதன் மூலம் 30% தண்ணீர் சேமிப்புடன் பயிர் வளர்ச்சி சீராகும். இந்த வாரம் 3 நாட்கள் மட்டுமே நீர்ப்பாசனம் போதுமானது.', confidence: conf };
                }
                if (lower.includes('வானிலை') || lower.includes('climate') || lower.includes('weather')) {
                    return { text: 'அடுத்த 5 நாட்களில் லேசான மழை பெய்ய 65% வாய்ப்புள்ளது. அதிகபட்ச வெப்பநிலை 33°C ஆக இருக்கும். பூச்சி மருந்து தெளிப்பதை 2 நாட்களுக்கு ஒத்திவைக்கவும்.', confidence: conf };
                }
                if (lower.includes('விலை') || lower.includes('market') || lower.includes('price')) {
                    return { text: `தற்போது உங்கள் வட்டார மண்டி நிலவரப்படி நெல் சன்ன ரகம் குவிண்டாலுக்கு ₹${rndInt(2100, 2300)} வரையிலும், தக்காளி பெட்டிக்கு ₹${rndInt(350, 480)} வரையிலும் விற்பனையாகிறது.`, confidence: conf };
                }
                if (lower.includes('உரம்') || lower.includes('fertilizer') || lower.includes('organic')) {
                    return { text: 'அங்கக வேளாண்மைக்கு வேப்பம்பிண்ணாக்கு, பஞ்சகவ்யா மற்றும் தொழு உரம் சிறந்தவை. யூரியா பயன்பாட்டை குறைத்து திரவ நானோ யூரியா பயன்படுத்துவது செலவை மிச்சப்படுத்தும்.', confidence: conf };
                }
                return { text: 'விவசாயி கணக்கில் உள்நுழைந்துள்ளீர்கள். பயிர் சாகுபடி, உரம், நீர்ப்பாசனம், வானிலை மற்றும் மண்டி விலை பற்றி தமிழில் கேளுங்கள்!', confidence: conf };
            }

            if (role === 'agronomist') {
                if (lower.includes('விளைச்சல்') || lower.includes('yield') || lower.includes('crop') || lower.includes('பயிர்')) {
                    return { text: 'விளைச்சல் பகுப்பாய்வின்படி, சராசரி NDVI 0.68 ஆக பதிவாகியுள்ளது. நைட்ரஜன் குறைபாடுள்ள மண்டலங்களை கண்டறிந்து தழைச்சத்து மேலாண்மை அட்டவணையை தயாரிக்குமாறு பரிந்துரைக்கப்படுகிறது.', confidence: conf };
                }
                if (lower.includes('மண்') || lower.includes('soil') || lower.includes('npk')) {
                    return { text: 'மண்ணின் மின் கடத்துத்திறன் (EC) மற்றும் கரிம கார்பன் அளவுகள் பகுப்பாய்வு செய்யப்பட்டுள்ளன. காரத்தன்மை அதிகம் உள்ள நிலங்களுக்கு ஜிப்சம் இடுதல் உகந்தது.', confidence: conf };
                }
                if (lower.includes('நோய்') || lower.includes('disease') || lower.includes('pest') || lower.includes('பூச்சி')) {
                    return { text: 'நெல் குலை நோய் (Blast) மற்றும் இலைக்கருகல் அறிகுறிகள் சில பகுதிகளில் தென்படுகின்றன. ட்ரைசைக்ளோசோல் 1.0 கிராம்/லிட்டர் அளவில் தெளிக்க விவசாயிகளுக்கு அறிவுறுத்தவும்.', confidence: conf };
                }
                if (lower.includes('கலந்தரையாடல்') || lower.includes('consultation') || lower.includes('schedule') || lower.includes('கூட்டம்')) {
                    return { text: 'உங்களுக்கு புதிய ஆலோசனை கோரிக்கைகள் நிலுவையில் உள்ளன. வீடியோ சந்திப்புக்கான நேரங்களை உங்கள் சுயவிவர பக்கத்தில் சரிபார்த்து உறுதி செய்யவும்.', confidence: conf };
                }
                return { text: 'வேளாண் வல்லுநரே! மண்ணின் வேதியியல் பண்புகள், பயிர் நோயியல், ஆலோசனைகள் மற்றும் NDVI பகுப்பாய்வுகள் பற்றி ஏதேனும் உதவி தேவையா?', confidence: conf };
            }

            if (role === 'admin') {
                if (lower.includes('கணினி') || lower.includes('system') || lower.includes('health') || lower.includes('நிலை')) {
                    return { text: 'அனைத்து சேவையகங்களும் (Servers) மற்றும் Socket.IO நுழைவாயிலும் சீராக இயங்குகின்றன. சராசரி API பதில் நேரம் 45ms ஆகும்.', confidence: conf };
                }
                if (lower.includes('சாதனம்') || lower.includes('node') || lower.includes('telemetry') || lower.includes('iot')) {
                    return { text: 'தற்போது 12 IoT சாதனங்கள் நேரலையில் தரவை அனுப்புகின்றன. ESP32 முனையங்கள் 5 வினாடி இடைவெளியில் வெற்றிகரமாக ஒத்திசைக்கப்படுகின்றன.', confidence: conf };
                }
                if (lower.includes('பயனர்') || lower.includes('user') || lower.includes('account')) {
                    return { text: 'இயங்குதளத்தில் மொத்தம் 1,240 விவசாயிகள் மற்றும் 42 வேளாண் வல்லுநர்கள் பதிவு செய்துள்ளனர். புதிய பதிவுகள் இன்று: +18.', confidence: conf };
                }
                return { text: 'தரவுத்தள நிலை, நேரடி IoT முனைகள், கணினி பயன்பாடு மற்றும் எச்சரிக்கை அறிவிப்புகளை நிர்வகிக்க நான் தயாராக உள்ளேன்.', confidence: conf };
            }
        }

        // English responses based on roles
        if (role === 'farmer') {
            if (lower.includes('yield') || lower.includes('crop') || lower.includes('harvest')) {
                return { text: 'Based on current soil conditions, your rice crop yield is projected at 4,200 kg/acre. Keep moisture above 40% to achieve this potential.', confidence: conf };
            }
            if (lower.includes('irrigation') || lower.includes('water')) {
                return { text: 'Smart irrigation schedule recommends watering every 3 days. Drip system is running optimally, reducing water footprint by 30%.', confidence: conf };
            }
            if (lower.includes('soil') || lower.includes('npk')) {
                return { text: 'Your nitrogen (N) levels are slightly low. Apply 45-50 kg/acre Urea or organic compost. Current soil pH is 6.5, which is highly suitable.', confidence: conf };
            }
            if (lower.includes('climate') || lower.includes('weather')) {
                return { text: '7-day forecast shows 65% chance of light rain on Thursday. Temperatures: 24°C - 32°C. postpone spray treatments for 48 hours.', confidence: conf };
            }
            if (lower.includes('fertilizer') || lower.includes('urea') || lower.includes('organic')) {
                return { text: 'For premium crop output, combine bio-fertilizers with nano-urea. Neem-coated urea helps release nutrients slowly and effectively.', confidence: conf };
            }
            if (lower.includes('pest') || lower.includes('disease') || lower.includes('insect')) {
                return { text: 'Warning: High humidity levels increase fungal risks. Apply Pseudomonas fluorescens at 2.5 kg/ha as a preventive biological agent.', confidence: conf };
            }
            if (lower.includes('market') || lower.includes('price')) {
                return { text: `Local Mandi price for Grade A Rice is ₹${rndInt(21, 23)}/kg. Demand is up in Southern markets due to season trends.`, confidence: conf };
            }
            return { text: "As a registered Farmer, I can guide you on crop yields, soil health, drip irrigation, local weather, and mandi prices. Ask me anything!", confidence: conf };
        }

        if (role === 'agronomist') {
            if (lower.includes('soil') || lower.includes('npk') || lower.includes('microbiology') || lower.includes('ph')) {
                return { text: 'Soil chemical profiling shows a cation exchange capacity (CEC) of 18 meq/100g. Recommended treatment: sulfur application to reduce alkalinity in Zone C.', confidence: conf };
            }
            if (lower.includes('disease') || lower.includes('pathology') || lower.includes('pest')) {
                return { text: 'Reported symptoms in NW region point to early leaf blast (Pyricularia oryzae). Suggest Tricyclazole 75% WP spray to prevent spore dissemination.', confidence: conf };
            }
            if (lower.includes('thermal') || lower.includes('intensity') || lower.includes('ndvi') || lower.includes('satellite')) {
                return { text: 'NDVI vegetation indices are stable at 0.68. Sector C shows localized vegetative stress due to lower chlorophyll absorption. Recommended targeted fertilizer.', confidence: conf };
            }
            if (lower.includes('consultation') || lower.includes('schedule') || lower.includes('appointment')) {
                return { text: 'You have video consultation calls scheduled for tomorrow. Please check the Consultations tab to review farmer query logs and join.', confidence: conf };
            }
            return { text: "As an Agronomist, you have access to detailed soil chemistry reports, pathology trends, NDVI maps, and direct booking consultations. Let me know what data you need.", confidence: conf };
        }

        if (role === 'admin') {
            if (lower.includes('system') || lower.includes('status') || lower.includes('health') || lower.includes('cpu')) {
                return { text: 'System status: Normal. CPU utilization is at 12%, RAM usage at 45%. Database replica lag is < 5ms. Redis cache hit rate is 94%.', confidence: conf };
            }
            if (lower.includes('node') || lower.includes('sensor') || lower.includes('telemetry') || lower.includes('iot')) {
                return { text: 'All 12 active ESP32 nodes are successfully pushing telemetry. Zero packet loss reported in the last 60 minutes.', confidence: conf };
            }
            if (lower.includes('user') || lower.includes('account') || lower.includes('login')) {
                return { text: 'User Registry database holds 1,240 active farmers and 42 expert agronomists. Auth tokens are fully rate-limited and signed.', confidence: conf };
            }
            if (lower.includes('database') || lower.includes('db') || lower.includes('mongo')) {
                return { text: 'MongoDB connection pool is holding 15 active connections. Dynamic query optimization is active.', confidence: conf };
            }
            return { text: "System Administrator dashboard connected. I am ready to retrieve logs, report telemetry cluster status, monitor worker processes, or manage active alerts.", confidence: conf };
        }

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
                className="fixed bottom-28 lg:bottom-6 right-4 lg:right-6 w-14 h-14 gradient-green rounded-full shadow-lg dark:shadow-dark-xl flex items-center justify-center text-white hover:scale-110 transition-all duration-200 z-50"
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
