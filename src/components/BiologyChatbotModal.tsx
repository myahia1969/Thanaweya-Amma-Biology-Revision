import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Send, 
  User, 
  X, 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  Minimize2, 
  Maximize2, 
  HelpCircle, 
  MessageSquare,
  RefreshCw,
  Lightbulb,
  Zap,
  BookOpen
} from 'lucide-react';
import { LectureData } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
}

interface BiologyChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLecture?: LectureData;
  allLectures?: LectureData[];
  onNavigateToLecture?: (lectureId: number, tab?: string) => void;
}

const PRESET_SUGGESTIONS = [
  { label: '🧮 مسألة حسابية', prompt: 'كيف أحسب عدد القطع العضلية، مناطق H، وسلاسل الـ Z-lines في اللييفة العضلية؟' },
  { label: '🧬 تريكات الـ DNA', prompt: 'ما الفرق الحقيقي بين كودونات الوقف وكودون البدء AUG ولماذا لا تشفر حمضاً أمينياً؟' },
  { label: '🛡️ المناعة والخلايا', prompt: 'اشرح لي الفرق التنافسي بين الخلايا التائية القاتلة Tc والخلايا القاتلة الطبيعية NK' },
  { label: '⚡ اختبار تريكات', prompt: 'اطرح عليّ سؤالاً ذكياً من مستويات العليا في التنسيق الهرموني واختبر فهمي' },
  { label: '📖 ملخص سريع', prompt: 'اعطني ملخصاً مركزاً لأهم نقاط وتريكات الامتحانات في الفصل الحالي' }
];

export const BiologyChatbotModal: React.FC<BiologyChatbotModalProps> = ({
  isOpen,
  onClose,
  currentLecture,
  allLectures,
  onNavigateToLecture
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('thanaweya_chatbot_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'welcome-1',
        role: 'bot',
        content: `أهلاً بك يا بطل! 👋 أنا **مستشار الأحياء التفاعلي** لشهادة الثانوية العامة.\n\nأنا هنا لمساعدتك في:\n- ⚡ **حل وتفسير المسائل البيولوجية والقوانين**\n- 🧬 **توضيح التريكات والمفاهيم الشائعة والغامضة**\n- 🛡️ **ربط الفصول وشرح أجزاء المنهج بدقة علمية**\n\nكيف يمكنني مساعدتك اليوم؟ يمكنك كتابة سؤالك مباشرةً أو اختيار أحد الأسئلة السريعة أدناه!`,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  // Persist messages in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('thanaweya_chatbot_history', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!textToSend) setInputPrompt('');
    setIsLoading(true);

    try {
      // Build context string
      const topicsText = currentLecture?.topicsCovered ? currentLecture.topicsCovered.join('، ') : (currentLecture?.subtitle || '');
      const lectureContext = currentLecture 
        ? `المحاضرة الحالية: ${currentLecture.arabicTitle} (الفصل ${currentLecture.id}) - المواضيع: ${topicsText}`
        : 'منهج الأحياء العام للثانوية العامة';

      const payloadMessages = newHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          currentLectureContext: lectureContext
        })
      });

      if (!res.ok) {
        throw new Error('فشل الاتصال بخادم المعالجة الذكية');
      }

      const data = await res.json();
      
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        content: data.reply || 'عذراً، حدث خطأ أثناء إعداد الإجابة. يرجى المحاولة مرة أخرى.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'bot',
        content: '⚠️ عذراً، يتعذر الاتصال بالمساعد الذكي حالياً. يرجى التحقق من اتصال الشبكة وإعادة المحاولة.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const welcomeMsg: ChatMessage = {
      id: `welcome-${Date.now()}`,
      role: 'bot',
      content: 'تم البدء بمحادثة جديدة! تسعدني مساعدتك في أي سؤال بالأحياء 🧬',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcomeMsg]);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md dir-rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden transition-all duration-300 relative ${
          isExpanded ? 'w-full h-[95vh] max-w-5xl' : 'w-full max-w-2xl h-[85vh]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 animate-bounce" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  مستشار الأحياء التفاعلي
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> ذكاء اصطناعي
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5 flex items-center gap-1.5">
                {currentLecture ? (
                  <span>سياق المحاضرة الحالية: <strong className="text-amber-400">{currentLecture.arabicTitle}</strong></span>
                ) : (
                  <span>منهج الثانوية العامة الحديث (علمي علوم)</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearHistory}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="مسح المحادثة والبدء من جديد"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer hidden md:block"
              title={isExpanded ? 'تصغير الشباك' : 'توسيع الشباك'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message List Scroll Container */}
        <div className="flex-1 p-4 md:p-5 overflow-y-auto space-y-4 font-sans bg-slate-900/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                msg.role === 'user' ? 'mr-auto flex-row-reverse' : 'ml-auto'
              }`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold border shadow-sm ${
                msg.role === 'user'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-1">
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed border relative shadow-md ${
                    msg.role === 'user'
                      ? 'bg-amber-600/20 border-amber-500/40 text-amber-50 rounded-tl-none'
                      : 'bg-slate-950/80 border-slate-800 text-slate-200 rounded-tr-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                    {msg.content}
                  </div>

                  {/* Copy Button for Bot Messages */}
                  {msg.role === 'bot' && (
                    <div className="flex justify-end pt-2 border-t border-slate-850/60 mt-2">
                      <button
                        onClick={() => handleCopyText(msg.id, msg.content)}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedMessageId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>نسخ الإجابة</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className={`text-[10px] text-slate-500 ${msg.role === 'user' ? 'text-left' : 'text-right'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-[80%] ml-auto">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl rounded-tr-none text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-150" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-300" />
                <span className="text-[11px] font-sans mr-2 text-slate-300">جاري تحليل التريكة وتوليد الإجابة النموذجية...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-850/60 overflow-x-auto flex items-center gap-2 shrink-0 scrollbar-none">
          <span className="text-[10px] font-bold text-amber-400 shrink-0 flex items-center gap-1">
            <Zap className="w-3 h-3" /> مقترحات سريعة:
          </span>
          {PRESET_SUGGESTIONS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(preset.prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-200 text-[11px] font-sans rounded-lg whitespace-nowrap cursor-pointer transition-all shrink-0"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 md:p-4 bg-slate-950 border-t border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="اكتب سؤالك في الأحياء هنا... (مثال: احسب المسافة، اشرح وظيفة خلايا سرتولي...)"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
            />

            <button
              type="submit"
              disabled={!inputPrompt.trim() || isLoading}
              className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                inputPrompt.trim() && !isLoading
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
