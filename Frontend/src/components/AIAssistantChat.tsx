import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  confidence?: number;
}

const rndInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const CHAT_LANGUAGES = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'hi', label: 'HI', flag: '🇮🇳' },
  { code: 'ta', label: 'TA', flag: '🇮🇳' },
  { code: 'te', label: 'TE', flag: '🇮🇳' },
  { code: 'kn', label: 'KN', flag: '🇮🇳' },
  { code: 'ml', label: 'ML', flag: '🇮🇳' },
];

const TOPIC_KEYWORDS: Record<string, string[]> = {
  yield: ['yield', 'crop', 'harvest', 'விளைச்சல்', 'பயிர்', 'उपज', 'फसल', 'దిగుబడి', 'పంట', 'ಇಳುವರಿ', 'ಬೆಳೆ', 'വിളവ്'],
  soil: ['soil', 'npk', 'மண்', 'मिट्टी', 'మట్టి', 'నేల', 'ಮಣ್ಣು', 'മണ്ണ്'],
  irrigation: ['irrigation', 'water', 'நீர்', 'பாசனம்', 'सिंचाई', 'पानी', 'నీరు', 'నీటిపారుదల', 'ನೀರಾವರಿ', 'ജലസേചനം'],
  climate: ['climate', 'weather', 'rain', 'வானிலை', 'மழை', 'मौसम', 'बारिश', 'వాతావరణం', 'వర్షం', 'ಹವಾಮಾನ', 'ಮಳೆ', 'കാലാവസ്ഥ', 'മഴ'],
  fertilizer: ['fertilizer', 'urea', 'உரம்', 'उर्वरक', 'खाद', 'ఎరువులు', 'ಗೊಬ್ಬರ', 'വളം'],
  pests: ['pest', 'insect', 'பூச்சி', 'कीट', 'తెగుళ్లు', 'పురుగులు', 'ಕೀಟ', 'കീടം'],
  diseases: ['disease', 'blast', 'நோய்', 'रोग', 'వ్యాధి', 'ರೋಗ', 'രോഗം'],
  market: ['market', 'price', 'mandi', 'விலை', 'சந்தை', 'दाम', 'बाजार', 'ధర', 'మార్కెట్', 'ಬೆಲೆ', 'ಮಾರುಕಟ್ಟೆ', 'വില', 'വിപണി'],
  msp: ['msp', 'support price', 'ஆதரவு விலை', 'एमएसपी', 'మద్దతు ధర', 'ಬೆಂಬಲ ಬೆಲೆ', 'താങ്ങുവില'],
  subsidies: ['subsidy', 'scheme', 'திட்டம்', 'மானிய', 'सब्सिडी', 'రాయితీ', 'ಸಬ್ಸಿಡಿ', 'സബ്‌സിഡി'],
  drones: ['drone', 'ட்ரோன்', 'ड्रोन', 'డ్రోన్', 'ಡ್ರೋನ್'],
  satellites: ['satellite', 'ndvi', 'செயற்கைக்கோள்', 'उपग्रह', 'ఉపగ్రహం', 'ಉಪಗ್ರಹ'],
  loans: ['loan', 'credit', 'kcc', 'கடன்', 'ऋण', 'రుణం', 'ಸಾಲ', 'വായ്പ'],
  organic: ['organic', 'இயற்கை', 'जैविक', 'సేంద్రీయ', 'ಸಾವಯವ', 'ജൈവ'],
  seeds: ['seed', 'விதை', 'बीज', 'విత్తనాలు', 'ಬೀಜ', 'വിത്ത്'],
  sustainability: ['sustainability', 'green', 'நிலைத்தன்மை', 'स्थिरता', 'సుస్థిరత', 'ಸುಸ್ಥಿರತೆ', 'സുസ്ഥിരത'],
};

const AIAssistantChat: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentLang = CHAT_LANGUAGES.find((l) => l.code === i18n.language) || CHAT_LANGUAGES[0];

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          text: t('ai.responses.greeting', "👋 Hi! I'm AgriFlux AI. Ask me anything about farming, crops, or climate!"),
          confidence: 100,
        },
      ]);
    }
  }, [t, messages.length]);

  const cycleLanguage = () => {
    const currentIndex = CHAT_LANGUAGES.findIndex((l) => l.code === currentLang.code);
    const nextLang = CHAT_LANGUAGES[(currentIndex + 1) % CHAT_LANGUAGES.length].code;
    i18n.changeLanguage(nextLang);
  };

  const getResponse = (msg: string): { text: string; confidence: number } => {
    const lower = msg.toLowerCase();
    const conf = rndInt(92, 99);

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
        return {
          text: t(`ai.responses.${topic}`, t('ai.responses.default')),
          confidence: conf,
        };
      }
    }

    return {
      text: t('ai.responses.default', "I'm your AgriFlux AI! Ask me about crop yield, irrigation, soil health, climate risk, pests, subsidies, or drones."),
      confidence: conf,
    };
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = async (text?: string) => {
    const userMsg = (text ?? input).trim();
    if (!userMsg) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setTyping(true);
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));
    setTyping(false);
    const { text: responseText, confidence } = getResponse(userMsg);
    setMessages((prev) => [...prev, { role: 'assistant', text: responseText, confidence }]);
  };

  const quickSuggestions = [
    t('ai.tags.yield', 'Yield tips'),
    t('ai.tags.irrigation', 'Irrigation'),
    t('ai.tags.soil', 'Soil health'),
    t('ai.tags.climate', 'Climate risk'),
    t('ai.tags.pests', 'Pest control'),
  ];

  return (
    <>
      {/* Float Button — sits above bottom nav on mobile */}
      <button
        id="ai-chat-button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-28 lg:bottom-6 right-4 lg:right-6 w-14 h-14 gradient-green rounded-full shadow-lg dark:shadow-dark-xl flex items-center justify-center text-white hover:scale-110 transition-all duration-200 z-50"
        aria-label={open ? 'Close AgriFlux AI Assistant' : 'Open AgriFlux AI Assistant'}
        aria-expanded={open}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          role="region"
          aria-label="AgriFlux AI Assistant Chat"
          className="fixed bottom-40 lg:bottom-24 right-4 lg:right-6 w-[340px] sm:w-[420px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 z-50 flex flex-col overflow-hidden animate-slide-up"
          style={{ maxHeight: '540px' }}
        >
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
            {/* Language Switcher */}
            <button
              onClick={cycleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-bold transition-all"
              title={t('header.changeLanguage', 'Change Language')}
            >
              <Globe size={12} />
              <span>{currentLang.flag}</span>
              <span>{currentLang.label}</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'assistant' ? 'gradient-green' : 'bg-gray-200 dark:bg-gray-600'}`}
                >
                  {m.role === 'assistant' ? (
                    <Bot size={12} className="text-white" />
                  ) : (
                    <User size={12} className="text-gray-600 dark:text-gray-300" />
                  )}
                </div>
                <div className="flex flex-col gap-1 max-w-[75%]">
                  <div
                    className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                      m.role === 'assistant'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                        : 'bg-primary-500 text-white rounded-tr-sm'
                    }`}
                  >
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
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          <div className="px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-gray-700/50">
            {quickSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setInput(s);
                  sendMessage(s);
                }}
                className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full hover:bg-primary-100 dark:hover:bg-primary-800/40 transition-colors border border-primary-100 dark:border-primary-800/50"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex gap-2 items-center bg-gray-50/50 dark:bg-gray-800/50">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={t('ai.placeholder', 'Ask about crops, soil, weather, prices...')}
              className="flex-1 text-sm px-4 py-2.5 bg-white dark:bg-gray-700/70 rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-400 dark:focus:border-primary-500 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim()}
              className="w-10 h-10 gradient-green rounded-xl flex items-center justify-center text-white disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform flex-shrink-0 shadow-md shadow-primary-500/20"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistantChat;
