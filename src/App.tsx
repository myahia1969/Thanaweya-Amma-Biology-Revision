import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  HelpCircle, 
  Layers, 
  Sliders, 
  TrendingUp, 
  Calculator, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft, 
  Compass, 
  FileText, 
  Info,
  Award,
  Search,
  BookMarked,
  Sparkles,
  Plus,
  RefreshCw,
  Trash2,
  BarChart3,
  Calendar,
  Zap,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Bell,
  BellRing,
  Bot,
  Network,
  GraduationCap,
  AlertTriangle,
  ShieldCheck,
  Filter,
  Wifi,
  WifiOff,
  Database,
  Maximize2,
  Minimize2,
  Target,
  Globe,
  Type,
  Mic,
  MicOff,
  Volume2,
  Loader2,
  BrainCircuit
} from 'lucide-react';
import { allLectures } from './data';
import { biologyFlashcards, Flashcard } from './data/flashcards';
import { fallbackQuestions } from './data/fallbackQuestions';
import { MCQQuestion, LectureData } from './types';
import { biologyFormulas, BiologyFormula } from './data/biologyFormulas';
import { DailyTrickChallenge } from './components/DailyTrickChallenge';
import { StudyRemindersModal, StudyReminder } from './components/StudyRemindersModal';
import { BiologyChatbotModal } from './components/BiologyChatbotModal';
import { ConceptMapTool } from './components/ConceptMapTool';
import { GuidanceModel2026Tool } from './components/GuidanceModel2026Tool';
import { SpeedQuizTool } from './components/SpeedQuizTool';
import { MistakeBankTool } from './components/MistakeBankTool';
import { MockExamTool } from './components/MockExamTool';
import { PastExamsEgyptTool } from './components/PastExamsEgyptTool';
import { GlobalBenchmarkAnalyticsTool } from './components/GlobalBenchmarkAnalyticsTool';
import { FormulasSheetTool } from './components/FormulasSheetTool';
import { FloatingFormulaModal } from './components/FloatingFormulaModal';

export default function App() {
  // Theme Toggle State - Default is Elegant Dark
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('thanaweya_theme') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('thanaweya_theme', next);
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Offline / Service Worker Connectivity State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setFlashcardToast('🟢 تم استعادة الاتصال بالإنترنت.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setFlashcardToast('📡 تعذر الاتصال بالإنترنت - المنصة تعمل الآن بالكامل في الوضع الأوفلاين ⚡');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Navigation & Selector States
  const [selectedLectureId, setSelectedLectureId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>('concepts');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Voice Search States
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceInterimText, setVoiceInterimText] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsVoiceListening(false);
    setVoiceInterimText('');
  };

  const startVoiceSearch = () => {
    setVoiceError(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setVoiceError('خاصية التعرف على الصوت غير مدعومة في هذا المتصفح. يمكنك اختيار أحد مفاهيم النطق المقترحة بالأسفل.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-EG';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsVoiceListening(true);
        setVoiceInterimText('');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setVoiceInterimText(currentTranscript);
        setSearchQuery(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        setIsVoiceListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError('يرجى السماح بصلاحية الميكروفون للبحث الصوتي في الإعدادات.');
        } else if (event.error === 'no-speech') {
          setVoiceError('لم يتم التقاط صوت. تحدث بوضوح بالقرب من الميكروفون.');
        } else {
          setVoiceError('تعذر التقاط الصوت. يمكنك المحاولة مجدداً أو النقر على اقتراحات الصوت.');
        }
      };

      recognition.onend = () => {
        setIsVoiceListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsVoiceListening(false);
      setVoiceError('تعذر تشغيل الميكروفون. يرجى إعطاء الصلاحية.');
    }
  };

  // Find active lecture
  const activeLecture = useMemo(() => {
    return allLectures.find(l => l.id === selectedLectureId) || allLectures[0];
  }, [selectedLectureId]);

  // Search through all lectures' concepts or tricks
  const filteredSearchLectures = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allLectures.map(l => {
      const matchingConcepts = l.concepts.filter(c => 
        c.arabicTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.details.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchingTricks = l.tricks.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.coreConcept.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return {
        ...l,
        matchingConcepts,
        matchingTricks
      };
    }).filter(l => l.matchingConcepts.length > 0 || l.matchingTricks.length > 0);
  }, [searchQuery]);

  // Interactive Tools - Sarcomere Slider (Lecture 1)
  const [sarcomereSlider, setSarcomereSlider] = useState<number>(30); // 0 = relaxed, 100 = fully contracted

  // Interactive Tools - Calcium feedback level selector (Lecture 2)
  const [calciumLevel, setCalciumLevel] = useState<'high' | 'low' | 'normal'>('normal');

  // Interactive Tools - Menstrual cycle day selector (Lecture 4)
  const [menstrualDay, setMenstrualDay] = useState<number>(14);

  // Myofibril Calculator (Lecture 1)
  const [calcN, setCalcN] = useState<number>(5);

  // Custom & AI Generated Questions States
  const [customQuestions, setCustomQuestions] = useState<Record<number, MCQQuestion[]>>(() => {
    try {
      const saved = localStorage.getItem('thanaweya_custom_questions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Student Cumulative Performance Analytics
  const [studentPerformance, setStudentPerformance] = useState<Record<number, {
    lectureId: number;
    lectureTitle: string;
    totalAnswered: number;
    correctAnswers: number;
    percentage: number;
    lastAttemptDate: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('thanaweya_student_performance');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const updatePerformance = (lecId: number, lecTitle: string, correct: number, total: number) => {
    if (total === 0) return;
    setStudentPerformance(prev => {
      const percentage = Math.round((correct / total) * 100);
      const updated = {
        lectureId: lecId,
        lectureTitle: lecTitle,
        totalAnswered: total,
        correctAnswers: correct,
        percentage: percentage,
        lastAttemptDate: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
      };
      const next = { ...prev, [lecId]: updated };
      localStorage.setItem('thanaweya_student_performance', JSON.stringify(next));
      return next;
    });
  };

  const handleLoadDemoPerformance = () => {
    const demo = {
      1: { lectureId: 1, lectureTitle: allLectures[0].arabicTitle, totalAnswered: 25, correctAnswers: 22, percentage: 88, lastAttemptDate: "٢ يوليو ٢٠٢٦" },
      2: { lectureId: 2, lectureTitle: allLectures[1].arabicTitle, totalAnswered: 20, correctAnswers: 13, percentage: 65, lastAttemptDate: "٣ يوليو ٢٠٢٦" },
      3: { lectureId: 3, lectureTitle: allLectures[2].arabicTitle, totalAnswered: 30, correctAnswers: 12, percentage: 40, lastAttemptDate: "١ يوليو ٢٠٢٦" },
      4: { lectureId: 4, lectureTitle: allLectures[3].arabicTitle, totalAnswered: 15, correctAnswers: 14, percentage: 93, lastAttemptDate: "٢٥ يونيو ٢٠٢٦" },
      5: { lectureId: 5, lectureTitle: allLectures[4].arabicTitle, totalAnswered: 10, correctAnswers: 7, percentage: 70, lastAttemptDate: "٢٨ يونيو ٢٠٢٦" }
    };
    setStudentPerformance(demo);
    localStorage.setItem('thanaweya_student_performance', JSON.stringify(demo));
    setFlashcardToast('📊 تم تحميل البيانات الاسترشادية للتحليل بنجاح!');
  };

  const handleClearPerformance = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح سجل أدائك بالكامل وإعادة تعيين المؤشرات؟')) {
      setStudentPerformance({});
      localStorage.removeItem('thanaweya_student_performance');
      setFlashcardToast('🧹 تم تصفير سجل الأداء والتحليل بالكامل.');
    }
  };

  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Reading Mode State (وضع القراءة المريحة للعين في تبويب الشرح والمفاهيم)
  const [isReadingMode, setIsReadingMode] = useState<boolean>(false);
  const [readingFontSize, setReadingFontSize] = useState<number>(19); // 16px, 19px, 22px, 26px
  const [readingLineHeight, setReadingLineHeight] = useState<number>(1.85); // 1.5, 1.85, 2.1, 2.4
  const [readingTheme, setReadingTheme] = useState<'sepia' | 'slate' | 'oled' | 'midnight'>('sepia');
  const [readingMaxWidth, setReadingMaxWidth] = useState<'focused' | 'comfortable' | 'full'>('focused');
  const [showReadingControls, setShowReadingControls] = useState<boolean>(false);

  // Computed styles for Reading Mode theme
  const readingThemeStyles = useMemo(() => {
    switch (readingTheme) {
      case 'sepia':
        return {
          cardBg: 'bg-[#1c1916]/95 border-[#382d24] text-[#e7e5e4] shadow-2xl',
          headerBorder: 'border-[#382d24]',
          titleColor: 'text-amber-300 font-extrabold',
          headingColor: 'text-amber-200',
          accentText: 'text-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          summaryBg: 'bg-[#15120f] border-[#382d24] border-r-4 border-r-amber-500',
          summaryTitle: 'text-amber-400',
          qaBg: 'bg-[#15120f] border-amber-500/30',
          qaBoxBg: 'bg-[#1c1916] border-[#382d24]',
          qaAnsBg: 'bg-[#15120f] border-amber-500/30 text-amber-200/90 border-r-amber-500',
          strongColor: 'text-amber-200',
        };
      case 'oled':
        return {
          cardBg: 'bg-black border-zinc-800 text-zinc-100 shadow-2xl',
          headerBorder: 'border-zinc-800',
          titleColor: 'text-white font-extrabold',
          headingColor: 'text-emerald-400',
          accentText: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          summaryBg: 'bg-zinc-950 border-zinc-800 border-r-4 border-r-emerald-500',
          summaryTitle: 'text-emerald-400',
          qaBg: 'bg-zinc-950 border-zinc-800',
          qaBoxBg: 'bg-black border-zinc-800',
          qaAnsBg: 'bg-zinc-950 border-emerald-500/30 text-emerald-300 border-r-emerald-500',
          strongColor: 'text-white',
        };
      case 'midnight':
        return {
          cardBg: 'bg-[#0b132b]/95 border-[#1c2541] text-[#e2e8f0] shadow-2xl',
          headerBorder: 'border-[#1c2541]',
          titleColor: 'text-cyan-300 font-extrabold',
          headingColor: 'text-cyan-200',
          accentText: 'text-cyan-400',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          summaryBg: 'bg-[#070d1f] border-[#1c2541] border-r-4 border-r-cyan-500',
          summaryTitle: 'text-cyan-400',
          qaBg: 'bg-[#070d1f] border-cyan-500/30',
          qaBoxBg: 'bg-[#0b132b] border-[#1c2541]',
          qaAnsBg: 'bg-[#070d1f] border-cyan-500/30 text-cyan-200/90 border-r-cyan-500',
          strongColor: 'text-cyan-100',
        };
      case 'slate':
      default:
        return {
          cardBg: 'bg-slate-900/90 border-slate-800 text-slate-200 shadow-xl',
          headerBorder: 'border-slate-800',
          titleColor: 'text-white font-extrabold',
          headingColor: 'text-emerald-400',
          accentText: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          summaryBg: 'bg-slate-950/70 border-slate-800 border-r-4 border-r-emerald-500',
          summaryTitle: 'text-slate-400',
          qaBg: 'bg-slate-950/70 border-indigo-500/30',
          qaBoxBg: 'bg-slate-900/80 border-slate-800',
          qaAnsBg: 'bg-slate-950/80 border-emerald-500/20 text-emerald-300/90 border-r-emerald-500',
          strongColor: 'text-white',
        };
    }
  }, [readingTheme]);

  const readingContainerWidthClass = useMemo(() => {
    if (!isReadingMode) return 'w-full';
    switch (readingMaxWidth) {
      case 'focused':
        return 'max-w-3xl mx-auto';
      case 'comfortable':
        return 'max-w-4xl mx-auto';
      case 'full':
      default:
        return 'w-full';
    }
  }, [isReadingMode, readingMaxWidth]);

  // Keydown listener to exit focus mode on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
        setFlashcardToast('🔓 تم الخروج من وضع التركيز وإعادة الترويسة.');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  const [quizMode, setQuizMode] = useState<'built-in' | 'extended'>('built-in');
  const [quizSubTab, setQuizSubTab] = useState<'practice' | 'speed_quiz' | 'mistake_bank' | 'mock_exam'>('practice');
  const [performanceSubTab, setPerformanceSubTab] = useState<'benchmark_gaps' | 'overview'>('benchmark_gaps');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'high'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'past_exams' | 'expectations_2026' | 'conceptual' | 'calculations'>('all');
  const [generationLoading, setGenerationLoading] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatorDifficulty, setGeneratorDifficulty] = useState<'easy' | 'medium' | 'high'>('medium');

  // Combine built-in with fallbacks and custom questions for practice
  const extendedQuestionPool = useMemo(() => {
    const builtIn = activeLecture.questionBank;
    const fallbacks = fallbackQuestions[selectedLectureId] || [];
    const custom = customQuestions[selectedLectureId] || [];
    
    // Merge them and filter duplicates by ID
    const seenIds = new Set<string>();
    const all = [...builtIn, ...fallbacks, ...custom];
    return all.filter(q => {
      if (seenIds.has(q.id)) return false;
      seenIds.add(q.id);
      return true;
    });
  }, [selectedLectureId, activeLecture.questionBank, customQuestions]);

  // Filter questions by difficulty and source category
  const filteredQuestions = useMemo(() => {
    const pool = quizMode === 'built-in' ? activeLecture.questionBank : extendedQuestionPool;
    
    return pool.filter(q => {
      const diffStr = q.complexity?.toLowerCase() || '';
      const sourceStr = q.sourceYear?.toLowerCase() || '';
      const text = q.questionText || '';

      // 1. Difficulty Filter
      let passDiff = true;
      if (difficultyFilter === 'high') {
        passDiff = diffStr === 'high' || sourceStr.includes('عليا') || sourceStr.includes('صعبة');
      } else if (difficultyFilter === 'medium') {
        passDiff = diffStr === 'medium' || sourceStr.includes('متوسط');
      } else if (difficultyFilter === 'easy') {
        passDiff = diffStr === 'easy' || sourceStr.includes('سهل');
      }

      if (!passDiff) return false;

      // 2. Source & Type Category Filter
      if (sourceFilter === 'all') return true;
      if (sourceFilter === 'past_exams') {
        return sourceStr.includes('دور') || sourceStr.includes('تجريبي') || sourceStr.includes('امتحان') || sourceStr.includes('2021') || sourceStr.includes('2022') || sourceStr.includes('2023') || sourceStr.includes('2024') || sourceStr.includes('2025');
      }
      if (sourceFilter === 'expectations_2026') {
        return sourceStr.includes('2026') || sourceStr.includes('توقعات') || sourceStr.includes('استرشادي') || sourceStr.includes('نموذج');
      }
      if (sourceFilter === 'conceptual') {
        return text.includes('سبب') || text.includes('فسر') || text.includes('يعلل') || text.includes('مفهوم') || text.includes('أهمية') || text.includes('ماذا يحدث') || sourceStr.includes('مفهوم');
      }
      if (sourceFilter === 'calculations') {
        return text.includes('عدد') || text.includes('نسبة') || text.includes('حساب') || text.includes('قانون') || text.includes('%') || text.includes('كم') || text.includes('قطع');
      }

      return true;
    });
  }, [quizMode, activeLecture.questionBank, extendedQuestionPool, difficultyFilter, sourceFilter]);

  // Quiz Engine States
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizAnswersHistory, setQuizAnswersHistory] = useState<Array<{ qId: string, isCorrect: boolean, chosen: string }>>([]);

  const activeQuestion = useMemo(() => {
    return filteredQuestions[currentQuestionIndex] || filteredQuestions[0];
  }, [filteredQuestions, currentQuestionIndex]);

  // Handler to add custom questions
  const handleAddCustomQuestions = (lectureId: number, newQs: MCQQuestion[]) => {
    setCustomQuestions(prev => {
      const current = prev[lectureId] || [];
      const filteredNew = newQs.filter(nq => !current.some(cq => cq.id === nq.id));
      const updated = [...current, ...filteredNew];
      const next = { ...prev, [lectureId]: updated };
      localStorage.setItem('thanaweya_custom_questions', JSON.stringify(next));
      return next;
    });
  };

  // Clear custom question bank for current lecture
  const handleClearCustomQuestions = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف الأسئلة الإضافية المخصصة لهذا الفصل وإعادة تعيين البنك؟')) {
      setCustomQuestions(prev => {
        const next = { ...prev, [selectedLectureId]: [] };
        localStorage.setItem('thanaweya_custom_questions', JSON.stringify(next));
        return next;
      });
      setQuizMode('built-in');
      setDifficultyFilter('all');
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsQuizSubmitted(false);
      setQuizScore(0);
      setQuizAnswersHistory([]);
      setFlashcardToast('🧹 تم حذف الأسئلة الإضافية وتفريغ البنك بنجاح.');
    }
  };

  // AI Dynamic Question Generator Trigger
  const generateNewQuestions = async (difficulty: 'easy' | 'medium' | 'high') => {
    setGenerationLoading(true);
    setGenerationError(null);
    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureId: activeLecture.id,
          lectureTitle: activeLecture.arabicTitle,
          topics: activeLecture.topicsCovered,
          difficulty
        })
      });

      if (!response.ok) {
        throw new Error('فشل الاتصال بالخادم الذكي لتوليد الأسئلة. سيتم استخدام مولد الأسئلة الإضافية المحلي لضمان استمرارية المراجعة.');
      }

      const data = await response.json();
      if (data.questions && Array.isArray(data.questions)) {
        handleAddCustomQuestions(activeLecture.id, data.questions);
        setQuizMode('extended');
        setDifficultyFilter(difficulty);
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setIsQuizSubmitted(false);
        setQuizScore(0);
        setQuizAnswersHistory([]);
        setFlashcardToast(`🎉 تم توليد 5 أسئلة ذكية جديدة بنجاح في مستوى الصعوبة: ${difficulty === 'high' ? 'مستويات عليا' : difficulty === 'medium' ? 'متوسط' : 'سهل'}!`);
      } else {
        throw new Error('تنسيق البيانات المستلمة غير صالح.');
      }
    } catch (err: any) {
      console.warn('API error, falling back to local simulation:', err);
      // Fallback: Generate custom simulated high-quality questions locally
      // To provide a perfect experience, let's select 3 random fallback questions
      const fallbacksForLecture = fallbackQuestions[selectedLectureId] || [];
      if (fallbacksForLecture.length > 0) {
        // Create duplicate variants with slightly randomized IDs to simulate infinite generation
        const localSimulated = fallbacksForLecture.map(q => ({
          ...q,
          id: `${q.id}_sim_${Math.random().toString(36).substring(2, 7)}`,
          sourceYear: `مولد محلي - مستوى ${difficulty === 'high' ? 'مستويات عليا' : difficulty === 'medium' ? 'متوسط' : 'سهل'}`
        }));
        handleAddCustomQuestions(activeLecture.id, localSimulated);
        setQuizMode('extended');
        setDifficultyFilter(difficulty);
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setIsQuizSubmitted(false);
        setQuizScore(0);
        setQuizAnswersHistory([]);
        setFlashcardToast(`🚀 تم تفعيل بنك الأسئلة الممتد بنجاح! تم دمج الأسئلة المنهجية المضافة في مستوى الصعوبة المحدد.`);
      } else {
        setGenerationError('حدث خطأ أثناء الاتصال بالخوادم ولم تتوفر أسئلة محلية احتياطية.');
      }
    } finally {
      setGenerationLoading(false);
    }
  };

  // Active Recall States & Dark Study Mode controls
  const [recallCardIndex, setRecallCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [cardStatus, setCardStatus] = useState<Record<string, 'unseen' | 'review' | 'mastered'>>(() => {
    try {
      const saved = localStorage.getItem('thanaweya_card_status');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [flashcardToast, setFlashcardToast] = useState<string | null>(null);

  // Reset flashcard index and flip state when changing lectures
  useEffect(() => {
    setRecallCardIndex(0);
    setIsCardFlipped(false);
  }, [selectedLectureId]);

  // Eye-Care Dark Study Mode & Card Brightness states
  const [darkStudyMode, setDarkStudyMode] = useState<boolean>(true);
  const [darkStudyTheme, setDarkStudyTheme] = useState<'standard' | 'oled' | 'warm' | 'emerald'>('oled');
  const [cardBrightness, setCardBrightness] = useState<number>(85);
  const [tiltIntensity, setTiltIntensity] = useState<number>(100);

  // Custom AI Generated Flashcards
  const [customFlashcards, setCustomFlashcards] = useState<Flashcard[]>(() => {
    try {
      const saved = localStorage.getItem('thanaweya_custom_flashcards');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [fcGenLoading, setFcGenLoading] = useState<boolean>(false);
  const [fcGenTopic, setFcGenTopic] = useState<string>('');

  const generateCustomFlashcard = async () => {
    if (!fcGenTopic.trim()) return;
    setFcGenLoading(true);
    try {
      const response = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lectureId: selectedLectureId,
          topic: fcGenTopic
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate');
      }

      const data = await response.json();
      if (data.flashcard) {
        setCustomFlashcards(prev => {
          const next = [...prev, data.flashcard];
          localStorage.setItem('thanaweya_custom_flashcards', JSON.stringify(next));
          return next;
        });
        setFcGenTopic('');
        setFlashcardToast('🪄 تم إنشاء بطاقة الاستذكار المخصصة بالذكاء الاصطناعي وإضافتها لدفترك!');
      }
    } catch (err) {
      console.warn('AI Flashcard generation failed, adding mock offline fallback:', err);
      const fallbackCard: Flashcard = {
        id: `custom_fc_${Date.now()}`,
        lectureId: selectedLectureId,
        category: 'بطاقة مخصصة',
        question: `سؤال مخصص حول: ${fcGenTopic}`,
        answer: `إجابة نموذجية معدة محلياً لعدم توفر الشبكة: مراجعة شاملة لـ ${fcGenTopic}. تذكر أن تراجع التفاصيل الدقيقة لهذه النقطة من كتاب الوزارة وتريكات الفصول!`
      };
      setCustomFlashcards(prev => {
        const next = [...prev, fallbackCard];
        localStorage.setItem('thanaweya_custom_flashcards', JSON.stringify(next));
        return next;
      });
      setFcGenTopic('');
      setFlashcardToast('🚀 تم إضافة بطاقة استذكار مخصصة احتياطية محلياً!');
    } finally {
      setFcGenLoading(false);
    }
  };

  // Filter flashcards for current lecture
  const currentFlashcards = useMemo(() => {
    const builtIn = biologyFlashcards.filter(fc => fc.lectureId === selectedLectureId);
    const custom = customFlashcards.filter(fc => fc.lectureId === selectedLectureId);
    return [...builtIn, ...custom];
  }, [selectedLectureId, customFlashcards]);

  // Study Planner states
  const [examDate, setExamDate] = useState<string>(() => {
    return localStorage.getItem('thanaweya_exam_date') || '2026-06-21';
  });
  const [studyHours, setStudyHours] = useState<number>(() => {
    return Number(localStorage.getItem('thanaweya_study_hours')) || 2;
  });
  const [plannerChecklist, setPlannerChecklist] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('thanaweya_planner_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const togglePlannerChecklist = (key: string) => {
    setPlannerChecklist(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('thanaweya_planner_checklist', JSON.stringify(next));
      return next;
    });
  };

  // Live countdown state
  const [countdownText, setCountdownText] = useState<{ days: number, hours: number, mins: number }>({ days: 0, hours: 0, mins: 0 });

  React.useEffect(() => {
    const calcCountdown = () => {
      const target = new Date(examDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        setCountdownText({ days: 0, hours: 0, mins: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdownText({ days, hours, mins });
    };

    calcCountdown();
    const interval = setInterval(calcCountdown, 60000);
    return () => clearInterval(interval);
  }, [examDate]);

  // Genetics & Immunology Calculations
  const [dnaInputType, setDnaInputType] = useState<'nucleotides' | 'codons' | 'amino_acids'>('nucleotides');
  const [dnaValue, setDnaValue] = useState<number>(300);
  const [chargaffA, setChargaffA] = useState<number>(30); // 30% Adenine
  const [wbcCount, setWbcCount] = useState<number>(8000);
  const [calcSubTab, setCalcSubTab] = useState<'myofibril' | 'genetics' | 'immunology'>('myofibril');

  // Interactive Formula Sheet States
  const [formulaSearch, setFormulaSearch] = useState('');
  const [formulaCategory, setFormulaCategory] = useState<'all' | 'movement' | 'genetics' | 'immunology'>('all');
  const [globalFormulasHidden, setGlobalFormulasHidden] = useState(false);
  const [individualFormulasHidden, setIndividualFormulasHidden] = useState<Record<string, boolean>>({});

  // Self-Quiz state inside the formulas sheet
  const [activeQuizFormula, setActiveQuizFormula] = useState<BiologyFormula | null>(null);
  const [formulaQuizUserAnswer, setFormulaQuizUserAnswer] = useState('');
  const [showFormulaQuizAnswer, setShowFormulaQuizAnswer] = useState(false);
  const [formulaQuizScore, setFormulaQuizScore] = useState({ correct: 0, total: 0 });

  // AI Chatbot Modal State
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Floating Formula Sheet Quick Popup Modal State
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);

  // Study Reminders Modal State & Data Persistence
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [studyReminders, setStudyReminders] = useState<StudyReminder[]>(() => {
    try {
      const saved = localStorage.getItem('thanaweya_study_reminders');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default initial reminders for standard high school schedule
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return [
      {
        id: 'rem-1',
        lectureId: 1,
        lectureTitle: 'الفصل الأول: الدعامة والحركة في الكائنات الحية',
        frequencyDays: 3,
        nextReviewDate: todayStr, // due today
        notes: 'مراجعة حسابات القطع العضلية وسلاسل الـ Z-lines',
        createdAt: todayStr
      },
      {
        id: 'rem-2',
        lectureId: 6,
        lectureTitle: 'الفصل السادس: البيولوجيا الجزيئية - DNA & RNA',
        frequencyDays: 5,
        nextReviewDate: todayStr, // due today
        notes: 'مراجعة جدول الكودونات ومسائل الروابط الببتيدية',
        createdAt: todayStr
      }
    ];
  });

  const handleSaveReminders = (updated: StudyReminder[]) => {
    setStudyReminders(updated);
    try {
      localStorage.setItem('thanaweya_study_reminders', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const dueReminders = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return studyReminders.filter(r => r.nextReviewDate <= todayStr);
  }, [studyReminders]);

  const stats = useMemo(() => {
    let mastered = 0;
    let review = 0;
    let unseen = 0;
    currentFlashcards.forEach(card => {
      const status = cardStatus[card.id] || 'unseen';
      if (status === 'mastered') mastered++;
      else if (status === 'review') review++;
      else unseen++;
    });
    return { mastered, review, unseen };
  }, [currentFlashcards, cardStatus]);

  const filteredFormulas = useMemo(() => {
    return biologyFormulas.filter(f => {
      const matchSearch = 
        f.arabicTitle.toLowerCase().includes(formulaSearch.toLowerCase()) ||
        f.description.toLowerCase().includes(formulaSearch.toLowerCase()) ||
        f.expression.toLowerCase().includes(formulaSearch.toLowerCase());
      
      const matchCategory = 
        formulaCategory === 'all' || f.category === formulaCategory;
        
      return matchSearch && matchCategory;
    });
  }, [formulaSearch, formulaCategory]);

  // Formula quiz helpers
  const handleSelectRandomFormulaQuiz = () => {
    const randomIndex = Math.floor(Math.random() * biologyFormulas.length);
    setActiveQuizFormula(biologyFormulas[randomIndex]);
    setFormulaQuizUserAnswer('');
    setShowFormulaQuizAnswer(false);
  };

  const handleEvaluateFormulaQuiz = (isCorrect: boolean) => {
    setFormulaQuizScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));
    handleSelectRandomFormulaQuiz();
  };

  // Reset states when changing lecture
  const handleLectureChange = (id: number) => {
    setSelectedLectureId(id);
    setActiveTab('concepts');
    setQuizMode('built-in');
    setDifficultyFilter('all');
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsQuizSubmitted(false);
    setQuizScore(0);
    setQuizAnswersHistory([]);
    setRecallCardIndex(0);
    setIsCardFlipped(false);
  };

  // Quiz navigation helper
  const handleAnswerSelect = (option: 'A' | 'B' | 'C' | 'D') => {
    if (isQuizSubmitted) return;
    setSelectedOption(option);
  };

  const handleQuizSubmit = () => {
    if (!selectedOption || isQuizSubmitted || !activeQuestion) return;
    
    const isCorrect = selectedOption === activeQuestion.correctAnswer;
    
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    }
    
    setQuizAnswersHistory(prev => [
      ...prev,
      { qId: activeQuestion.id, isCorrect, chosen: selectedOption }
    ]);
    
    setIsQuizSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsQuizSubmitted(false);
    } else {
      // Finished all questions, show summary screen and record performance
      setCurrentQuestionIndex(filteredQuestions.length);
      updatePerformance(activeLecture.id, activeLecture.arabicTitle, quizScore, filteredQuestions.length);
    }
  };

  const handleResetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsQuizSubmitted(false);
    setQuizScore(0);
    setQuizAnswersHistory([]);
  };

  // Calculator logic for Sarcomeres
  const calcResults = useMemo(() => {
    const N = Math.max(1, calcN);
    return {
      zLines: N + 1,
      darkBandsA: N,
      hZones: N, // in relaxation
      totalIBands: N + 1,
      completeIBands: Math.max(0, N - 1),
      incompleteIBands: 2
    };
  }, [calcN]);

  // Auto-dismiss flashcard toast
  React.useEffect(() => {
    if (flashcardToast) {
      const timer = setTimeout(() => {
        setFlashcardToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [flashcardToast]);

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 ${theme === 'light' ? 'theme-light' : ''}`} dir="rtl">
      
      {/* Toast Notification for Flashcards Rating */}
      {flashcardToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 shadow-2xl p-4 rounded-xl flex items-center gap-3 transition-all duration-300 animate-bounce">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">✓</div>
          <div className="flex-1 text-xs text-slate-200">
            {flashcardToast}
          </div>
          <button 
            onClick={() => setFlashcardToast(null)}
            className="text-slate-500 hover:text-slate-300 text-xs font-bold cursor-pointer pr-2"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Top Professional Header or Compact Focus Mode Bar */}
      {isFocusMode ? (
        <div className="bg-slate-900/95 border-b border-amber-500/40 px-6 py-3 flex items-center justify-between text-xs sticky top-0 z-50 backdrop-blur-md shadow-2xl animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            <span className="font-black text-amber-300 flex items-center gap-2 text-sm">
              <Target className="w-4.5 h-4.5 text-amber-400" />
              <span>وضع التركيز التام مفعّل (Focus Mode)</span>
            </span>
            <span className="text-slate-400 hidden md:inline text-xs">| تم إخفاء الترويسة الرئيسية والمشتتات لتوفير أقصى مساحة رؤية للاختبار</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsFocusMode(false);
                setFlashcardToast('🔓 تم الخروج من وضع التركيز وإعادة الترويسة.');
              }}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-4 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md text-xs"
            >
              <Minimize2 className="w-4 h-4" />
              <span>إنهاء التركيز (Esc)</span>
            </button>
          </div>
        </div>
      ) : (
        <header className="bg-slate-900/80 border-b border-slate-800 text-white shadow-xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
          <div className="max-w-7xl mx-auto px-6 py-10 relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-right">
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mb-3">
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
                  <Award className="w-4 h-4" />
                  النظام التعليمي الحديث 2026 - علمي علوم
                </div>

                {/* Focus Mode Header Button */}
                <button
                  onClick={() => {
                    setIsFocusMode(true);
                    setFlashcardToast('🎯 تم تفعيل وضع التركيز! تم إخفاء الترويسة لزيادة المساحة المتاحة للاختبارات.');
                  }}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm relative"
                  title="إخفاء الترويسة والعناصر المشتتة لزيادة مساحة الرؤية بالكامل"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>وضع التركيز 🎯</span>
                </button>

                {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="inline-flex items-center gap-1.5 bg-slate-950/40 hover:bg-slate-900 text-slate-300 hover:text-white px-3 py-1 rounded-full text-xs font-bold border border-slate-800 transition-all cursor-pointer shadow-sm"
                title={theme === 'dark' ? "تفعيل الوضع النهاري عالي التباين" : "تفعيل الوضع الليلي الأنيق"}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>الوضع المضيء (Daylight)</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>الوضع الليلي (Elegant Dark)</span>
                  </>
                )}
              </button>

              {/* Service Worker Offline Status Indicator */}
              <button
                onClick={() => {
                  setFlashcardToast(
                    isOnline
                      ? '⚡ الذاكرة المؤقتة نشطة (Service Worker) - جميع الدروس والأسئلة محفوظة للعمل بدون إنترنت.'
                      : '📡 أنت الآن في وضع الأوفلاين! التطبيق يعمل بكفاءة كاملة مع حفظ سجل الإجابات محلياً.'
                  );
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-sm relative ${
                  !isOnline
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}
                title="حالة الاتصال والخدمة بدون إنترنت (Offline Capability)"
              >
                {!isOnline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>الوضع الأوفلاين (شغّال)</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span>جاهز للأوفلاين ✓</span>
                  </>
                )}
              </button>

              {/* Study Reminders Notification Button */}
              <button
                onClick={() => setIsRemindersModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-slate-950/40 hover:bg-slate-900 text-slate-300 hover:text-white px-3 py-1 rounded-full text-xs font-bold border border-slate-800 transition-all cursor-pointer shadow-sm relative"
                title="جدول تنبيهات المذاكرة والمراجعة المتباعدة"
              >
                <Bell className={`w-3.5 h-3.5 ${dueReminders.length > 0 ? 'text-amber-400 animate-bounce' : 'text-emerald-400'}`} />
                <span>تنبيهات المذاكرة</span>
                {dueReminders.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold mr-1">
                    {dueReminders.length}
                  </span>
                )}
              </button>

              {/* AI Biology Chatbot Header Button */}
              <button
                onClick={() => setIsChatbotOpen(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm relative"
                title="مستشار الأحياء الذكي والشات بوت التفاعلي"
              >
                <Bot className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                <span>مستشار الأحياء الذكي</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </button>

              {/* D3 Concept Map Header Button */}
              <button
                onClick={() => {
                  setActiveTab('concept_map');
                  const mainElem = document.querySelector('main');
                  if (mainElem) mainElem.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm relative"
                title="خريطة المفاهيم التفاعلية D3.js"
              >
                <Network className="w-3.5 h-3.5 text-indigo-400" />
                <span>خريطة المفاهيم D3</span>
              </button>

              {/* Official Ministry Guidance Model 2026 Header Button */}
              <button
                onClick={() => {
                  setActiveTab('guidance_model_2026');
                  const mainElem = document.querySelector('main');
                  if (mainElem) mainElem.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 text-amber-300 border border-amber-500/40 px-3.5 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer shadow-md relative group"
                title="النموذج الاسترشادي الرسمي لوزارة التربية والتعليم 2026"
              >
                <GraduationCap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>النموذج الاسترشادي 2026</span>
                <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded font-extrabold mr-1">رسمي</span>
              </button>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
              كورس المراجعة النهائية المكثف في الأحياء
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
              منصة تفاعلية ذكية مصممة خصيصاً لطلاب الثانوية العامة للتمرس على التفكير المفاهيمي، وحل تريكات المنحنيات والربط بين الفصول وفقاً لنمط امتحانات الوزارة للأعوام 2021-2025.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl backdrop-blur-md">
            <div className="text-center px-4 border-l border-slate-850">
              <span className="block text-2xl font-bold text-emerald-400">06</span>
              <span className="text-xs text-slate-400">محاضرات مكثفة</span>
            </div>
            <div className="text-center px-4 border-l border-slate-850">
              <span className="block text-2xl font-bold text-cyan-400">100%</span>
              <span className="text-xs text-slate-400">تغطية تريكات</span>
            </div>
            <div className="text-center px-4">
              <span className="block text-2xl font-bold text-amber-400">تفاعلي</span>
              <span className="text-xs text-slate-400">محاكاة ومنحنيات</span>
            </div>
          </div>
        </div>
      </header>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* In-App Study Reminders Visual Alert Banner */}
        {dueReminders.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-emerald-500/15 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  🔔 تنبيه المذاكرة الدوري (جدول التكرار المتباعد):
                  <span className="text-xs bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full">
                    {dueReminders.length} فصول مستحقة للمراجعة اليوم
                  </span>
                </h4>
                <p className="text-xs text-slate-300 font-sans mt-0.5">
                  تذكير بموعد المراجعة الدورية بناءً على جدولك المخصص لحفظ مفاهيم الأحياء وتريكاتها.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsRemindersModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <span>إدارة التنبيهات وفحص الفصول</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        
        {/* Search and Navigation Row */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Lecture Navigation Tabs */}
          <div className="w-full md:w-auto overflow-x-auto no-scrollbar py-1">
            <div className="flex gap-2 min-w-max">
              {allLectures.map(lecture => (
                <button
                  key={lecture.id}
                  onClick={() => handleLectureChange(lecture.id)}
                  className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 text-right ${
                    selectedLectureId === lecture.id
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 scale-[1.02] border border-emerald-500/30'
                      : 'bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-slate-300'
                  }`}
                >
                  <span className="block text-[10px] opacity-75 font-mono mb-0.5">المحاضرة {lecture.id}</span>
                  <span className="text-sm">{lecture.arabicTitle}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Search Enabled Search Bar */}
          <div className="relative w-full md:w-96">
            <div className={`relative flex items-center bg-slate-900 border rounded-xl transition-all duration-300 ${
              isVoiceListening 
                ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/40' 
                : 'border-slate-800 hover:border-slate-700 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/40'
            }`}>
              <Search className="w-4 h-4 text-slate-500 absolute right-3 pointer-events-none" />
              <input
                type="text"
                placeholder={isVoiceListening ? "جاري الاستماع... تحدث بالمفهوم الآن..." : "ابحث عن مفهوم، تريكة، أو تحدث بالميكروفون..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent pr-10 pl-24 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none font-sans"
              />
              
              {/* Action Buttons: Clear + Voice Search Mic */}
              <div className="absolute left-2 flex items-center gap-1.5">
                {searchQuery && !isVoiceListening && (
                  <button 
                    onClick={() => { setSearchQuery(''); setVoiceInterimText(''); }}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-200 px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                    title="مسح البحث"
                  >
                    مسح
                  </button>
                )}

                <button
                  onClick={isVoiceListening ? stopVoiceSearch : startVoiceSearch}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                    isVoiceListening
                      ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-md shadow-rose-600/40'
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
                  }`}
                  title={isVoiceListening ? "إيقاف البحث الصوتي" : "البحث الصوتي الذكي بالميكروفون (Voice Search)"}
                >
                  {isVoiceListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5" />
                      <span className="text-[10px]">إيقاف</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline text-[10px]">صوتي 🎙️</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Voice Listening Active Popup & Real-time Transcript */}
            {isVoiceListening && (
              <div className="absolute top-full right-0 left-0 mt-2 p-3.5 bg-slate-950 border border-emerald-500/50 rounded-xl shadow-2xl z-50 animate-in fade-in duration-200 dir-rtl backdrop-blur-md">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-emerald-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span>جاري الاستماع... تحدث بكلمات البحث الآن 🎙️</span>
                  </span>
                  <button
                    onClick={stopVoiceSearch}
                    className="text-[10px] text-rose-400 hover:underline font-bold cursor-pointer"
                  >
                    إغلاق ✕
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <Volume2 className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                  <span className="text-xs text-white font-mono truncate">
                    {voiceInterimText || 'تحدث باسم المفهوم (مثال: "الروابط المستعرضة", "القطع العضلية", "DNA")...'}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-850 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="text-slate-500 font-bold">تجربة سريعة للنطق:</span>
                  {['الروابط المستعرضة', 'هرمون النمو', 'الدعامة التركيبية', 'القطع العضلية', 'الكيوتين'].map(sample => (
                    <button
                      key={sample}
                      onClick={() => {
                        setSearchQuery(sample);
                        stopVoiceSearch();
                      }}
                      className="bg-slate-900 hover:bg-emerald-950/80 hover:text-emerald-300 text-slate-300 border border-slate-800 px-2 py-0.5 rounded transition-all cursor-pointer font-sans"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Search Permission / Browser Support Notice */}
            {voiceError && (
              <div className="absolute top-full right-0 left-0 mt-2 p-3.5 bg-slate-950 border border-amber-500/40 rounded-xl shadow-2xl z-50 text-xs text-amber-300 dir-rtl backdrop-blur-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold leading-relaxed">{voiceError}</p>
                      <p className="text-[10px] text-slate-400 mt-1">يمكنك اختيار أي مفهوم صغته بالنطق لتجربة البحث الصوتي الفوري:</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {['القطع العضلية', 'الروابط المستعرضة', 'هرمون التيموسين', 'الكيوتين', 'حمض DNA'].map(phrase => (
                          <button
                            key={phrase}
                            onClick={() => {
                              setSearchQuery(phrase);
                              setVoiceError(null);
                            }}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[10px] px-2.5 py-1 rounded cursor-pointer font-sans transition-colors"
                          >
                            🎙️ {phrase}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setVoiceError(null)}
                    className="text-slate-500 hover:text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Search Results Alert if active */}
        {searchQuery.trim() !== '' && (
          <div className="mb-8 bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
            <h3 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-amber-500" />
              نتائج البحث عن "{searchQuery}":
            </h3>
            {filteredSearchLectures.length === 0 ? (
              <p className="text-slate-400 text-sm">لم يتم العثور على نتائج تطابق بحثك. جرب كلمات بديلة مثل "كيوتين" أو "استقطاب" أو "شد".</p>
            ) : (
              <div className="space-y-4">
                {filteredSearchLectures.map(l => (
                  <div key={l.id} className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg">
                    <span className="text-xs text-emerald-400 font-bold">المحاضرة {l.id}: {l.arabicTitle}</span>
                    <div className="mt-2 space-y-2">
                      {l.matchingConcepts.map(c => (
                        <div key={c.id} className="pl-4 border-r-2 border-slate-800 pr-2">
                          <button 
                            onClick={() => { handleLectureChange(l.id); setActiveTab('concepts'); setSearchQuery(''); }}
                            className="font-semibold text-sm text-slate-200 hover:text-emerald-400 text-right block"
                          >
                            {c.arabicTitle}
                          </button>
                          <p className="text-xs text-slate-500 line-clamp-1">انقر للانتقال مباشرة للشرح والتفاصيل الحيوية.</p>
                        </div>
                      ))}
                      {l.matchingTricks.map(t => (
                        <div key={t.id} className="pl-4 border-r-2 border-amber-500/30 pr-2">
                          <button 
                            onClick={() => { handleLectureChange(l.id); setActiveTab('tricks'); setSearchQuery(''); }}
                            className="font-semibold text-sm text-slate-200 hover:text-emerald-400 text-right block"
                          >
                            تريكة: {t.title}
                          </button>
                          <p className="text-xs text-slate-500 line-clamp-1">{t.coreConcept}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Daily Trick Challenge Banner */}
        {searchQuery.trim() === '' && (
          <DailyTrickChallenge
            allLectures={allLectures}
            onNavigateToLecture={(lectureId, tab) => {
              handleLectureChange(lectureId);
              if (tab) setActiveTab(tab);
            }}
          />
        )}

        {/* Selected Lecture Details Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  المحاضرة {activeLecture.id} من 6
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
                  <span>{activeLecture.arabicTitle}</span>
                </h2>

                <button
                  id="jump-to-quiz-btn"
                  onClick={() => {
                    setActiveTab('quiz');
                    const quizElem = document.getElementById('workstation-tabs-nav');
                    if (quizElem) {
                      quizElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 border border-emerald-400/40 transition-all transform hover:-translate-y-0.5 cursor-pointer shrink-0"
                  title="انتقال مباشر إلى قسم تدريبات واختبار هذه المحاضرة"
                >
                  <BrainCircuit className="w-4 h-4 text-emerald-100 animate-pulse" />
                  <span>انتقال سريع للاختبار 📝</span>
                </button>
              </div>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                {activeLecture.subtitle}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {activeLecture.topicsCovered.map((topic, i) => (
                  <span 
                    key={i} 
                    className="bg-slate-950/60 text-slate-300 text-xs px-3 py-1.5 rounded-md border border-slate-850/60 font-medium"
                  >
                    • {topic}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Quick stats for current lecture */}
            <div className="w-full md:w-auto grid grid-cols-2 gap-3 min-w-[200px]">
              <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl text-center">
                <span className="block text-xs text-slate-500 mb-1">مفاهيم شرح</span>
                <span className="text-lg font-bold text-white">{activeLecture.concepts.length}</span>
              </div>
              <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl text-center">
                <span className="block text-xs text-slate-500 mb-1">أسئلة الامتحان</span>
                <span className="text-lg font-bold text-white">{activeLecture.questionBank.length}</span>
              </div>
              <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl text-center">
                <span className="block text-xs text-slate-500 mb-1">تريكات وروابط</span>
                <span className="text-lg font-bold text-white">{activeLecture.tricks.length}</span>
              </div>
              <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl text-center">
                <span className="block text-xs text-slate-500 mb-1">بطاقات استذكار</span>
                <span className="text-lg font-bold text-white">{currentFlashcards.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* WORKSTATION TABS */}
        <div id="workstation-tabs-nav" className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Workstation Navigation Menu */}
          <div className="lg:col-span-1 space-y-2">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl sticky top-6">
              <span className="block text-xs font-bold text-slate-500 px-1 mb-3 uppercase tracking-wider font-mono">خيارات المراجعة</span>
              
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('concepts')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-right cursor-pointer ${
                    activeTab === 'concepts'
                      ? 'bg-emerald-600/15 text-emerald-400 border-r-4 border-emerald-500 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <BookOpen className={`w-4 h-4 ${activeTab === 'concepts' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>الشرح والمفاهيم</span>
                </button>

                {/* Official Ministry Guidance Model 2026 Navigation Item */}
                <button
                  onClick={() => setActiveTab('guidance_model_2026')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-right cursor-pointer ${
                    activeTab === 'guidance_model_2026'
                      ? 'bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-amber-300 border-r-4 border-amber-500 font-bold shadow-lg'
                      : 'text-amber-400/90 hover:bg-slate-800/60 hover:text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GraduationCap className={`w-4 h-4 ${activeTab === 'guidance_model_2026' ? 'text-amber-400' : 'text-amber-400/80'}`} />
                    <span>النموذج الاسترشادي 2026</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-extrabold">الوزارة</span>
                </button>

                {/* Past National Exams Egypt Navigation Item */}
                <button
                  onClick={() => setActiveTab('past_exams_egypt')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-right cursor-pointer ${
                    activeTab === 'past_exams_egypt'
                      ? 'bg-gradient-to-r from-emerald-500/20 to-amber-500/20 text-emerald-300 border-r-4 border-emerald-500 font-bold shadow-lg'
                      : 'text-emerald-400/90 hover:bg-slate-800/60 hover:text-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Award className={`w-4 h-4 ${activeTab === 'past_exams_egypt' ? 'text-emerald-400' : 'text-emerald-400/80'}`} />
                    <span>امتحانات مصر والنموذجية 🏛️</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-extrabold">امتحانات رسمية</span>
                </button>

                <button
                  onClick={() => setActiveTab('visuals')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-right cursor-pointer ${
                    activeTab === 'visuals'
                      ? 'bg-emerald-600/15 text-emerald-400 border-r-4 border-emerald-500 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Layers className={`w-4 h-4 ${activeTab === 'visuals' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>الرسومات التوضيحية</span>
                </button>

                <button
                  onClick={() => setActiveTab('concept_map')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-right cursor-pointer ${
                    activeTab === 'concept_map'
                      ? 'bg-indigo-600/20 text-indigo-400 border-r-4 border-indigo-500 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Network className={`w-4 h-4 ${activeTab === 'concept_map' ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>خريطة المفاهيم D3</span>
                </button>

                <button
                  onClick={() => setActiveTab('tricks')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-right cursor-pointer ${
                    activeTab === 'tricks'
                      ? 'bg-emerald-600/15 text-emerald-400 border-r-4 border-emerald-500 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <TrendingUp className={`w-4 h-4 ${activeTab === 'tricks' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>التريكات والمنحنيات</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('quiz');
                    setQuizSubTab('practice');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-right cursor-pointer ${
                    activeTab === 'quiz' && quizSubTab === 'practice'
                      ? 'bg-emerald-600/15 text-emerald-400 border-r-4 border-emerald-500 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <HelpCircle className={`w-4 h-4 ${activeTab === 'quiz' && quizSubTab === 'practice' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>بنك الأسئلة التفاعلي</span>
                </button>

                {/* Speed Quiz Tool Button */}
                <button
                  onClick={() => {
                    setActiveTab('quiz');
                    setQuizSubTab('speed_quiz');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-right cursor-pointer ${
                    activeTab === 'quiz' && quizSubTab === 'speed_quiz'
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-r-4 border-amber-500 font-bold shadow-lg'
                      : 'text-amber-400/90 hover:bg-slate-800/60 hover:text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Zap className={`w-4 h-4 ${activeTab === 'quiz' && quizSubTab === 'speed_quiz' ? 'text-amber-400' : 'text-amber-400/80'}`} />
                    <span>اختبار السرعة التنافسي</span>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-extrabold">تحدي ⚡</span>
                </button>

                {/* Mock Exam Button */}
                <button
                  onClick={() => {
                    setActiveTab('quiz');
                    setQuizSubTab('mock_exam');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-right cursor-pointer ${
                    activeTab === 'quiz' && quizSubTab === 'mock_exam'
                      ? 'bg-amber-500/20 text-amber-300 border-r-4 border-amber-500 font-bold shadow-lg'
                      : 'text-amber-400/90 hover:bg-slate-800/60 hover:text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-4 h-4 ${activeTab === 'quiz' && quizSubTab === 'mock_exam' ? 'text-amber-400' : 'text-amber-400/80'}`} />
                    <span>اختبار محاكاة شامل (50 سؤال)</span>
                  </div>
                  <span className="text-[10px] bg-gradient-to-l from-amber-500 to-orange-500 text-slate-950 px-2 py-0.5 rounded font-black">3س 🏛️</span>
                </button>

                {/* Mistake Bank Tool Button */}
                <button
                  onClick={() => {
                    setActiveTab('quiz');
                    setQuizSubTab('mistake_bank');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-right cursor-pointer ${
                    activeTab === 'quiz' && quizSubTab === 'mistake_bank'
                      ? 'bg-rose-500/20 text-rose-300 border-r-4 border-rose-500 font-bold shadow-lg'
                      : 'text-rose-400/90 hover:bg-slate-800/60 hover:text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-4 h-4 ${activeTab === 'quiz' && quizSubTab === 'mistake_bank' ? 'text-rose-400' : 'text-rose-400/80'}`} />
                    <span>بنك الأخطاء وتصحيح المفاهيم</span>
                  </div>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold">خاص 🧠</span>
                </button>

                <button
                  onClick={() => setActiveTab('flashcards')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-right cursor-pointer ${
                    activeTab === 'flashcards'
                      ? 'bg-emerald-600/15 text-emerald-400 border-r-4 border-emerald-500 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <RotateCcw className={`w-4 h-4 ${activeTab === 'flashcards' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>بطاقات الاستذكار النشط</span>
                </button>

                <button
                  onClick={() => setActiveTab('performance')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-right cursor-pointer ${
                    activeTab === 'performance'
                      ? 'bg-emerald-600/15 text-emerald-400 border-r-4 border-emerald-500 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <BarChart3 className={`w-4 h-4 ${activeTab === 'performance' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>تحليل وتحصيل الأداء</span>
                </button>

                <button
                  onClick={() => setActiveTab('formulas')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-right cursor-pointer ${
                    activeTab === 'formulas'
                      ? 'bg-emerald-600/15 text-emerald-400 border-r-4 border-emerald-500 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <FileText className={`w-4 h-4 ${activeTab === 'formulas' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>ورقة القوانين التفاعلية</span>
                </button>

                {/* Special Tool Tabs - Now Universal for maximum student benefit */}
                <button
                  onClick={() => setActiveTab('calculator')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-right cursor-pointer ${
                    activeTab === 'calculator'
                      ? 'bg-emerald-600/15 text-emerald-400 border-r-4 border-emerald-500 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Calculator className={`w-4 h-4 ${activeTab === 'calculator' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>مجمع القوانين والحسابات</span>
                </button>

                <button
                  onClick={() => setActiveTab('planner')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-right cursor-pointer ${
                    activeTab === 'planner'
                      ? 'bg-emerald-600/15 text-emerald-400 border-r-4 border-emerald-500 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Calendar className={`w-4 h-4 ${activeTab === 'planner' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>مخطط المذاكرة وجدول التكرار</span>
                </button>

                {/* Loud Sound Alarm & Pomodoro Timer Button */}
                <button
                  onClick={() => setIsRemindersModalOpen(true)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all text-right cursor-pointer bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-emerald-500/15 hover:from-rose-500/25 hover:to-emerald-500/25 text-rose-300 border border-rose-500/30 font-bold shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <BellRing className="w-4 h-4 text-rose-400 animate-pulse" />
                    <span>🔊 منبه المذاكرة الصوتي والمؤقت</span>
                  </div>
                  <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded font-black">صوت عالي ⚡</span>
                </button>
              </div>

              {/* Progress Sidebar Widget matching Design HTML */}
              <div className="mt-6 pt-6 border-t border-slate-850">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-mono">إحصائيات المراجعة</p>
                <div className="flex justify-between items-end">
                  <span className="text-xl font-bold text-white">
                    {Math.round((activeLecture.id / 6) * 100)}%
                  </span>
                  <span className="text-[10px] text-slate-400">تم إنجازه</span>
                </div>
                <div className="w-full h-1 bg-slate-800 mt-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(activeLecture.id / 6) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Workstation Stage */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              
              {/* TAB: GUIDANCE MODEL 2026 (النموذج الاسترشادي الرسمي 2026) */}
              {activeTab === 'guidance_model_2026' && (
                <motion.div
                  key="guidance_model_2026"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <GuidanceModel2026Tool
                    onNavigateToTab={(tab) => setActiveTab(tab)}
                    onSelectLecture={(id) => handleLectureChange(id)}
                  />
                </motion.div>
              )}

              {/* TAB: PAST EXAMS EGYPT (امتحانات مصر مع الإجابات النموذجية) */}
              {activeTab === 'past_exams_egypt' && (
                <motion.div
                  key="past_exams_egypt"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <PastExamsEgyptTool
                    onToast={(msg) => setFlashcardToast(msg)}
                    isFocusMode={isFocusMode}
                    onToggleFocusMode={() => setIsFocusMode(prev => !prev)}
                  />
                </motion.div>
              )}

              {/* TAB: CONCEPT MAP (D3.js) */}
              {activeTab === 'concept_map' && (
                <motion.div
                  key="concept_map"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ConceptMapTool
                    allLectures={allLectures}
                    selectedLectureId={selectedLectureId}
                    onSelectLecture={(id) => handleLectureChange(id)}
                    onNavigateToTab={(lecId, tab) => {
                      handleLectureChange(lecId);
                      if (tab) setActiveTab(tab);
                    }}
                  />
                </motion.div>
              )}

              {/* TAB 1: CORE CONCEPTS */}
              {activeTab === 'concepts' && (
                <motion.div
                  key="concepts"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Reading Mode Header & Controls Bar */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Mode Info & Indicator */}
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                          isReadingMode 
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-md shadow-amber-500/10' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          <Eye className={`w-5 h-5 ${isReadingMode ? 'animate-pulse' : ''}`} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-white">الشرح والتفاصيل المفصلة للمفاهيم</h3>
                            {isReadingMode && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                                <Sparkles className="w-3 h-3 text-amber-400" /> وضع القراءة المريحة نَشِط
                              </span>
                            )}
                            <button
                              onClick={() => {
                                setActiveTab('quiz');
                                const quizElem = document.getElementById('workstation-tabs-nav');
                                if (quizElem) quizElem.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-102"
                              title="انتقال مباشر لاختبار أسئلة هذه المحاضرة"
                            >
                              <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" />
                              <span>انتقال سريع للاختبار 🎯</span>
                            </button>
                          </div>
                          <p className="text-xs text-slate-400">
                            {isReadingMode 
                              ? 'خط مكبّر، تباعد أسطر مريح، وألوان دافئة مخصصة لحماية العين أثناء استيعاب الشروحات الطويلة' 
                              : 'تصفح الشروحات والمفاهيم الأساسية، أو فعّل وضع القراءة المريحة للعين لضبط الخط والتباعد'}
                          </p>
                        </div>
                      </div>

                      {/* Main Toggle & Options Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setIsReadingMode(prev => !prev);
                            if (!isReadingMode) setShowReadingControls(true);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                            isReadingMode
                              ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 border-amber-400 font-black scale-102'
                              : 'bg-slate-800 hover:bg-slate-750 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>{isReadingMode ? 'إيقاف وضع القراءة ❌' : '📖 تفعيل وضع القراءة المريحة'}</span>
                        </button>

                        <button
                          onClick={() => setShowReadingControls(prev => !prev)}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            showReadingControls
                              ? 'bg-slate-800 text-white border-slate-700'
                              : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
                          }`}
                          title="تخصيص ألوان وخطوط القراءة"
                        >
                          <Sliders className="w-4 h-4" />
                          <span className="hidden sm:inline text-[11px]">تخصيص</span>
                        </button>
                      </div>
                    </div>

                    {/* Customization Drawer Panel */}
                    <AnimatePresence>
                      {(showReadingControls || isReadingMode) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs"
                        >
                          {/* 1. Font Size (حجم الخط) */}
                          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 space-y-2">
                            <div className="flex justify-between items-center text-slate-300 font-bold">
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Type className="w-3.5 h-3.5" /> حجم الخط:
                              </span>
                              <span className="font-mono text-amber-400 font-black">{readingFontSize}px</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setReadingFontSize(prev => Math.max(15, prev - 2))}
                                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                                title="تصغير الخط"
                              >
                                A-
                              </button>
                              <div className="flex-1 flex justify-between gap-1">
                                {[16, 19, 22, 26].map(sz => (
                                  <button
                                    key={sz}
                                    onClick={() => setReadingFontSize(sz)}
                                    className={`flex-1 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                                      readingFontSize === sz
                                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                                        : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                    }`}
                                  >
                                    {sz === 16 ? 'عادي' : sz === 19 ? 'مريح' : sz === 22 ? 'كبير' : 'ضخم'}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => setReadingFontSize(prev => Math.min(30, prev + 2))}
                                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                                title="تكبير الخط"
                              >
                                A+
                              </button>
                            </div>
                          </div>

                          {/* 2. Line Spacing (تباعد الأسطر) */}
                          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 space-y-2">
                            <div className="flex justify-between items-center text-slate-300 font-bold">
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Sliders className="w-3.5 h-3.5" /> تباعد الأسطر:
                              </span>
                              <span className="font-mono text-amber-400 font-black">{readingLineHeight}</span>
                            </div>

                            <div className="grid grid-cols-4 gap-1">
                              {[
                                { val: 1.5, label: 'عادي' },
                                { val: 1.85, label: 'مريح' },
                                { val: 2.1, label: 'واسع' },
                                { val: 2.4, label: 'فسيح' }
                              ].map(lh => (
                                <button
                                  key={lh.val}
                                  onClick={() => setReadingLineHeight(lh.val)}
                                  className={`py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                                    readingLineHeight === lh.val
                                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                >
                                  {lh.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 3. Theme Tone Color Chooser (مظهر الألوان لحماية العين) */}
                          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 space-y-2">
                            <div className="text-slate-300 font-bold flex items-center gap-1 text-emerald-400">
                              <Sun className="w-3.5 h-3.5" /> مظهر الألوان لحماية العين:
                            </div>

                            <div className="grid grid-cols-4 gap-1">
                              {[
                                { id: 'sepia', label: '🍂 دافئ', title: 'كريمي دافئ (Warm Sepia)' },
                                { id: 'slate', label: '🌙 داكن', title: 'رمادي داكن ناعم' },
                                { id: 'oled', label: '🖤 أسود', title: 'أسود OLED تباين عالٍ' },
                                { id: 'midnight', label: '🌌 ليلي', title: 'أزرق ليلي عميق' }
                              ].map(th => (
                                <button
                                  key={th.id}
                                  title={th.title}
                                  onClick={() => setReadingTheme(th.id as any)}
                                  className={`py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                                    readingTheme === th.id
                                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                >
                                  {th.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 4. Reading Width Container (عرض مساحة التركيز) */}
                          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 space-y-2">
                            <div className="text-slate-300 font-bold flex items-center gap-1 text-emerald-400">
                              <Maximize2 className="w-3.5 h-3.5" /> عرض النص وقوة التركيز:
                            </div>

                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { id: 'focused', label: '🎯 مُركّز (768px)' },
                                { id: 'comfortable', label: '📖 مريح (900px)' },
                                { id: 'full', label: '🖥️ كامـل' }
                              ].map(w => (
                                <button
                                  key={w.id}
                                  onClick={() => setReadingMaxWidth(w.id as any)}
                                  className={`py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                                    readingMaxWidth === w.id
                                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                >
                                  {w.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Concepts List Container */}
                  <div className={`space-y-6 transition-all ${readingContainerWidthClass}`}>
                    {activeLecture.concepts.map((concept, index) => (
                      <div 
                        key={concept.id} 
                        className={`rounded-2xl p-6 transition-all backdrop-blur-sm ${
                          isReadingMode 
                            ? readingThemeStyles.cardBg 
                            : 'bg-slate-900/40 border border-slate-800 text-slate-300 shadow-xl'
                        }`}
                      >
                        <h3 
                          className={`font-bold border-b pb-3 mb-4 flex items-center gap-3 transition-all ${
                            isReadingMode 
                              ? `${readingThemeStyles.headerBorder} ${readingThemeStyles.titleColor}` 
                              : 'text-xl text-white border-slate-800'
                          }`}
                          style={{
                            fontSize: isReadingMode ? `${Math.round(readingFontSize * 1.2)}px` : undefined
                          }}
                        >
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${
                            isReadingMode ? readingThemeStyles.badgeBg : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {index + 1}
                          </span>
                          {concept.arabicTitle}
                        </h3>
                        
                        {/* Detailed explanatory text */}
                        <div 
                          className="prose prose-invert max-w-none space-y-4 pr-1 transition-all"
                          style={{ 
                            fontSize: `${readingFontSize}px`,
                            lineHeight: readingLineHeight,
                            color: isReadingMode 
                              ? (readingTheme === 'sepia' ? '#f5f5f4' : readingTheme === 'oled' ? '#f8fafc' : readingTheme === 'midnight' ? '#f1f5f9' : '#e2e8f0') 
                              : undefined
                          }}
                          dangerouslySetInnerHTML={{ 
                            __html: concept.details
                              .replace(/\n/g, '<br />')
                              .replace(/### (.*?):/g, `<h4 class="font-extrabold ${isReadingMode ? readingThemeStyles.headingColor : 'text-white'} underline underline-offset-4 decoration-emerald-500/40 mt-6 mb-2" style="font-size: ${Math.round(readingFontSize * 1.1)}px;">$1</h4>`)
                              .replace(/\* \*\*(.*?):\*\*/g, `<strong class="${isReadingMode ? readingThemeStyles.strongColor : 'text-white'}">$1:</strong>`)
                          }} 
                        />

                        {/* Key Points Summary block */}
                        <div 
                          className={`mt-6 rounded-xl p-4 transition-all ${
                            isReadingMode ? readingThemeStyles.summaryBg : 'bg-slate-950/50 border border-slate-850 border-r-4 border-emerald-500'
                          }`}
                          style={{
                            fontSize: isReadingMode ? `${Math.round(readingFontSize * 0.9)}px` : undefined,
                            lineHeight: isReadingMode ? readingLineHeight : undefined
                          }}
                        >
                          <h4 className={`font-bold uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5 ${
                            isReadingMode ? readingThemeStyles.summaryTitle : 'text-xs text-slate-400'
                          }`}>
                            <Info className="w-4 h-4 text-emerald-400" />
                            نقاط ومفاتيح الاستذكار السريع (موضع أسئلة الامتحان):
                          </h4>
                          <ul className="space-y-2">
                            {concept.keyPoints.map((point, i) => (
                              <li key={i} className="flex items-start gap-2 leading-relaxed">
                                <span className={`${isReadingMode ? readingThemeStyles.accentText : 'text-emerald-400'} mt-0.5`}>•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Deep-Dive Sub-Section Questions & Answers */}
                        {concept.questionsAndAnswers && concept.questionsAndAnswers.length > 0 && (
                          <div className={`mt-6 space-y-3 rounded-xl p-4 transition-all ${
                            isReadingMode ? readingThemeStyles.qaBg : 'bg-slate-950/70 border border-indigo-500/30'
                          }`}>
                            <div className="flex items-center gap-2 border-b border-indigo-500/20 pb-2">
                              <HelpCircle className="w-4 h-4 text-indigo-400" />
                              <h4 className="text-xs font-bold text-indigo-300 font-mono">
                                أسئلة وإجابات تعمّقية حول هذه الجزئية (سؤال وجواب وتطبيق):
                              </h4>
                            </div>

                            <div className="space-y-3">
                              {concept.questionsAndAnswers.map((qa, qaIdx) => (
                                <div 
                                  key={qaIdx} 
                                  className={`rounded-lg p-3.5 space-y-2 transition-all ${
                                    isReadingMode ? readingThemeStyles.qaBoxBg : 'bg-slate-900/80 border border-slate-800'
                                  }`}
                                  style={{
                                    fontSize: isReadingMode ? `${Math.round(readingFontSize * 0.9)}px` : undefined,
                                    lineHeight: isReadingMode ? readingLineHeight : undefined
                                  }}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/30 shrink-0 mt-0.5 font-mono">
                                      س {qaIdx + 1}
                                    </span>
                                    <h5 className="font-extrabold text-white leading-relaxed">
                                      {qa.question}
                                    </h5>
                                  </div>
                                  
                                  <div className={`rounded p-3 leading-relaxed pr-3 border-r-2 ${
                                    isReadingMode ? readingThemeStyles.qaAnsBg : 'bg-slate-950/80 border border-emerald-500/20 text-emerald-300/90 border-r-emerald-500 text-xs'
                                  }`}>
                                    <strong className="text-emerald-400 block mb-1">الإجابة والتفسير الدقيق:</strong>
                                    {qa.answer}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: VISUAL EXPLANATIONS & DIAGRAMS */}
              {activeTab === 'visuals' && (
                <motion.div
                  key="visuals"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  {/* Dynamic Custom Interactive Visualizer per Lecture */}
                  {selectedLectureId === 1 && (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm">
                      <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-emerald-400">محاكي انقباض القطعة العضلية (Sarcomere Contraction Simulator)</h3>
                          <p className="text-xs text-slate-400">حرك الشريط للتحكم في الانقباض العضلي ولاحظ كيف تنزلق خيوط الأكتين متقاربة.</p>
                        </div>
                        <span className="bg-emerald-500/25 text-emerald-300 text-xs px-2.5 py-1 rounded font-mono border border-emerald-500/30">تفاعلي</span>
                      </div>

                      {/* Interactive SVG Render */}
                      <div className="bg-slate-950 p-4 rounded-lg flex items-center justify-center min-h-[220px] overflow-hidden border border-slate-900">
                        <svg width="100%" height="200" viewBox="0 0 600 200" className="max-w-xl">
                          {/* Background Grid Lines */}
                          <line x1="0" y1="100" x2="600" y2="100" stroke="#1e293b" strokeDasharray="5,5" />
                          
                          {/* Z-Lines (Moveable left & right) */}
                          {(() => {
                            const leftZ = 60 + (sarcomereSlider * 0.7);
                            const rightZ = 540 - (sarcomereSlider * 0.7);
                            const actinLength = 150;
                            
                            return (
                              <>
                                {/* Left Z Line */}
                                <line x1={leftZ} y1="20" x2={leftZ} y2="180" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" />
                                <text x={leftZ - 12} y="15" fill="#f43f5e" fontSize="11" fontWeight="bold">Z</text>
                                
                                {/* Right Z Line */}
                                <line x1={rightZ} y1="20" x2={rightZ} y2="180" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" />
                                <text x={rightZ + 6} y="15" fill="#f43f5e" fontSize="11" fontWeight="bold">Z</text>

                                {/* Actin Filaments Left (Attached to Left Z) */}
                                <line x1={leftZ} y1="50" x2={leftZ + actinLength} y2="50" stroke="#0ea5e9" strokeWidth="4" />
                                <line x1={leftZ} y1="150" x2={leftZ + actinLength} y2="150" stroke="#0ea5e9" strokeWidth="4" />

                                {/* Actin Filaments Right (Attached to Right Z) */}
                                <line x1={rightZ} y1="50" x2={rightZ - actinLength} y2="50" stroke="#0ea5e9" strokeWidth="4" />
                                <line x1={rightZ} y1="150" x2={rightZ - actinLength} y2="150" stroke="#0ea5e9" strokeWidth="4" />

                                {/* Myosin Filaments */}
                                <line x1="180" y1="100" x2="420" y2="100" stroke="#ea580c" strokeWidth="8" />
                                
                                {/* Bridges */}
                                {Array.from({ length: 6 }).map((_, i) => {
                                  const xPos = 200 + i * 40;
                                  const hookYOffset = sarcomereSlider > 20 ? 12 : 5;
                                  return (
                                    <g key={i}>
                                      <line x1={xPos} y1="100" x2={xPos + 5} y2={100 - hookYOffset - 12} stroke="#f59e0b" strokeWidth="2.5" />
                                      <line x1={xPos} y1="100" x2={xPos + 5} y2={100 + hookYOffset + 12} stroke="#f59e0b" strokeWidth="2.5" />
                                    </g>
                                  );
                                })}

                                <text x="300" y="94" fill="#ea580c" fontSize="10" textAnchor="middle" fontWeight="bold">خيوط ميوسين سميكة (A)</text>
                                <text x={leftZ + 40} y="42" fill="#0ea5e9" fontSize="9" fontWeight="bold">خيوط أكتين رفيعة</text>

                                {/* H Zone */}
                                <line x1={leftZ + actinLength} y1="115" x2={rightZ - actinLength} y2="115" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,3" />
                                <text x="300" y="132" fill="#f59e0b" fontSize="10" textAnchor="middle">المنطقة شبه المضيئة (H)</text>

                                {/* I Zone */}
                                {leftZ < 180 && (
                                  <>
                                    <line x1={leftZ} y1="170" x2="180" y2="170" stroke="#38bdf8" strokeWidth="1.5" />
                                    <text x={(leftZ + 180) / 2} y="185" fill="#38bdf8" fontSize="9" textAnchor="middle">المنطقة المضيئة (I)</text>
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      {/* Slider Controls */}
                      <div className="mt-5 space-y-4 bg-slate-950 p-4 rounded-lg border border-slate-900">
                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span>حالة الانبساط التام (0)</span>
                          <span className="text-emerald-400 font-bold">الحالة الحالية: {sarcomereSlider === 0 ? 'انبساط تام' : sarcomereSlider === 100 ? 'انقباض عضلي تام' : 'انقباض جزئي'} ({sarcomereSlider}%)</span>
                          <span>حالة انقباض تام (100)</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sarcomereSlider}
                          onChange={(e) => setSarcomereSlider(Number(e.target.value))}
                          className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                        />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
                          <button onClick={() => setSarcomereSlider(0)} className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 py-1.5 px-2 rounded cursor-pointer transition-colors">انبساط تام (0%)</button>
                          <button onClick={() => setSarcomereSlider(30)} className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 py-1.5 px-2 rounded cursor-pointer transition-colors">انقباض مجهد (30%)</button>
                          <button onClick={() => setSarcomereSlider(65)} className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 py-1.5 px-2 rounded cursor-pointer transition-colors">انقباض شديد (65%)</button>
                          <button onClick={() => setSarcomereSlider(100)} className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 py-1.5 px-2 rounded cursor-pointer transition-colors">انقباض تام (100%)</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedLectureId === 2 && (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm">
                      <h3 className="text-lg font-bold text-white mb-2">محاكاة حيوية: نظام التغذية الراجعة لتنظيم الكالسيوم</h3>
                      <p className="text-xs text-slate-400 mb-4">اختر مستوى الكالسيوم الحالي بالدم لتلاحظ استجابة الغدة المقابلة وإفراز هرمونها الخاص لتصحيح المسار.</p>
                      
                      <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                        <button 
                          onClick={() => setCalciumLevel('high')}
                          className={`p-3 rounded-lg border text-sm font-bold transition-all cursor-pointer ${
                            calciumLevel === 'high' 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/35 shadow-lg'
                              : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800 border-slate-800/80'
                          }`}
                        >
                          ارتفاع الكالسيوم في الدم
                        </button>
                        <button 
                          onClick={() => setCalciumLevel('normal')}
                          className={`p-3 rounded-lg border text-sm font-bold transition-all cursor-pointer ${
                            calciumLevel === 'normal' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35 shadow-lg'
                              : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800 border-slate-800/80'
                          }`}
                        >
                          مستوى كالسيوم طبيعي
                        </button>
                        <button 
                          onClick={() => setCalciumLevel('low')}
                          className={`p-3 rounded-lg border text-sm font-bold transition-all cursor-pointer ${
                            calciumLevel === 'low' 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/35 shadow-lg'
                              : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800 border-slate-800/80'
                          }`}
                        >
                          انخفاض الكالسيوم في الدم
                        </button>
                      </div>

                      <div className="bg-slate-950/85 text-white p-5 rounded-lg border border-slate-850 flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-1 space-y-3">
                          {calciumLevel === 'high' && (
                            <>
                              <span className="inline-block bg-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-full font-bold">نشاط الغدة الدرقية</span>
                              <h4 className="text-base font-bold">إفراز هرمون الكالسيتونين (Calcitonin)</h4>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                عندما يرتفع مستوى الكالسيوم بالدم، تتحسس الخلايا الحويصلية في **الغدة الدرقية** هذا الارتفاع، فتفرز هرمون الكالسيتونين الذي يقوم بـ:
                                <br />• ترسيب الكالسيوم الزائد في العظام لبناء المادة العظمية الصلبة.
                                <br />• تثبيط امتصاص الكالسيوم في الأمعاء وتقليل إعادة امتصاصه بالكلية ليطرح مع البول.
                              </p>
                            </>
                          )}
                          {calciumLevel === 'normal' && (
                            <>
                              <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold">حالة الاستقرار</span>
                              <h4 className="text-base font-bold">التوازن الأسموزي والهرموني المثالي</h4>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                يكون مستشعر الكالسيوم بالدم مستقراً عند حوالي 9-11 ملغ/ديسيلتر. في هذه الحالة، تكون إفرازات الكالسيتونين من الدرقية والباراثورمون من الجاردرقية متزنة ومنخفضة للحفاظ على مرونة الجهاز العظمي ومستويات التوصيل العصبي السليمة.
                              </p>
                            </>
                          )}
                          {calciumLevel === 'low' && (
                            <>
                              <span className="inline-block bg-rose-500/20 text-rose-400 text-xs px-2.5 py-1 rounded-full font-bold">نشاط الغدد الجاردرقية</span>
                              <h4 className="text-base font-bold">إفراز هرمون الباراثورمون (Parathormone)</h4>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                عندما ينخفض الكالسيوم في الدم، تقوم **الغدد الجار درقية الأربعة** فوراً بإفراز هرمون الباراثورمون لرفع تركيز الكالسيوم بالدم عبر:
                                <br />• تحفيز سحب الكالسيوم من مخازن العظام إلى مجرى الدم (قد يسبب الهشاشة إذا طالت المدة).
                                <br />• تحفيز الكلى على زيادة إعادة امتصاص الكالسيوم وتحفيز تفعيل فيتامين D لزيادة امتصاصه بالأمعاء.
                              </p>
                            </>
                          )}
                        </div>

                        {/* Miniature visual schematic */}
                        <div className="w-full md:w-56 bg-slate-900 border border-slate-800 p-4 rounded-lg text-center space-y-4">
                          <span className="text-xs text-slate-400 block font-mono">الاستجابة النسيجية:</span>
                          <div className="flex justify-around items-center">
                            <div className="space-y-1">
                              <span className="block text-xs text-slate-500">العظام</span>
                              <span className={`text-sm font-bold ${calciumLevel === 'high' ? 'text-emerald-400' : calciumLevel === 'low' ? 'text-rose-400' : 'text-slate-500'}`}>
                                {calciumLevel === 'high' ? 'ترسيب وبناء' : calciumLevel === 'low' ? 'سحب الكالسيوم' : 'مستقر'}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="block text-xs text-slate-500">الكلية</span>
                              <span className={`text-sm font-bold ${calciumLevel === 'high' ? 'text-amber-400' : calciumLevel === 'low' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {calciumLevel === 'high' ? 'إفراز بالبول' : calciumLevel === 'low' ? 'إعادة امتصاص' : 'مستقر'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedLectureId === 4 && (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm">
                      <h3 className="text-lg font-bold text-white mb-2">محاكاة تفاعلية: دورة الطمث والهرمونات</h3>
                      <p className="text-xs text-slate-400 mb-4">اختر يوم الدورة لتلاحظ تغيرات الهرمونات وسمك بطانة الرحم وحالة المبيض.</p>
                      
                      <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar mb-6">
                        {[1, 5, 11, 14, 21, 28].map(day => (
                          <button
                            key={day}
                            onClick={() => setMenstrualDay(day)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                              menstrualDay === day
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-900/20'
                                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800/80'
                            }`}
                          >
                            اليوم {day} ({day === 1 ? 'بداية الحيض' : day === 5 ? 'نضج جراف' : day === 11 ? 'قمة الاستروجين' : day === 14 ? 'التبويض' : day === 21 ? 'ذروة البروجسترون' : 'نهاية الدورة'})
                          </button>
                        ))}
                      </div>

                      <div className="bg-slate-950/80 text-white p-5 rounded-lg border border-slate-850 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                          <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2.5 py-1 rounded-full font-bold">تفاصيل اليوم {menstrualDay} من الدورة</span>
                          
                          {menstrualDay === 1 && (
                            <div>
                              <h4 className="text-base font-bold mb-2 text-white">بداية مرحلة الطمث (Menstruation)</h4>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                مع هبوط البروجسترون، تتمزق بطانة الرحم وتخرج مع الدم. تبدأ الغدة النخامية بإفراز هرمون **FSH** ببطء لتنبيه حويصلات جديدة في المبيض للنمو.
                              </p>
                            </div>
                          )}
                          {menstrualDay === 5 && (
                            <div>
                              <h4 className="text-base font-bold mb-2 text-white">بدء نضج حويصلة جراف</h4>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                هرمون **FSH** ينبه نمو حويصلة واحدة تسود بالمبيض، وتبدأ هذه الحويصلة بإنتاج كميات متزايدة من **الإستروجين** لإعادة بناء بطانة الرحم المتهدمة.
                              </p>
                            </div>
                          )}
                          {menstrualDay === 11 && (
                            <div>
                              <h4 className="text-base font-bold mb-2 text-white">قمة إفراز الإستروجين</h4>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                حويصلة جراف تصل لحجم كبير وتفرز ذروة **الإستروجين**، مما يزيد سمك بطانة الرحم ويحفز النخامية لإعداد الارتفاع المفاجئ لهرمون **LH**.
                              </p>
                            </div>
                          )}
                          {menstrualDay === 14 && (
                            <div>
                              <h4 className="text-base font-bold mb-2 text-white">لحظة التبويض (Ovulation Day)</h4>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                هرمون **LH** يفرز بغزارة بالغة (القمة)، مما يسبب تفجير حويصلة جراف وخروج البويضة (خلية بيضية ثانوية n) نحو قناة فالوب، وبداية تشكل الجسم الأصفر.
                              </p>
                            </div>
                          )}
                          {menstrualDay === 21 && (
                            <div>
                              <h4 className="text-base font-bold mb-2 text-white">ذروة نشاط الجسم الأصفر والبروجسترون</h4>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                يفرز الجسم الأصفر كميات هائلة من **البروجسترون**، مما يمنع نضج أي بويضات جديدة (يثبط FSH, LH) ويزيد سمك بطانة الرحم وغزارة شعيراتها لاستقبال الجنين.
                              </p>
                            </div>
                          )}
                          {menstrualDay === 28 && (
                            <div>
                              <h4 className="text-base font-bold mb-2 text-white">تلاشي الجسم الأصفر (نهاية الدورة)</h4>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                في غياب الإخصاب، يضمر الجسم الأصفر، فيهبط البروجسترون فجأة، وتبدأ بطانة الرحم في فقدان تماسكها تمهيداً لبدء دورة طمث جديدة.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Visual Summary */}
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3 flex flex-col justify-center text-center">
                          <span className="text-xs text-slate-400 block font-mono">مستويات الهرمونات التقريبية:</span>
                          <div className="space-y-1.5 text-xs text-slate-300">
                            <div className="flex justify-between"><span>FSH:</span><span className="font-bold text-indigo-400">{menstrualDay === 5 ? 'مرتفع' : 'منخفض'}</span></div>
                            <div className="flex justify-between"><span>LH:</span><span className="font-bold text-amber-400">{menstrualDay === 14 ? 'أقصى قمة' : 'منخفض'}</span></div>
                            <div className="flex justify-between"><span>Estrogen:</span><span className="font-bold text-cyan-400">{menstrualDay === 11 ? 'ذروة' : 'طبيعي'}</span></div>
                            <div className="flex justify-between"><span>Progesterone:</span><span className="font-bold text-rose-400">{menstrualDay === 21 ? 'ذروة' : 'منخفض'}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Universal Visual Tool Renders */}
                  {activeLecture.visualTools.map((tool) => (
                    <div 
                      key={tool.id} 
                      className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-6"
                    >
                      <div className="border-b border-slate-800 pb-3">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Sliders className="w-5 h-5 text-emerald-400" />
                          {tool.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">النمذجة البصرية لتسهيل الفهم وحفظ التفاعلات الحيوية.</p>
                      </div>

                      {/* Display Generated Realistic Image */}
                      {tool.imageUrl && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            المجسم ثلاثي الأبعاد الواقعي (Realistic 3D Medical Illustration):
                          </h4>
                          <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-xl shadow-slate-950/50">
                            <img 
                              src={tool.imageUrl} 
                              alt={tool.title} 
                              referrerPolicy="no-referrer"
                              className="w-full max-h-[380px] object-cover rounded-xl transition-all duration-500 group-hover:scale-[1.01] filter brightness-95 group-hover:brightness-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                              <p className="text-[11px] text-slate-300 font-medium">مجسم مجهري دقيق ومحاكاة نسيجية عالية الجودة</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Display ASCII Art if present */}
                      {tool.asciiArt && (
                        <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-850" dir="ltr">
                          <pre>{tool.asciiArt}</pre>
                        </div>
                      )}

                      {/* Display Graphic Storyboard for designers/generation */}
                      <div className="bg-slate-950/40 border border-emerald-950/20 rounded-lg p-5">
                        <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5 font-sans">
                          <Info className="w-4 h-4 text-emerald-400" />
                          لوحة التصميم الإيضاحي ومكونات الرسمة (Storyboard Graphic):
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                          <div className="space-y-2">
                            <p><strong>الفكرة الرسومية:</strong> {tool.storyboard.graphicIdea}</p>
                            <p><strong>الألوان المحددة:</strong> {tool.storyboard.colors.join(' ، ')}</p>
                          </div>
                          <div className="space-y-2">
                            <p><strong>عناصر اللوحة:</strong></p>
                            <ul className="list-disc pr-4 space-y-1">
                              {tool.storyboard.elements.map((el, idx) => <li key={idx}>{el}</li>)}
                            </ul>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-3 border-t border-slate-800/80 pt-2 italic">
                          * تخطيط المشهد: {tool.storyboard.layoutDescription}
                        </p>
                      </div>

                      {/* Display Pathway Steps if available */}
                      {tool.pathwaySteps && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-bold text-white">خطوات وتتابع المسار الحيوي (Biological Pathway):</h4>
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            {tool.pathwaySteps.map((step) => (
                              <div key={step.stepNumber} className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg">
                                <div className="text-emerald-400 font-bold text-xs mb-1 font-mono">الخطوة {step.stepNumber}</div>
                                <h5 className="font-bold text-white text-xs mb-1">{step.title}</h5>
                                <p className="text-[10px] text-slate-400 leading-relaxed">{step.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comparison Table if present */}
                      {tool.comparison && (
                        <div className="border border-slate-800 rounded-lg overflow-hidden">
                          <div className="bg-slate-950/50 p-3 border-b border-slate-850 font-bold text-sm text-slate-200">
                            {tool.comparison.title}
                          </div>
                          <table className="w-full text-xs text-right text-slate-300">
                            <thead className="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
                              <tr>
                                <th className="p-3">وجه المقارنة (Aspect)</th>
                                <th className="p-3">{tool.comparison.headerA}</th>
                                <th className="p-3">{tool.comparison.headerB}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                              {tool.comparison.rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/40">
                                  <td className="p-3 font-semibold text-white border-l border-slate-850">{row.aspect}</td>
                                  <td className="p-3 border-l border-slate-850">{row.entityA}</td>
                                  <td className="p-3">{row.entityB}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}

              {/* TAB 3: EXAM TRICKS & CURVES */}
              {activeTab === 'tricks' && (
                <motion.div
                  key="tricks"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  {activeLecture.tricks.map((trick) => (
                    <div 
                      key={trick.id} 
                      className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-6"
                    >
                      <div className="border-b border-slate-800 pb-3">
                        <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2.5 py-1 rounded-full font-bold mb-2 inline-block border border-amber-500/20">
                          {trick.crossChapterLink}
                        </span>
                        <h3 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-amber-500" />
                          تريكة الامتحان: {trick.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">الربط الذهني وحل اللبس بين المصطلحات المتشابهة لتجاوز أسئلة التفكير العليا.</p>
                      </div>

                      {/* Core Concept Box */}
                      <div className="bg-slate-950/50 border-r-4 border-amber-500 rounded-l-lg p-4 text-xs text-slate-300 leading-relaxed">
                        <strong>المفهوم الجوهري للتريكة:</strong> {trick.coreConcept}
                      </div>

                      {/* Misconceptions comparison */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">تفكيك المغالطات والخلط الشائع:</h4>
                        {trick.misconceptions.map((misc, idx) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-800 rounded-lg p-4 bg-slate-950/30">
                            <div>
                              <div className="flex gap-2 mb-2 items-center">
                                <span className="bg-indigo-600/25 text-indigo-400 border border-indigo-500/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">أ</span>
                                <span className="text-xs font-bold text-indigo-300">{misc.termA}</span>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">مقابل:</p>
                              <div className="flex gap-2 mt-2 items-center">
                                <span className="bg-cyan-600/25 text-cyan-400 border border-cyan-500/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">ب</span>
                                <span className="text-xs font-bold text-cyan-300">{misc.termB}</span>
                              </div>
                            </div>
                            <div className="border-t md:border-t-0 md:border-r border-slate-800 pt-3 md:pt-0 md:pr-4 space-y-2">
                              <p className="text-xs text-slate-300"><strong className="text-emerald-400">الفرق العلمي الحاسم:</strong> {misc.difference}</p>
                              <p className="text-xs text-amber-300 bg-amber-500/5 border border-amber-500/10 p-2 rounded"><strong className="text-amber-500">التركيز الامتحاني للوزارة:</strong> {misc.examFocus}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Interactive Curve/Graph Visualizer */}
                      {trick.interactiveGraph && (
                        <div className="bg-slate-950/60 text-white rounded-xl p-5 border border-slate-800">
                          <h4 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                            المنحنى البياني التفاعلي: {trick.interactiveGraph.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 mb-4">انقر على النقاط الزمنية بالأسفل لقراءة التفسير المفهومي التفصيلي للمنحنيات.</p>

                          {/* Render Curve using custom Responsive SVG lines */}
                          <div className="bg-slate-950 p-4 rounded-lg flex items-center justify-center min-h-[180px] border border-slate-900">
                            <svg width="100%" height="150" viewBox="0 0 500 150" className="max-w-lg overflow-visible">
                              {/* Axis */}
                              <line x1="40" y1="10" x2="40" y2="120" stroke="#475569" strokeWidth="2" />
                              <line x1="40" y1="120" x2="480" y2="120" stroke="#475569" strokeWidth="2" />
                              
                              {/* Axis Labels */}
                              <text x="490" y="124" fill="#94a3b8" fontSize="8">{trick.interactiveGraph.xAxisLabel}</text>
                              <text x="35" y="5" fill="#94a3b8" fontSize="8" textAnchor="end">{trick.interactiveGraph.yAxisLabel}</text>

                              {/* Curve A (E.g. Water loss / Normal contraction) */}
                              <path 
                                d={`M ${40 + (0 * 100)} ${120 - (trick.interactiveGraph.points[0].valueA * 0.9)} 
                                    C ${40 + (0.5 * 100)} ${120 - (trick.interactiveGraph.points[1].valueA * 0.9)} 
                                      ${40 + (1.2 * 100)} ${120 - (trick.interactiveGraph.points[1].valueA * 0.9)} 
                                      ${40 + (2.0 * 100)} ${120 - (trick.interactiveGraph.points[2].valueA * 0.9)} 
                                    S ${40 + (3.2 * 100)} ${120 - (trick.interactiveGraph.points[3].valueA * 0.9)} 
                                      ${40 + (4.0 * 100)} ${120 - (trick.interactiveGraph.points[3].valueA * 0.9)}`} 
                                fill="none" 
                                stroke="#10b981" 
                                strokeWidth="3" 
                              />

                              {/* Curve B if exists */}
                              {trick.interactiveGraph.curveBLabel && trick.interactiveGraph.points[0].valueB !== undefined && (
                                <path 
                                  d={`M ${40 + (0 * 100)} ${120 - ((trick.interactiveGraph.points[0].valueB ?? 0) * 0.9)} 
                                      C ${40 + (0.5 * 100)} ${120 - ((trick.interactiveGraph.points[1].valueB ?? 0) * 0.9)} 
                                        ${40 + (1.2 * 100)} ${120 - ((trick.interactiveGraph.points[1].valueB ?? 0) * 0.9)} 
                                        ${40 + (2.0 * 100)} ${120 - ((trick.interactiveGraph.points[2].valueB ?? 0) * 0.9)} 
                                      S ${40 + (3.2 * 100)} ${120 - ((trick.interactiveGraph.points[3].valueB ?? 0) * 0.9)} 
                                        ${40 + (4.0 * 100)} ${120 - ((trick.interactiveGraph.points[3].valueB ?? 0) * 0.9)}`} 
                                  fill="none" 
                                  stroke="#38bdf8" 
                                  strokeWidth="3" 
                                />
                              )}

                              {/* Interactive Nodes */}
                              {trick.interactiveGraph.points.map((point, index) => {
                                const xPos = 40 + index * 100;
                                const yPosA = 120 - point.valueA * 0.9;
                                return (
                                  <g key={index} className="cursor-pointer group">
                                    <circle cx={xPos} cy={yPosA} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                                    {point.valueB !== undefined && (
                                      <circle cx={xPos} cy={120 - (point.valueB ?? 0) * 0.9} r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                                    )}
                                    <text x={xPos} y="135" fill="#94a3b8" fontSize="8" textAnchor="middle">{point.label}</text>
                                  </g>
                                );
                              })}
                            </svg>
                          </div>

                          {/* Legend */}
                          <div className="flex gap-4 justify-center items-center mt-3 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block"></span>
                              <span className="text-slate-300">{trick.interactiveGraph.curveALabel}</span>
                            </div>
                            {trick.interactiveGraph.curveBLabel && (
                              <div className="flex items-center gap-1.5">
                                <span className="w-3 h-1 bg-cyan-400 rounded-full inline-block"></span>
                                <span className="text-slate-300">{trick.interactiveGraph.curveBLabel}</span>
                              </div>
                            )}
                          </div>

                          {/* Description box per data point */}
                          <div className="mt-4 bg-slate-950/80 p-4 rounded-lg border border-slate-900 space-y-3">
                            <span className="text-xs font-bold text-emerald-400 block">تفصيل وحساب النظم الجانبية على المنحنى:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {trick.interactiveGraph.points.map((pt, i) => (
                                <div key={i} className="bg-slate-900 border border-slate-800 p-2.5 rounded text-xs">
                                  <strong className="text-white block mb-1">{pt.label}:</strong>
                                  <p className="text-slate-300 leading-relaxed text-[11px]">{pt.description}</p>
                                </div>
                              ))}
                            </div>
                            <p className="text-[11px] text-amber-300 pt-2 border-t border-slate-800 leading-relaxed">
                              💡 <strong>الاستنتاج العلمي للمنحنى:</strong> {trick.interactiveGraph.interpretation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}

              {/* TAB 4: INTERACTIVE QUIZ SIMULATOR & SPEED QUIZ */}
              {activeTab === 'quiz' && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Quiz Sub-tab Switcher Bar */}
                  <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 gap-2 overflow-x-auto">
                    <button
                      onClick={() => setQuizSubTab('practice')}
                      className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        quizSubTab === 'practice'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                      }`}
                    >
                      <BookMarked className="w-4 h-4" />
                      <span>بنك الأسئلة التفاعلي</span>
                    </button>

                    <button
                      onClick={() => setQuizSubTab('speed_quiz')}
                      className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        quizSubTab === 'speed_quiz'
                          ? 'bg-gradient-to-l from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                          : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-900/50'
                      }`}
                    >
                      <Zap className="w-4 h-4 fill-current animate-pulse text-amber-300" />
                      <span>⚡ اختبار السرعة التنافسي</span>
                    </button>

                    <button
                      onClick={() => setQuizSubTab('mock_exam')}
                      className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        quizSubTab === 'mock_exam'
                          ? 'bg-gradient-to-l from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                          : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-900/50'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                      <span>🏛️ اختبار محاكاة شامل (50 سؤال)</span>
                    </button>

                    <button
                      onClick={() => setQuizSubTab('mistake_bank')}
                      className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        quizSubTab === 'mistake_bank'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40 font-extrabold'
                          : 'text-rose-400/90 hover:text-rose-300 hover:bg-slate-900/50'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-300" />
                      <span>🧠 بنك الأخطاء</span>
                    </button>
                  </div>

                  {quizSubTab === 'mock_exam' ? (
                    <MockExamTool
                      allLectures={allLectures}
                      onToast={setFlashcardToast}
                      isFocusMode={isFocusMode}
                      onToggleFocusMode={() => setIsFocusMode(prev => !prev)}
                    />
                  ) : quizSubTab === 'speed_quiz' ? (
                    <SpeedQuizTool
                      currentLecture={activeLecture}
                      allLectures={allLectures}
                      extendedQuestions={extendedQuestionPool}
                      onToast={setFlashcardToast}
                    />
                  ) : quizSubTab === 'mistake_bank' ? (
                    <MistakeBankTool
                      allLectures={allLectures}
                      onToast={setFlashcardToast}
                    />
                  ) : (
                    <>
                      {/* Top Dashboard & Question Controller */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <BookMarked className="w-5 h-5 text-emerald-400" />
                          بنك الأسئلة المنهجية والتفاعلية الذكية
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">تدرج في الصعوبة من الفهم المباشر إلى مستويات التفكير العليا والربط بين أجزاء المنهج.</p>
                      </div>

                      {/* Question Bank Completeness Gauge */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-3 min-w-[260px]">
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center text-[11px] font-bold">
                            <span className="text-slate-400">مقياس اكتمال البنك (هدف 100 سؤال)</span>
                            <span className="text-emerald-400 font-mono">{extendedQuestionPool.length} / 100</span>
                          </div>
                          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-l from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (extendedQuestionPool.length / 100) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-center font-mono">
                          <div className="text-emerald-400 text-xs font-bold leading-none">
                            {Math.min(100, Math.round((extendedQuestionPool.length / 100) * 100))}%
                          </div>
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest block mt-0.5">جاهزية</span>
                        </div>
                      </div>
                    </div>

                    {/* Mode Selectors & AI Generator Controls */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
                      {/* Left: Domain Toggle */}
                      <div className="lg:col-span-5 space-y-2">
                        <span className="text-[11px] text-slate-400 font-bold block">نطاق ومصدر الأسئلة:</span>
                        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-850">
                          <button
                            onClick={() => {
                              setQuizMode('built-in');
                              setDifficultyFilter('all');
                              setCurrentQuestionIndex(0);
                              setSelectedOption(null);
                              setIsQuizSubmitted(false);
                            }}
                            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                              quizMode === 'built-in'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
                            }`}
                          >
                            🏛️ الأسئلة الرسمية للوزارة ({activeLecture.questionBank.length})
                          </button>
                          <button
                            onClick={() => {
                              setQuizMode('extended');
                              setDifficultyFilter('all');
                              setCurrentQuestionIndex(0);
                              setSelectedOption(null);
                              setIsQuizSubmitted(false);
                            }}
                            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                              quizMode === 'extended'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
                            }`}
                          >
                            🚀 بنك التدريب الممتد ({extendedQuestionPool.length})
                          </button>
                        </div>
                      </div>

                      {/* Right: AI Generator Deck */}
                      <div className="lg:col-span-7 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                            توليد وتوسيع الأسئلة بالذكاء الاصطناعي (Gemini):
                          </span>
                          {customQuestions[selectedLectureId]?.length > 0 && (
                            <button
                              onClick={handleClearCustomQuestions}
                              className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                              title="تفريغ الأسئلة المخصصة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف الإضافات</span>
                            </button>
                          )}
                        </div>

                        <div className="flex gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-850">
                          {/* Choose Difficulty to Generate */}
                          <select
                            value={generatorDifficulty}
                            onChange={(e) => setGeneratorDifficulty(e.target.value as any)}
                            disabled={generationLoading}
                            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                          >
                            <option value="easy">مستوى سهل (مباشر)</option>
                            <option value="medium">مستوى متوسط (استنتاجي)</option>
                            <option value="high">مستويات عليا (تفكير مركب)</option>
                          </select>

                          {/* Trigger Generation Button */}
                          <button
                            onClick={() => generateNewQuestions(generatorDifficulty)}
                            disabled={generationLoading}
                            className="flex-1 bg-gradient-to-l from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all shadow-md shadow-emerald-950/20 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {generationLoading ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>جاري صياغة الأسئلة بالذكاء الاصطناعي...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                                <span>توليد 5 أسئلة ذكية جديدة</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Source & Category Filters Row */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-amber-400 font-bold block flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-amber-400" />
                        <span>تصنيف وتصنيف الأسئلة حسب المصدر ونوع التدريب:</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'all', label: '🌐 جميع المصادر والأنواع' },
                          { id: 'past_exams', label: '🏛️ امتحانات سنوات سابقة (مصر)' },
                          { id: 'expectations_2026', label: '🔮 توقعات ونماذج 2026' },
                          { id: 'conceptual', label: '🧠 أسئلة مفاهيم وتعليل' },
                          { id: 'calculations', label: '📐 مسائل وقوانين رقمية' },
                        ].map(src => (
                          <button
                            key={src.id}
                            onClick={() => {
                              setSourceFilter(src.id as any);
                              setCurrentQuestionIndex(0);
                              setSelectedOption(null);
                              setIsQuizSubmitted(false);
                            }}
                            className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              sourceFilter === src.id
                                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-300 shadow-md'
                                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                            }`}
                          >
                            {src.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty Filters Row */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] text-slate-400 font-bold block">تصفية وترتيب الأسئلة الحالية حسب درجة الصعوبة:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'all', label: '🗂️ جميع مستويات الصعوبة' },
                          { id: 'easy', label: '🟢 مستوى سهل (مباشر وفهم)' },
                          { id: 'medium', label: '🟡 مستوى متوسط (تطبيق واستنتاج)' },
                          { id: 'high', label: '🔴 مستويات تفكير عليا (ربط وتركيب)' },
                        ].map(diff => (
                          <button
                            key={diff.id}
                            onClick={() => {
                              setDifficultyFilter(diff.id as any);
                              setCurrentQuestionIndex(0);
                              setSelectedOption(null);
                              setIsQuizSubmitted(false);
                            }}
                            className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              difficultyFilter === diff.id
                                ? 'bg-slate-950 border-emerald-500/40 text-emerald-300 shadow'
                                : 'bg-slate-950/30 border-slate-850 text-slate-400 hover:bg-slate-900/50 hover:text-slate-300'
                            }`}
                          >
                            {diff.label} ({
                              (quizMode === 'built-in' ? activeLecture.questionBank : extendedQuestionPool).filter(q => {
                                const diffStr = q.complexity?.toLowerCase() || '';
                                const sourceStr = q.sourceYear?.toLowerCase() || '';
                                if (diff.id === 'all') return true;
                                if (diff.id === 'high') return diffStr === 'high' || sourceStr.includes('عليا') || sourceStr.includes('صعبة');
                                if (diff.id === 'medium') return diffStr === 'medium' || sourceStr.includes('متوسط');
                                if (diff.id === 'easy') return diffStr === 'easy' || sourceStr.includes('سهل');
                                return true;
                              }).length
                            })
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Generation Loading State Animation */}
                  {generationLoading && (
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-8 text-center space-y-4 animate-pulse">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">جاري تحليل النسيج المعرفي وصياغة الأسئلة...</h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          يقوم المساعد الذكي الآن بصياغة أسئلة امتحانية مطابقة للمواصفات الفنية للوزارة، وتصميم الخيارات المشتتة بعناية مع كتابة نموذج التفنيد الشامل لكل بديل.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Main Active Quiz Frame */}
                  {!generationLoading && (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-6">
                      {filteredQuestions.length === 0 ? (
                        <div className="text-center py-12 space-y-4">
                          <HelpCircle className="w-12 h-12 text-slate-500 mx-auto" />
                          <h4 className="text-base font-bold text-white">لا توجد أسئلة متوفرة في هذا الفلتر</h4>
                          <p className="text-xs text-slate-400 max-w-md mx-auto">
                            يمكنك التبديل إلى بنك التدريب الممتد أو توليد أسئلة بالذكاء الاصطناعي مباشرة في هذا المستوى من الصعوبة لتوسيع البنك وزيادة التدريب.
                          </p>
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                setQuizMode('extended');
                                setDifficultyFilter('all');
                                setCurrentQuestionIndex(0);
                                setSelectedOption(null);
                                setIsQuizSubmitted(false);
                              }}
                              className="bg-slate-950 hover:bg-slate-900 text-emerald-400 border border-slate-800 font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
                            >
                              إعادة ضبط الفلاتر وعرض البنك الممتد
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Scoreboard Summary if finished */}
                          {currentQuestionIndex >= filteredQuestions.length ? (
                            <div className="text-center py-8 space-y-6">
                              <div className="relative inline-flex items-center justify-center mb-2">
                                {/* Beautiful SVG progress ring */}
                                <svg className="w-28 h-28 transform -rotate-90">
                                  <circle
                                    cx="56"
                                    cy="56"
                                    r="46"
                                    className="stroke-slate-800"
                                    strokeWidth="8"
                                    fill="transparent"
                                  />
                                  <circle
                                    cx="56"
                                    cy="56"
                                    r="46"
                                    className={`${
                                      Math.round((quizScore / (filteredQuestions.length || 1)) * 100) >= 80
                                        ? 'stroke-emerald-500'
                                        : Math.round((quizScore / (filteredQuestions.length || 1)) * 100) >= 50
                                        ? 'stroke-amber-500'
                                        : 'stroke-rose-500'
                                    } transition-all duration-1000`}
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 46}
                                    strokeDashoffset={2 * Math.PI * 46 * (1 - (quizScore / (filteredQuestions.length || 1)))}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                  <span className="text-2xl font-bold font-mono text-white">
                                    {Math.round((quizScore / (filteredQuestions.length || 1)) * 100)}%
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-bold">الدرجة المحققة</span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white">تحليل أداء المحاضرة الحالية</h3>
                                <p className="text-sm text-slate-400 max-w-md mx-auto">
                                  أجبت بنجاح على <strong className="text-emerald-400 text-lg">{quizScore}</strong> من أصل <strong className="text-slate-300 text-lg">{filteredQuestions.length}</strong> أسئلة تدريبية. تم تسجيل هذه النتيجة في سجل تحصيلك العام.
                                </p>
                              </div>

                              {/* Points of strength and weaknesses based on score */}
                              <div className="max-w-xl mx-auto bg-slate-950/60 rounded-xl border border-slate-850 p-5 space-y-4 text-right" dir="rtl">
                                <h4 className="text-xs font-bold text-slate-400 border-b border-slate-850 pb-2 flex items-center gap-2">
                                  <Award className="w-4 h-4 text-amber-500" />
                                  التقرير المعرفي للمستويات العلمية (Diagnostic Report):
                                </h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <span className="block font-bold text-emerald-400 mb-1 flex items-center gap-1">
                                      <span>🟢 نقاط القوة (Strengths):</span>
                                    </span>
                                    <ul className="list-disc list-inside space-y-1 text-slate-300 pr-1">
                                      {Math.round((quizScore / (filteredQuestions.length || 1)) * 100) >= 80 ? (
                                        <>
                                          <li>استيعاب كامل للعلاقات والروابط البيولوجية المتشعبة.</li>
                                          <li>التمكن من تحليل المنحنيات واستخلاص النتائج الحيوية بدقة.</li>
                                          <li>تفكيك المشتتات والخيارات المضللة بنجاح متميز.</li>
                                        </>
                                      ) : Math.round((quizScore / (filteredQuestions.length || 1)) * 100) >= 50 ? (
                                        <>
                                          <li>فهم صحيح للمفاهيم الأساسية والمصطلحات الرئيسية.</li>
                                          <li>القدرة على حل الأسئلة الاستنتاجية ذات المستوى المتوسط.</li>
                                        </>
                                      ) : (
                                        <>
                                          <li>الرغبة في التعلم والبدء في حل الأسئلة المنهجية.</li>
                                          <li>التعرف على شكل وأنماط الأسئلة المبتكرة لنظام الوزارة الجديد.</li>
                                        </>
                                      )}
                                    </ul>
                                  </div>

                                  <div className="border-t md:border-t-0 md:border-r border-slate-850 pt-3 md:pt-0 md:pr-4">
                                    <span className="block font-bold text-rose-400 mb-1 flex items-center gap-1">
                                      <span>🔴 نقاط تحتاج إلى تركيز (Weaknesses):</span>
                                    </span>
                                    <ul className="list-disc list-inside space-y-1 text-slate-300 pr-1">
                                      {Math.round((quizScore / (filteredQuestions.length || 1)) * 100) >= 80 ? (
                                        <>
                                          <li>تجنب التسرع في الأسئلة التي تحتوي على صياغات مركبة.</li>
                                          <li>حافظ على التكرار المتباعد عبر بطاقات الاستذكار النشط لثبات المعلومة.</li>
                                        </>
                                      ) : Math.round((quizScore / (filteredQuestions.length || 1)) * 100) >= 50 ? (
                                        <>
                                          <li>الربط بين جزئيات الفصول والمنحنيات التفاعلية العميقة.</li>
                                          <li>الخلط بين بعض التأثيرات الهرمونية أو الاستجابات المناعية المشتركة.</li>
                                          <li>يُنصح بمراجعة قسم "التريكات والمنحنيات" لهذا الفصل مجدداً.</li>
                                        </>
                                      ) : (
                                        <>
                                          <li>اللبس بين المصطلحات المتشابهة وصعوبة تفكيك المغالطات العلمية.</li>
                                          <li>مواجهة تحدي في قراءة وحساب المتغيرات البيولوجية (مثل حسابات اللييفات).</li>
                                          <li>يُنصح بشدة بدراسة "الشرح والمفاهيم" وحل الأسئلة المباشرة تدريجياً.</li>
                                        </>
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-4 flex flex-wrap justify-center gap-3">
                                <button
                                  onClick={handleResetQuiz}
                                  className="bg-slate-950 hover:bg-slate-900 text-emerald-400 border border-slate-850 font-bold px-6 py-2.5 rounded-lg text-sm transition-all shadow cursor-pointer"
                                >
                                  إعادة تدريب الأسئلة من جديد
                                </button>
                                <button
                                  onClick={() => {
                                    setQuizMode('extended');
                                    generateNewQuestions(generatorDifficulty);
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-all shadow cursor-pointer"
                                >
                                  توليد مجموعة أسئلة إضافية جديدة
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveTab('performance');
                                  }}
                                  className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold px-6 py-2.5 rounded-lg text-sm transition-all flex items-center gap-1.5 shadow cursor-pointer"
                                >
                                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                                  <span>عرض لوحة الأداء العام للفصول</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Active Quiz Question Header */}
                              <div className="flex justify-between items-center border-b border-slate-800/85 pb-3 mb-2">
                                <div>
                                  <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono">سؤال {currentQuestionIndex + 1} من {filteredQuestions.length}</span>
                                  <span className="block text-xs text-slate-500 mt-1">المصدر: {activeQuestion?.sourceYear || 'نموذج استرشادي وزارة'}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                  <span className={`text-[10px] px-2.5 py-1 rounded font-bold ${
                                    activeQuestion?.complexity === 'high'
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                      : activeQuestion?.complexity === 'medium'
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                    درجة الصعوبة: {
                                      activeQuestion?.complexity === 'high'
                                        ? 'مستويات تفكير عليا'
                                        : activeQuestion?.complexity === 'medium'
                                        ? 'متوسط الاستنتاج'
                                        : 'فهم وتطبيق مباشر'
                                    }
                                  </span>
                                </div>
                              </div>

                              {/* Question Text */}
                              <div className="bg-slate-950/50 border-r-4 border-emerald-500 rounded-l-lg p-5 border-l border-y border-slate-900">
                                <p className="text-base text-white leading-relaxed font-semibold">
                                  {activeQuestion?.questionText}
                                </p>
                              </div>

                              {/* Multiple Choices */}
                              <div className="space-y-3">
                                {Object.entries(activeQuestion?.options || {}).map(([key, optionText]) => {
                                  const isSelected = selectedOption === key;
                                  const isCorrectAns = activeQuestion?.correctAnswer === key;
                                  
                                  let btnClass = 'bg-slate-950/30 border-slate-800 text-slate-300 hover:bg-slate-900';
                                  if (isSelected) {
                                    btnClass = 'bg-slate-950 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/5';
                                  }
                                  
                                  if (isQuizSubmitted) {
                                    if (isCorrectAns) {
                                      btnClass = 'bg-emerald-500/10 border-emerald-500/55 text-emerald-300 font-medium';
                                    } else if (isSelected) {
                                      btnClass = 'bg-rose-500/10 border-rose-500/55 text-rose-300';
                                    } else {
                                      btnClass = 'bg-slate-950/20 border-slate-900 text-slate-500 opacity-50';
                                    }
                                  }

                                  return (
                                    <button
                                      key={key}
                                      onClick={() => handleAnswerSelect(key as 'A' | 'B' | 'C' | 'D')}
                                      disabled={isQuizSubmitted}
                                      className={`w-full text-right p-4 rounded-xl border text-sm transition-all duration-200 flex items-start gap-3 cursor-pointer ${btnClass}`}
                                    >
                                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 border ${
                                        isQuizSubmitted 
                                          ? (isCorrectAns ? 'bg-emerald-600 border-emerald-600 text-white' : isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'bg-slate-800 border-slate-750 text-slate-500')
                                          : (isSelected ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'bg-slate-800 border-slate-750 text-slate-400')
                                      }`}>
                                        {key}
                                      </span>
                                      <span className="flex-1 leading-relaxed">{optionText}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Corrective Feedback & Model Answers */}
                              {isQuizSubmitted && (
                                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 space-y-4 animate-fadeIn">
                                  <div className="flex items-center gap-2 border-b border-slate-850 pb-2 mb-2">
                                    {selectedOption === activeQuestion?.correctAnswer ? (
                                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                        إجابة صحيحة وممتازة!
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-rose-400 font-bold text-sm">
                                        <XCircle className="w-5 h-5 text-rose-400" />
                                        إجابة غير صحيحة، حاول تحليل العلاقة مجدداً.
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-3 text-xs leading-relaxed text-slate-400">
                                    {/* Detailed correct response rationale */}
                                    <div className="bg-emerald-500/5 p-3 rounded border border-emerald-500/15">
                                      <strong className="text-emerald-400 block mb-1">لماذا الخيار الصحيح هو ({activeQuestion?.correctAnswer})؟</strong>
                                      <p>{activeQuestion?.explanation?.correct}</p>
                                    </div>

                                    {/* Detailed explanations for wrong distractors */}
                                    {activeQuestion?.explanation && (
                                      <div className="p-3 bg-slate-950 rounded border border-slate-850 space-y-2">
                                        <strong className="text-white block mb-1">تفنيد باقي الخيارات المشتتة (Distractors Rationale):</strong>
                                        <ul className="space-y-2 list-none">
                                          {(() => {
                                            const correctAnswer = activeQuestion.correctAnswer;
                                            const incorrectLetters = ['A', 'B', 'C', 'D'].filter(letter => letter !== correctAnswer);
                                            return Object.entries(activeQuestion.explanation).map(([key, value]) => {
                                              if (key === 'correct') return null;
                                              
                                              let optLetter = '';
                                              if (key === 'incorrectA') optLetter = incorrectLetters[0];
                                              else if (key === 'incorrectB') optLetter = incorrectLetters[1];
                                              else if (key === 'incorrectC') optLetter = incorrectLetters[2];
                                              else optLetter = key.replace('incorrect', '');
                                              
                                              return (
                                                <li key={key} className="text-slate-400 border-r-2 border-slate-800 pr-2">
                                                  <strong className="text-slate-300 font-semibold">الخيار {optLetter}:</strong> {value}
                                                </li>
                                              );
                                            });
                                          })()}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Quiz Controls Row */}
                              <div className="flex justify-between items-center border-t border-slate-800/60 pt-4 mt-6">
                                <button
                                  onClick={handleQuizSubmit}
                                  disabled={!selectedOption || isQuizSubmitted}
                                  className={`font-bold px-6 py-2.5 rounded-lg text-sm transition-all shadow cursor-pointer ${
                                    !selectedOption || isQuizSubmitted
                                      ? 'bg-slate-950 text-slate-600 cursor-not-allowed border border-slate-900 shadow-none'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/10'
                                  }`}
                                >
                                  تأكيد الإجابة وعرض النموذج
                                </button>
                                
                                {isQuizSubmitted && (
                                  <button
                                    onClick={handleNextQuestion}
                                    className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-all flex items-center gap-1.5 shadow cursor-pointer"
                                  >
                                    <span>
                                      {currentQuestionIndex === filteredQuestions.length - 1 
                                        ? 'عرض ملخص التدريب' 
                                        : 'السؤال التالي'}
                                    </span>
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  </>
                  )}
                </motion.div>
              )}

              {/* TAB 5: ACTIVE RECALL FLASHCARDS WITH EYE-CARE DARK STUDY MODE & BRIGHTNESS CONTROL */}
              {activeTab === 'flashcards' && (
                <motion.div
                  key="flashcards"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {(() => {
                    const themeKey = darkStudyMode ? darkStudyTheme : 'standard';
                    const themeStyles = {
                      oled: {
                        containerBg: 'bg-black border-zinc-900 shadow-2xl shadow-black',
                        cardFrontBg: 'bg-zinc-950 border-zinc-800 text-zinc-100',
                        cardBackBg: 'bg-zinc-900 border-zinc-800 text-zinc-100',
                        textMain: 'text-zinc-100',
                        textMuted: 'text-zinc-400',
                        glow: 'from-amber-500/10 via-zinc-800/30 to-transparent',
                        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                        accentBtn: 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200',
                      },
                      warm: {
                        containerBg: 'bg-[#120d08] border-[#382414] shadow-2xl shadow-amber-950/40',
                        cardFrontBg: 'bg-[#1c130b] border-[#4a301a] text-amber-100',
                        cardBackBg: 'bg-[#26190e] border-[#4a301a] text-amber-50',
                        textMain: 'text-amber-100',
                        textMuted: 'text-amber-500/90',
                        glow: 'from-amber-600/20 via-orange-600/10 to-transparent',
                        badge: 'bg-amber-600/20 text-amber-300 border-amber-600/30',
                        accentBtn: 'bg-[#1f140a] hover:bg-[#2c1c0e] border-[#4a301a] text-amber-200',
                      },
                      emerald: {
                        containerBg: 'bg-[#031410] border-[#09382d] shadow-2xl shadow-emerald-950/50',
                        cardFrontBg: 'bg-[#06201a] border-[#0e4d3e] text-emerald-100',
                        cardBackBg: 'bg-[#0b2b23] border-[#0e4d3e] text-emerald-50',
                        textMain: 'text-emerald-100',
                        textMuted: 'text-emerald-500/90',
                        glow: 'from-emerald-500/20 via-teal-500/10 to-transparent',
                        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                        accentBtn: 'bg-[#06231d] hover:bg-[#0c332b] border-[#0e4d3e] text-emerald-200',
                      },
                      standard: {
                        containerBg: 'bg-slate-900/40 border-slate-800 shadow-xl backdrop-blur-sm',
                        cardFrontBg: 'bg-slate-950 border-slate-800 text-slate-200',
                        cardBackBg: 'bg-slate-900 border-slate-800 text-slate-100',
                        textMain: 'text-slate-100',
                        textMuted: 'text-slate-400',
                        glow: 'from-emerald-500/10 via-cyan-500/5 to-transparent',
                        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
                        accentBtn: 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200',
                      }
                    }[themeKey];

                    return (
                      <div className={`border rounded-xl p-6 transition-all duration-300 relative overflow-hidden ${themeStyles.containerBg}`}>
                        
                        {/* Ambient Focus Glow Effect when Dark Study Mode is active */}
                        {darkStudyMode && (
                          <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-radial ${themeStyles.glow} blur-3xl pointer-events-none opacity-60`} />
                        )}

                        {/* Top Control Bar Header */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800/80 pb-5 mb-6 relative z-10">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Layers className="w-5 h-5 text-emerald-400" />
                                بطاقات الاستذكار النشط (Active Recall Flashcards)
                              </h3>
                              {darkStudyMode && (
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 animate-pulse">
                                  <Moon className="w-3 h-3 text-amber-400" />
                                  <span>نمط المذاكرة المظلمة مفعل</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              تقنية التكرار المتباعد لترسيخ المفاهيم المعقدة، مع حماية عينيك وتقليل الإجهاد في الجلسات الطويلة.
                            </p>
                          </div>

                          {/* Dark Study Mode Toggle Switch */}
                          <div className="flex items-center gap-3 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 self-stretch lg:self-auto justify-between lg:justify-start">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setDarkStudyMode(!darkStudyMode);
                                  setFlashcardToast(
                                    !darkStudyMode 
                                      ? '🌙 تم تفعيل نمط المذاكرة المظلمة لحماية العينين!' 
                                      : '☀️ تم العودة للنمط القياسي.'
                                  );
                                }}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                                  darkStudyMode ? 'bg-amber-500' : 'bg-slate-700'
                                }`}
                                title="تشغيل / إيقاف نمط المذاكرة المظلمة"
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    darkStudyMode ? 'translate-x-1' : 'translate-x-6'
                                  }`}
                                />
                              </button>
                              <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                                <Moon className={`w-3.5 h-3.5 ${darkStudyMode ? 'text-amber-400' : 'text-slate-400'}`} />
                                <span>المذاكرة المظلمة (حماية العين)</span>
                              </span>
                            </div>

                            {/* Reset Button */}
                            <button
                              onClick={() => {
                                setDarkStudyMode(true);
                                setDarkStudyTheme('oled');
                                setCardBrightness(85);
                                setTiltIntensity(100);
                                setFlashcardToast('🔄 تم إعادة ضبط جميع إعدادات العرض والحركة (85% سطوع / 100% ميل 3D).');
                              }}
                              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 bg-slate-900 rounded border border-slate-800 transition-all cursor-pointer"
                              title="إعادة ضبط إعدادات العرض"
                            >
                              <RotateCcw className="w-3 h-3 text-slate-400" />
                              <span>إعادة ضبط</span>
                            </button>
                          </div>
                        </div>

                        {/* Interactive Dark Study, Brightness & 3D Tilt Settings Toolbar */}
                        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 mb-6 space-y-4 relative z-10">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                            
                            {/* Color Theme Selector Pills */}
                            <div className="md:col-span-12 lg:col-span-4 space-y-2">
                              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
                                <Moon className="w-3.5 h-3.5 text-amber-400" />
                                لون المذاكرة المظلمة (Night Shift):
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => {
                                    setDarkStudyMode(true);
                                    setDarkStudyTheme('oled');
                                    setFlashcardToast('🌑 تم تفعيل نمط OLED الأسود المطلق.');
                                  }}
                                  className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                                    darkStudyMode && darkStudyTheme === 'oled'
                                      ? 'bg-zinc-900 text-amber-300 border-amber-500/50 shadow-md'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                >
                                  <span>🌑 OLED أسود</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setDarkStudyMode(true);
                                    setDarkStudyTheme('warm');
                                    setFlashcardToast('☕ تم تفعيل نمط الشفق الدافئ (Night Shift).');
                                  }}
                                  className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                                    darkStudyMode && darkStudyTheme === 'warm'
                                      ? 'bg-[#26190e] text-amber-300 border-amber-600/60 shadow-md'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                >
                                  <span>☕ شفق دافئ</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setDarkStudyMode(true);
                                    setDarkStudyTheme('emerald');
                                    setFlashcardToast('🌿 تم تفعيل نمط الزمردي الهادئ.');
                                  }}
                                  className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                                    darkStudyMode && darkStudyTheme === 'emerald'
                                      ? 'bg-[#09382d]/60 text-emerald-300 border-emerald-500/50 shadow-md'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                >
                                  <span>🌿 زمردي هادئ</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setDarkStudyMode(false);
                                    setDarkStudyTheme('standard');
                                    setFlashcardToast('🌙 الوضع القياسي الداكن.');
                                  }}
                                  className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                                    !darkStudyMode
                                      ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40 shadow-md'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                >
                                  <span>🌙 قياسي</span>
                                </button>
                              </div>
                            </div>

                            {/* Card Brightness Slider & Readout */}
                            <div className="md:col-span-6 lg:col-span-4 space-y-2 border-t md:border-t-0 border-r-0 lg:border-r border-slate-800 pt-3 md:pt-0 lg:pr-4">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                                  سطوع إضاءة البطاقة:
                                </span>
                                <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                  {cardBrightness}%
                                </span>
                              </div>

                              {/* Brightness Range Slider */}
                              <div className="flex items-center gap-3">
                                <Moon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <input
                                  type="range"
                                  min="25"
                                  max="100"
                                  step="5"
                                  value={cardBrightness}
                                  onChange={(e) => setCardBrightness(Number(e.target.value))}
                                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                />
                                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                              </div>

                              {/* Quick Brightness Presets */}
                              <div className="flex items-center justify-between text-[10px] gap-1 pt-1">
                                <button
                                  onClick={() => {
                                    setCardBrightness(30);
                                    setFlashcardToast('🌙 تم ضبط السطوع على 30% (قراءة خافتة جداً بالظلام).');
                                  }}
                                  className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                    cardBrightness === 30
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                >
                                  30% خافت
                                </button>

                                <button
                                  onClick={() => {
                                    setCardBrightness(60);
                                    setFlashcardToast('⛅ تم ضبط السطوع على 60% (إضاءة مريحة للعين).');
                                  }}
                                  className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                    cardBrightness === 60
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                >
                                  60% مريح
                                </button>

                                <button
                                  onClick={() => {
                                    setCardBrightness(85);
                                    setFlashcardToast('🔆 تم ضبط السطوع على 85% (سطوع متوازن).');
                                  }}
                                  className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                    cardBrightness === 85
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                >
                                  85% متوازن
                                </button>

                                <button
                                  onClick={() => {
                                    setCardBrightness(100);
                                    setFlashcardToast('☀️ تم ضبط السطوع على 100% (سطوع كامل).');
                                  }}
                                  className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                    cardBrightness === 100
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                >
                                  100% كامل
                                </button>
                              </div>
                            </div>

                            {/* 3D Tilt Motion Intensity Slider (.preserve-3d) */}
                            <div className="md:col-span-6 lg:col-span-4 space-y-2 border-t md:border-t-0 border-r-0 lg:border-r border-slate-800 pt-3 md:pt-0 lg:pr-4">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                                  شدة تأثير ميل 3D (Tilt Intensity):
                                </span>
                                <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                  {tiltIntensity}%
                                </span>
                              </div>

                              {/* Tilt Range Slider */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-500 shrink-0">2D</span>
                                <input
                                  type="range"
                                  min="0"
                                  max="200"
                                  step="10"
                                  value={tiltIntensity}
                                  onChange={(e) => setTiltIntensity(Number(e.target.value))}
                                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-[10px] font-bold text-amber-400 shrink-0">3D</span>
                              </div>

                              {/* Quick Tilt Presets */}
                              <div className="flex items-center justify-between text-[10px] gap-1 pt-1">
                                <button
                                  onClick={() => {
                                    setTiltIntensity(0);
                                    setFlashcardToast('🛑 تم إيقاف الحركة الثلاثية الأبعاد (سطح ثابت 2D).');
                                  }}
                                  className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                    tiltIntensity === 0
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                >
                                  0% مسطح
                                </button>

                                <button
                                  onClick={() => {
                                    setTiltIntensity(50);
                                    setFlashcardToast('✨ تم ضبط شدة حركة 3D على 50% (خفيفة وهادئة).');
                                  }}
                                  className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                    tiltIntensity === 50
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                >
                                  50% خفيف
                                </button>

                                <button
                                  onClick={() => {
                                    setTiltIntensity(100);
                                    setFlashcardToast('🎯 تم ضبط شدة حركة 3D على 100% (قياسي مريح).');
                                  }}
                                  className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                    tiltIntensity === 100
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                >
                                  100% قياسي
                                </button>

                                <button
                                  onClick={() => {
                                    setTiltIntensity(180);
                                    setFlashcardToast('🚀 تم ضبط شدة حركة 3D على 180% (تجسيم قوي).');
                                  }}
                                  className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                    tiltIntensity === 180
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                                  }`}
                                >
                                  180% مجسم
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {currentFlashcards.length === 0 ? (
                          <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-slate-800">
                            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm font-semibold">عذراً، لم تتوفر بطاقات استذكار في هذا الفصل بعد.</p>
                            <p className="text-slate-500 text-xs mt-1">يمكنك استخدام زر التوليد بالذكاء الاصطناعي لإضافة بطاقات مخصصة!</p>
                          </div>
                        ) : (() => {
                          const safeIndex = Math.min(Math.max(0, recallCardIndex), Math.max(0, currentFlashcards.length - 1));
                          const activeCard = currentFlashcards[safeIndex];

                          if (!activeCard) return null;

                          return (
                            <div className="max-w-lg mx-auto space-y-6 relative z-10">
                              
                              {/* Statistics Summary Bar */}
                              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs text-right" dir="rtl">
                                <div className="flex justify-between items-center text-[11px] text-slate-400 font-bold">
                                  <span>نسبة الإتقان لهذه المحاضرة:</span>
                                  <span className="text-emerald-400 font-mono">
                                    {currentFlashcards.length > 0 ? Math.round((stats.mastered / currentFlashcards.length) * 100) : 0}%
                                  </span>
                                </div>
                                
                                {/* Segmented Progress Bar */}
                                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden flex">
                                  <div 
                                    className="bg-emerald-500 transition-all duration-300"
                                    style={{ width: `${currentFlashcards.length > 0 ? (stats.mastered / currentFlashcards.length) * 100 : 0}%` }}
                                  />
                                  <div 
                                    className="bg-rose-500 transition-all duration-300"
                                    style={{ width: `${currentFlashcards.length > 0 ? (stats.review / currentFlashcards.length) * 100 : 0}%` }}
                                  />
                                  <div 
                                    className="bg-slate-700 transition-all duration-300"
                                    style={{ width: `${currentFlashcards.length > 0 ? (stats.unseen / currentFlashcards.length) * 100 : 0}%` }}
                                  />
                                </div>

                                <div className="flex justify-between text-[10px] text-slate-400 font-bold pt-1">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                                    <span>متقن: {stats.mastered}</span>
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                                    <span>مراجعة: {stats.review}</span>
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block"></span>
                                    <span>جديد: {stats.unseen}</span>
                                  </span>
                                </div>
                              </div>

                              {/* Interactive Flashcard with Dynamic Brightness Filter & Tactile 3D Perspective Flip */}
                              <div 
                                className="flashcard-perspective relative group transition-all duration-300"
                                style={{
                                  filter: `brightness(${cardBrightness}%) contrast(${cardBrightness < 50 ? 115 : 100}%)`,
                                  '--tilt-factor': tiltIntensity / 100,
                                } as React.CSSProperties}
                              >
                                
                                {/* Glowing Ambient Backdrop Spotlight when dark mode is enabled */}
                                {darkStudyMode && (
                                  <div 
                                    className="absolute -inset-1 rounded-3xl opacity-30 blur-md transition duration-500 group-hover:opacity-50"
                                    style={{
                                      background: darkStudyTheme === 'warm' 
                                        ? 'radial-gradient(circle, rgba(217, 119, 6, 0.4) 0%, transparent 70%)'
                                        : darkStudyTheme === 'emerald'
                                        ? 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)'
                                        : 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)'
                                    }}
                                  />
                                )}

                                <AnimatePresence mode="wait" initial={false}>
                                  <motion.div 
                                    key={activeCard.id}
                                    initial={{ opacity: 0, x: 24, scale: 0.97 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -24, scale: 0.97 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                                    className={`h-72 cursor-pointer relative preserve-3d ${isCardFlipped ? 'flipped' : 'unflipped'}`}
                                    style={{
                                      '--tilt-factor': tiltIntensity / 100,
                                      '--card-glow-color': (() => {
                                        const cat = activeCard.category || '';
                                        if (cat.includes('مخصصة')) return 'rgba(245, 158, 11, 0.45)';
                                        if (cat.includes('كيمياء')) return 'rgba(16, 185, 129, 0.45)';
                                        if (cat.includes('فيزياء')) return 'rgba(99, 102, 241, 0.45)';
                                        if (cat.includes('أحياء')) return 'rgba(236, 72, 153, 0.45)';
                                        if (cat.includes('رياضيات')) return 'rgba(14, 165, 233, 0.45)';
                                        if (cat.includes('جيولوجيا')) return 'rgba(168, 85, 247, 0.45)';
                                        let h = 0;
                                        for (let i = 0; i < cat.length; i++) h = cat.charCodeAt(i) + ((h << 5) - h);
                                        const colors = ['rgba(16, 185, 129, 0.45)', 'rgba(99, 102, 241, 0.45)', 'rgba(245, 158, 11, 0.45)', 'rgba(236, 72, 153, 0.45)', 'rgba(14, 165, 233, 0.45)', 'rgba(168, 85, 247, 0.45)', 'rgba(20, 184, 166, 0.45)'];
                                        return colors[Math.abs(h) % colors.length];
                                      })()
                                    } as React.CSSProperties}
                                  >
                                    {/* Front Side (Question) */}
                                  <div 
                                    className={`absolute inset-0 border-2 rounded-2xl p-6 flex flex-col justify-between shadow-2xl backface-hidden ${themeStyles.cardFrontBg} ${
                                      isCardFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                                    } transition-opacity duration-300`}
                                    style={{ 
                                      backfaceVisibility: 'hidden',
                                      WebkitBackfaceVisibility: 'hidden' 
                                    }}
                                  >
                                    <div className="flex justify-between items-center w-full">
                                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${themeStyles.badge}`}>
                                        سؤال - {activeCard.category}
                                      </span>
                                      {(() => {
                                        const status = cardStatus[activeCard.id] || 'unseen';
                                        if (status === 'mastered') {
                                          return (
                                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 font-bold flex items-center gap-1">
                                              <span>متقن</span>
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                            </span>
                                          );
                                        }
                                        if (status === 'review') {
                                          return (
                                            <span className="bg-rose-500/10 text-rose-400 text-[10px] px-2 py-0.5 rounded border border-rose-500/20 font-bold flex items-center gap-1">
                                              <span>مراجعة</span>
                                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                            </span>
                                          );
                                        }
                                        return (
                                          <span className="bg-slate-500/10 text-slate-400 text-[10px] px-2 py-0.5 rounded border border-slate-500/20 font-bold flex items-center gap-1">
                                            <span>جديد</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                          </span>
                                        );
                                      })()}
                                    </div>
                                    
                                    <div className="my-auto py-2">
                                      <p className={`text-center font-bold text-base md:text-lg leading-relaxed px-2 ${themeStyles.textMain}`}>
                                        {activeCard.question}
                                      </p>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] border-t border-slate-800/60 pt-2">
                                      <span className={themeStyles.textMuted}>
                                        سطوع البطاقة: {cardBrightness}%
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsCardFlipped(!isCardFlipped);
                                        }}
                                        aria-label="قلب البطاقة"
                                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                                        <span className="text-xs">قلب البطاقة</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Back Side (Answer) */}
                                  <div 
                                    className={`absolute inset-0 border-2 rounded-2xl p-6 flex flex-col justify-between shadow-2xl backface-hidden ${themeStyles.cardBackBg} ${
                                      isCardFlipped ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                                    } transition-opacity duration-300`}
                                    style={{ 
                                      backfaceVisibility: 'hidden',
                                      WebkitBackfaceVisibility: 'hidden',
                                      transform: 'rotateY(180deg)',
                                      WebkitTransform: 'rotateY(180deg)'
                                    }}
                                  >
                                    <div className="flex justify-between items-center w-full">
                                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${themeStyles.badge}`}>
                                        الإجابة النموذجية
                                      </span>
                                      {(() => {
                                        const status = cardStatus[activeCard.id] || 'unseen';
                                        if (status === 'mastered') {
                                          return (
                                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 font-bold flex items-center gap-1">
                                              <span>متقن</span>
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                            </span>
                                          );
                                        }
                                        if (status === 'review') {
                                          return (
                                            <span className="bg-rose-500/10 text-rose-400 text-[10px] px-2 py-0.5 rounded border border-rose-500/20 font-bold flex items-center gap-1">
                                              <span>مراجعة</span>
                                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                            </span>
                                          );
                                        }
                                        return (
                                          <span className="bg-slate-500/10 text-slate-400 text-[10px] px-2 py-0.5 rounded border border-slate-500/20 font-bold flex items-center gap-1">
                                            <span>جديد</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                          </span>
                                        );
                                      })()}
                                    </div>
                                    
                                    <div className="my-auto py-2">
                                      <p className={`text-right text-xs md:text-sm leading-relaxed px-2 overflow-y-auto max-h-40 no-scrollbar ${themeStyles.textMain}`}>
                                        {activeCard.answer}
                                      </p>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] border-t border-slate-800/60 pt-2">
                                      <span className={themeStyles.textMuted}>
                                        إجابة تفصيلية مراجعة
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsCardFlipped(!isCardFlipped);
                                        }}
                                        aria-label="قلب البطاقة"
                                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                                        <span className="text-xs">قلب البطاقة</span>
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              </AnimatePresence>
                            </div>

                              {/* Flashcard navigation controls */}
                              <div className="flex justify-between items-center gap-2">
                                <button
                                  onClick={() => {
                                    if (safeIndex > 0) {
                                      setRecallCardIndex(safeIndex - 1);
                                      setIsCardFlipped(false);
                                    }
                                  }}
                                  disabled={safeIndex === 0}
                                  className={`px-4 py-2 rounded-lg border flex items-center gap-1.5 text-xs font-bold transition-all ${
                                    safeIndex === 0 
                                      ? 'text-slate-700 bg-slate-950/20 border-slate-900 cursor-not-allowed'
                                      : `${themeStyles.accentBtn} cursor-pointer`
                                  }`}
                                >
                                  <ChevronRight className="w-4 h-4" />
                                  <span>السابق</span>
                                </button>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                                    title="قلب البطاقة"
                                  >
                                    <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ${isCardFlipped ? 'rotate-180' : ''}`} />
                                    <span>{isCardFlipped ? 'عرض السؤال' : 'عرض الإجابة'}</span>
                                  </button>
                                  <span className="text-xs text-slate-400 font-mono font-bold bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-850">
                                    بطاقة {safeIndex + 1} من {currentFlashcards.length}
                                  </span>
                                </div>

                                <button
                                  onClick={() => {
                                    if (safeIndex < currentFlashcards.length - 1) {
                                      setRecallCardIndex(safeIndex + 1);
                                      setIsCardFlipped(false);
                                    }
                                  }}
                                  disabled={safeIndex === currentFlashcards.length - 1}
                                  className={`px-4 py-2 rounded-lg border flex items-center gap-1.5 text-xs font-bold transition-all ${
                                    safeIndex === currentFlashcards.length - 1 
                                      ? 'text-slate-700 bg-slate-950/20 border-slate-900 cursor-not-allowed'
                                      : `${themeStyles.accentBtn} cursor-pointer`
                                  }`}
                                >
                                  <span>التالي</span>
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Active Recall rating states */}
                              <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-3">
                                <span className="text-[11px] text-slate-300 block text-center font-bold">قيّم مستوى تمكنك من هذا السؤال لتنظيم المذاكرة التكرارية:</span>
                                <div className="grid grid-cols-3 gap-2">
                                  <button
                                    onClick={() => {
                                      setCardStatus(prev => {
                                        const next = { ...prev, [activeCard.id]: 'review' as const };
                                        localStorage.setItem('thanaweya_card_status', JSON.stringify(next));
                                        return next;
                                      });
                                      setFlashcardToast('تم التحديد كـ "أحتاج لمراجعته لاحقاً".');
                                    }}
                                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs py-2 rounded-lg font-bold border border-rose-500/20 cursor-pointer transition-all"
                                  >
                                    صعب / مراجعة 🔴
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCardStatus(prev => {
                                        const next = { ...prev, [activeCard.id]: 'unseen' as const };
                                        localStorage.setItem('thanaweya_card_status', JSON.stringify(next));
                                        return next;
                                      });
                                      setFlashcardToast('تم التحديد كـ "متوسط الفهم".');
                                    }}
                                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs py-2 rounded-lg font-bold border border-amber-500/20 cursor-pointer transition-all"
                                  >
                                    متوسط 🟡
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCardStatus(prev => {
                                        const next = { ...prev, [activeCard.id]: 'mastered' as const };
                                        localStorage.setItem('thanaweya_card_status', JSON.stringify(next));
                                        return next;
                                      });
                                      setFlashcardToast('تم التحديد كـ "تم الإتقان بالكامل!".');
                                    }}
                                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs py-2 rounded-lg font-bold border border-emerald-500/20 cursor-pointer transition-all"
                                  >
                                    أتقنته! 🟢
                                  </button>
                                </div>
                              </div>

                              {/* Eye-Care Tip Banner */}
                              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-2">
                                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                <p>
                                  💡 <strong>نصيحة طبية لحفظ ذاكرة البصر:</strong> عند الاستذكار المتأخر ليلاً، نوصي بتفعيل <strong>نمط الشفق الدافئ</strong> وضبط السطوع عند <strong>60% - 85%</strong> لحماية القرنية والتقليل من تشتت الانتباه الناجم عن الضوء الأزرق.
                                </p>
                              </div>

                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {/* TAB 6: SPECIAL SKELETAL MYOFIBRIL & BIOLOGY LAW CALCULATORS HUB */}
              {activeTab === 'calculator' && (
                <motion.div
                  key="calculator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-6"
                >
                  <div className="border-b border-slate-800 pb-3">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <Calculator className="w-5 h-5 text-emerald-400" />
                          مجمع القوانين والمسائل الرياضية للأحياء (Biology Math Hub)
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          أداة تفاعلية متكاملة لتبسيط حل المسائل الرياضية المعقدة في امتحانات الثانوية العامة (العضلات، الوراثة الـ DNA، وخلايا المناعة).
                        </p>
                      </div>
                    </div>

                    {/* Sub-tabs selector */}
                    <div className="flex gap-2 mt-4 border-t border-slate-800/80 pt-4 overflow-x-auto no-scrollbar">
                      <button
                        onClick={() => setCalcSubTab('myofibril')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                          calcSubTab === 'myofibril'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-lg'
                            : 'bg-slate-950/40 text-slate-400 hover:bg-slate-800 border-slate-850'
                        }`}
                      >
                        💪 آلة القطع العضلية
                      </button>
                      <button
                        onClick={() => setCalcSubTab('genetics')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                          calcSubTab === 'genetics'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-lg'
                            : 'bg-slate-950/40 text-slate-400 hover:bg-slate-800 border-slate-850'
                        }`}
                      >
                        🧬 حسابات الـ DNA والجينات
                      </button>
                      <button
                        onClick={() => setCalcSubTab('immunology')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                          calcSubTab === 'immunology'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-lg'
                            : 'bg-slate-950/40 text-slate-400 hover:bg-slate-800 border-slate-850'
                        }`}
                      >
                        🩸 حسابات خلايا المناعة والمصل
                      </button>
                    </div>
                  </div>

                  {calcSubTab === 'myofibril' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Inputs panel */}
                      <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-850 space-y-4">
                        <label className="block text-sm font-bold text-white">
                          أدخل عدد القطع العضلية المتجاورة (N):
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={calcN}
                          onChange={(e) => setCalcN(Math.max(1, Number(e.target.value)))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-base font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                        />
                        
                        <div className="flex flex-wrap gap-2 pt-2">
                          {[1, 3, 5, 10, 20, 50].map(val => (
                            <button
                              key={val}
                              onClick={() => setCalcN(val)}
                              className="bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 font-bold py-1.5 px-3 rounded-lg border border-slate-800 cursor-pointer"
                            >
                              {val} قطع
                            </button>
                          ))}
                        </div>

                        <div className="bg-emerald-500/5 border-r-4 border-emerald-500 rounded-l-lg p-3 text-[11px] text-slate-300 leading-relaxed">
                          💡 <strong>القوانين الحيوية المطبقة:</strong>
                          <br />• خطوط Z والمناطق المضيئة الكلية = N + 1
                          <br />• المناطق المضيئة كاملة بالوسط = N - 1
                          <br />• المناطق المضيئة غير الكاملة بالأطراف = 2 دائماً
                          <br />• المناطق الداكنة A والمنطقة شبه المضيئة H = N
                        </div>
                      </div>

                      {/* Results panel */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-center flex flex-col justify-center">
                          <span className="block text-[10px] text-slate-400">خطوط الداكنة (Z)</span>
                          <span className="text-2xl font-mono font-bold text-rose-400">{calcResults.zLines}</span>
                          <span className="text-[9px] text-slate-500 mt-1">Z-Lines (N + 1)</span>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-center flex flex-col justify-center">
                          <span className="block text-[10px] text-slate-400">المناطق الداكنة (A)</span>
                          <span className="text-2xl font-mono font-bold text-amber-400">{calcResults.darkBandsA}</span>
                          <span className="text-[9px] text-slate-500 mt-1">A-Bands (N)</span>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-center flex flex-col justify-center">
                          <span className="block text-[10px] text-slate-400">شبه المضيئة بالانبساط (H)</span>
                          <span className="text-2xl font-mono font-bold text-cyan-400">{calcResults.hZones}</span>
                          <span className="text-[9px] text-slate-500 mt-1">H-Zones (N)</span>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-center flex flex-col justify-center">
                          <span className="block text-[10px] text-slate-400">المضيئة الكاملة</span>
                          <span className="text-2xl font-mono font-bold text-emerald-400">{calcResults.completeIBands}</span>
                          <span className="text-[9px] text-slate-500 mt-1">Complete I-Bands (N - 1)</span>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-center flex flex-col justify-center col-span-2">
                          <span className="block text-[10px] text-slate-400">المناطق المضيئة الكلية (Total I-Bands)</span>
                          <span className="text-xl font-mono font-bold text-sky-300">{calcResults.totalIBands} ({calcResults.completeIBands} كاملة + 2 غير كاملة بالأطراف)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {calcSubTab === 'genetics' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                        {/* DNA calculator inputs */}
                        <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-850 space-y-4">
                          <span className="block text-sm font-bold text-white">حسابات شريط وجين الـ DNA:</span>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => setDnaInputType('nucleotides')}
                              className={`p-2 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                                dnaInputType === 'nucleotides'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-slate-900 text-slate-400 border-slate-800'
                              }`}
                            >
                              عدد النيوكليوتيدات
                            </button>
                            <button
                              onClick={() => setDnaInputType('codons')}
                              className={`p-2 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                                dnaInputType === 'codons'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-slate-900 text-slate-400 border-slate-800'
                              }`}
                            >
                              عدد الكودونات
                            </button>
                            <button
                              onClick={() => setDnaInputType('amino_acids')}
                              className={`p-2 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                                dnaInputType === 'amino_acids'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-slate-900 text-slate-400 border-slate-800'
                              }`}
                            >
                              الأحماض الأمينية
                            </button>
                          </div>

                          <div className="space-y-1">
                            <span className="block text-xs text-slate-400">القيمة المُدخلة:</span>
                            <input
                              type="number"
                              min="1"
                              value={dnaValue}
                              onChange={(e) => setDnaValue(Math.max(1, Number(e.target.value)))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-base font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                            />
                          </div>

                          <div className="bg-emerald-500/5 border-r-4 border-emerald-500 rounded-l-lg p-3 text-[11px] text-slate-300 space-y-1.5">
                            <strong>🧬 القوانين الذهبية للوراثة الجزيئية:</strong>
                            <br />• الكودون = 3 نيوكليوتيدات على الـ mRNA.
                            <br />• عدد الكودونات = نيوكليوتيدات الشريط الواحد (أو mRNA) ÷ 3
                            <br />• عدد الأحماض الأمينية = عدد كودونات الـ mRNA - كودون وقف واحد (1)
                          </div>
                        </div>

                        {/* DNA calculator results */}
                        <div className="grid grid-cols-2 gap-3">
                          {(() => {
                            const dnaNucleotides = dnaInputType === 'nucleotides' ? dnaValue : dnaInputType === 'codons' ? dnaValue * 3 : (dnaValue + 1) * 3;
                            const dnaCodons = dnaInputType === 'codons' ? dnaValue : dnaInputType === 'nucleotides' ? Math.floor(dnaValue / 3) : dnaValue + 1;
                            const dnaAminoAcids = dnaInputType === 'amino_acids' ? dnaValue : Math.max(0, dnaCodons - 1);

                            return (
                              <>
                                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-center flex flex-col justify-center">
                                  <span className="block text-[10px] text-slate-400 font-bold">النيوكليوتيدات (شريط جين)</span>
                                  <span className="text-2xl font-mono font-bold text-indigo-400">{dnaNucleotides}</span>
                                  <span className="text-[9px] text-slate-500 mt-1">نيوكليوتيدة لشريط واحد</span>
                                </div>
                                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-center flex flex-col justify-center">
                                  <span className="block text-[10px] text-slate-400 font-bold">إجمالي نيوكليوتيدات الجين</span>
                                  <span className="text-2xl font-mono font-bold text-purple-400">{dnaNucleotides * 2}</span>
                                  <span className="text-[9px] text-slate-500 mt-1">الجين (لولب مزدوج)</span>
                                </div>
                                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-center flex flex-col justify-center">
                                  <span className="block text-[10px] text-slate-400 font-bold">كودونات الـ mRNA</span>
                                  <span className="text-2xl font-mono font-bold text-amber-400">{dnaCodons}</span>
                                  <span className="text-[9px] text-slate-500 mt-1">كودون (تتضمن الوقف)</span>
                                </div>
                                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-center flex flex-col justify-center">
                                  <span className="block text-[10px] text-slate-400 font-bold">الأحماض الأمينية بالبروتين</span>
                                  <span className="text-2xl font-mono font-bold text-emerald-400">{dnaAminoAcids}</span>
                                  <span className="text-[9px] text-slate-500 mt-1">حمض أميني (سلسلة ببتيد)</span>
                                </div>
                                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-center flex flex-col justify-center col-span-2">
                                  <span className="block text-[10px] text-slate-400 font-bold">الروابط الببتيدية وعناصر أخرى</span>
                                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-slate-300 font-mono">
                                    <div className="bg-slate-900 border border-slate-850 p-2 rounded text-center">
                                      روابط ببتيدية: <span className="font-bold text-emerald-400">{Math.max(0, dnaAminoAcids - 1)}</span>
                                    </div>
                                    <div className="bg-slate-900 border border-slate-850 p-2 rounded text-center">
                                      جزيئات ماء منزوعة: <span className="font-bold text-cyan-400">{Math.max(0, dnaAminoAcids - 1)}</span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Chargaff's rules subsection */}
                      <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-xl space-y-4">
                        <span className="block text-sm font-bold text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          مستنتج قواعد تشارجاف (Chargaff Base Estimator):
                        </span>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans">
                          أدخل نسبة الأدينين (A) أو الثايمين (T) في عينة لولب مزدوج، وسيقوم النظام فوراً بحساب نسب القواعد النيتروجينية الثلاثة الأخرى بالتفصيل الرياضي.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          <div className="space-y-1">
                            <span className="block text-xs text-slate-400">نسبة الأدينين A% (أو T%):</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                max="49"
                                value={chargaffA}
                                onChange={(e) => setChargaffA(Math.min(49, Math.max(1, Number(e.target.value))))}
                                className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none text-white"
                              />
                              <span className="text-sm text-slate-400">%</span>
                            </div>
                          </div>

                          <div className="md:col-span-3 grid grid-cols-4 gap-2 text-center text-xs">
                            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                              <span className="block text-[10px] text-slate-500 font-bold">ثايمين (T)</span>
                              <span className="text-lg font-mono font-bold text-red-400">{chargaffA}%</span>
                            </div>
                            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                              <span className="block text-[10px] text-slate-500 font-bold">أدينين (A)</span>
                              <span className="text-lg font-mono font-bold text-emerald-400">{chargaffA}%</span>
                            </div>
                            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                              <span className="block text-[10px] text-slate-500 font-bold">سيتوزين (C)</span>
                              <span className="text-lg font-mono font-bold text-cyan-400">{50 - chargaffA}%</span>
                            </div>
                            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                              <span className="block text-[10px] text-slate-500 font-bold">جوانين (G)</span>
                              <span className="text-lg font-mono font-bold text-amber-400">{50 - chargaffA}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-emerald-950/10 border border-emerald-900/30 p-3 rounded-lg text-[11px] text-slate-400 font-sans">
                          📌 <strong>التفسير العلمي للتوازن:</strong> بما أن الجين عبارة عن لولب مزدوج، فإن البيورينات (A + G) تساوي دائماً البيريميدينات (T + C) بنسبة 50% لكل منهما. وبالتالي: (A = T) و (G = C).
                        </div>
                      </div>
                    </div>
                  )}

                  {calcSubTab === 'immunology' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                      {/* WBC calculations inputs */}
                      <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-850 space-y-4">
                        <span className="block text-sm font-bold text-white">حسابات خلايا الدم والمناعة:</span>
                        <p className="text-xs text-slate-400 font-sans">
                          أدخل عدد خلايا الدم البيضاء (WBC) الإجمالي في المليمتير المكعب من الدم، لحساب النسبة المتوسطة والدنيا والقصوى للخلايا الليمفاوية والقاتلة الطبيعية والخلايا البائية والتائية.
                        </p>

                        <div className="space-y-1">
                          <span className="block text-xs text-slate-400">إجمالي عدد خلايا الدم البيضاء (WBC):</span>
                          <input
                            type="number"
                            min="1000"
                            max="50000"
                            step="500"
                            value={wbcCount}
                            onChange={(e) => setWbcCount(Math.max(1000, Number(e.target.value)))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-base font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {[4000, 6000, 8000, 10000].map(val => (
                            <button
                              key={val}
                              onClick={() => setWbcCount(val)}
                              className="bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 font-bold py-1.5 px-3 rounded-lg border border-slate-800 cursor-pointer"
                            >
                              {val} خلية
                            </button>
                          ))}
                        </div>

                        <div className="bg-emerald-500/5 border-r-4 border-emerald-500 rounded-l-lg p-3 text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                          🩸 <strong>النسب المعتمدة وزارياً للمناعة:</strong>
                          <br />• الخلايا الليمفاوية: 20% - 30% من خلايا الدم البيضاء (المتوسط: 25%)
                          <br />• الخلايا التائية T-Cells: تشكل 80% من الخلايا الليمفاوية
                          <br />• الخلايا البائية B-Cells: تشكل 10% - 15% من الخلايا الليمفاوية (المتوسط: 12.5%)
                          <br />• الخلايا القاتلة NK: تشكل 5% - 10% من الخلايا الليمفاوية (المتوسط: 7.5%)
                        </div>
                      </div>

                      {/* WBC calculations results */}
                      <div className="space-y-3.5">
                        {(() => {
                          const lymAvg = Math.round(wbcCount * 0.25);
                          const lymMin = Math.round(wbcCount * 0.20);
                          const lymMax = Math.round(wbcCount * 0.30);

                          const tAvg = Math.round(lymAvg * 0.80);
                          const tMin = Math.round(lymMin * 0.80);
                          const tMax = Math.round(lymMax * 0.80);

                          const bAvg = Math.round(lymAvg * 0.125);
                          const bMin = Math.round(lymMin * 0.10);
                          const bMax = Math.round(lymMax * 0.15);

                          const nkAvg = Math.round(lymAvg * 0.075);
                          const nkMin = Math.round(lymMin * 0.05);
                          const nkMax = Math.round(lymMax * 0.10);

                          return (
                            <>
                              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-slate-400 font-bold">الخلايا الليمفاوية (Lymphocytes)</span>
                                  <span className="text-xs font-mono font-bold text-indigo-400">20% - 30%</span>
                                </div>
                                <div className="flex justify-between items-baseline font-mono">
                                  <span className="text-xs text-slate-500">أقل عدد: <strong className="text-slate-300">{lymMin}</strong></span>
                                  <span className="text-lg font-bold text-white font-sans">المتوسط: {lymAvg}</span>
                                  <span className="text-xs text-slate-500">أكبر عدد: <strong className="text-slate-300">{lymMax}</strong></span>
                                </div>
                              </div>

                              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-slate-400 font-bold">الخلايا التائية (T-cells)</span>
                                  <span className="text-xs font-mono font-bold text-amber-400 font-sans">80% من الليمفاوية</span>
                                </div>
                                <div className="flex justify-between items-baseline font-mono">
                                  <span className="text-xs text-slate-500">أقل عدد: <strong className="text-slate-300">{tMin}</strong></span>
                                  <span className="text-lg font-bold text-white font-sans">المتوسط: {tAvg}</span>
                                  <span className="text-xs text-slate-500">أكبر عدد: <strong className="text-slate-300">{tMax}</strong></span>
                                </div>
                              </div>

                              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-slate-400 font-bold">الخلايا البائية (B-cells)</span>
                                  <span className="text-xs font-mono font-bold text-emerald-400">10% - 15%</span>
                                </div>
                                <div className="flex justify-between items-baseline font-mono">
                                  <span className="text-xs text-slate-500">أقل عدد: <strong className="text-slate-300">{bMin}</strong></span>
                                  <span className="text-lg font-bold text-white font-sans">المتوسط: {bAvg}</span>
                                  <span className="text-xs text-slate-500">أكبر عدد: <strong className="text-slate-300">{bMax}</strong></span>
                                </div>
                              </div>

                              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-slate-400 font-bold">الخلايا القاتلة الطبيعية (NK)</span>
                                  <span className="text-xs font-mono font-bold text-rose-400">5% - 10%</span>
                                </div>
                                <div className="flex justify-between items-baseline font-mono">
                                  <span className="text-xs text-slate-500">أقل عدد: <strong className="text-slate-300">{nkMin}</strong></span>
                                  <span className="text-lg font-bold text-white font-sans">المتوسط: {nkAvg}</span>
                                  <span className="text-xs text-slate-500">أكبر عدد: <strong className="text-slate-300">{nkMax}</strong></span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB: CUMULATIVE PERFORMANCE ANALYTICS & GLOBAL BENCHMARK */}
              {activeTab === 'performance' && (
                <motion.div
                  key="performance-analytics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-6"
                  dir="rtl"
                >
                  {/* Dashboard Header */}
                  <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-400" />
                        مركز التحليل الأكاديمي الشامل والمقارنة المتقدمة
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">تتبع مؤشرات مستواك المعرفي، وقارن نتائجك مع المعدلات الوطنية والعالمية لتحديد وترميم الفجوات المعرفية لكل فصل.</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleLoadDemoPerformance}
                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold py-1.5 px-3 rounded-lg border border-emerald-500/20 flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>محاكاة بيانات الأداء</span>
                      </button>
                      <button
                        onClick={handleClearPerformance}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold py-1.5 px-3 rounded-lg border border-rose-500/20 flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>تصفير المؤشرات</span>
                      </button>
                    </div>
                  </div>

                  {/* Performance Sub-Tab Nav Switches */}
                  <div className="flex flex-wrap gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setPerformanceSubTab('benchmark_gaps')}
                      className={`flex-1 min-w-[180px] py-2.5 px-4 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        performanceSubTab === 'benchmark_gaps'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                          : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-900/60'
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      <span>🌐 التحليل المقارن والفجوات المعرفية (Global Benchmark)</span>
                    </button>

                    <button
                      onClick={() => setPerformanceSubTab('overview')}
                      className={`flex-1 min-w-[180px] py-2.5 px-4 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        performanceSubTab === 'overview'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black shadow-lg shadow-cyan-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>📊 رسم البيانات والأداء الذاتي</span>
                    </button>
                  </div>

                  {performanceSubTab === 'benchmark_gaps' ? (
                    <GlobalBenchmarkAnalyticsTool
                      studentPerformance={studentPerformance}
                      allLectures={allLectures}
                      onSelectLectureForQuiz={(lecId) => {
                        setSelectedLectureId(lecId);
                        setActiveTab('quiz');
                        setQuizSubTab('practice');
                      }}
                      onToast={setFlashcardToast}
                    />
                  ) : (
                    <div className="space-y-6">

                  {/* Top Stats Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(() => {
                      const records = Object.values(studentPerformance) as Array<{
                        lectureId: number;
                        lectureTitle: string;
                        totalAnswered: number;
                        correctAnswers: number;
                        percentage: number;
                        lastAttemptDate: string;
                      }>;
                      const overallAvg = records.length > 0
                        ? Math.round(records.reduce((acc, r) => acc + r.percentage, 0) / records.length)
                        : 0;
                      const attemptedCount = records.length;
                      const readinessScore = records.length > 0
                        ? Math.min(100, Math.round((overallAvg * attemptedCount) / 6))
                        : 0;

                      return (
                        <>
                          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                              <Award className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500 font-bold uppercase">متوسط التحصيل العام</span>
                              <span className="text-xl font-bold font-mono text-white">{overallAvg}%</span>
                              <span className="block text-[9px] text-slate-400 mt-0.5">للفصول التي تم اختبارها</span>
                            </div>
                          </div>

                          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400">
                              <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500 font-bold uppercase">الفصول المستهدفة</span>
                              <span className="text-xl font-bold font-mono text-white">{attemptedCount} <span className="text-xs text-slate-400">من 6 فصول</span></span>
                              <span className="block text-[9px] text-slate-400 mt-0.5">تم تقييمها على المنصة</span>
                            </div>
                          </div>

                          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
                              <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="block text-[10px] text-slate-500 font-bold uppercase">جاهزية الامتحان النهائي</span>
                              <span className="text-xl font-bold font-mono text-white">{readinessScore}%</span>
                              <span className="block text-[9px] text-slate-400 mt-0.5">مؤشر تراكمي قائم على الفهم والشمول</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Main Analytics: Chart & Distribution */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* SVG Bar Chart Column */}
                    <div className="lg:col-span-2 bg-slate-950/50 border border-slate-850 rounded-xl p-5 space-y-4">
                      <div className="flex justify-between items-center pb-2">
                        <span className="text-xs font-bold text-white">الرسم البياني لتوزيع درجات التحصيل المعرفي:</span>
                        <span className="text-[10px] text-slate-500">انقر على أي عمود للانتقال لبنك أسئلة هذا الفصل 🎯</span>
                      </div>

                      {/* Pure SVG Bar Chart */}
                      <div className="w-full overflow-x-auto">
                        <div className="min-w-[450px] h-64 flex items-end justify-between px-4 pb-6 pt-4 border-b border-r border-slate-800 relative">
                          {/* Y-axis helper lines */}
                          <div className="absolute left-0 right-0 border-t border-slate-850/50" style={{ bottom: '100%' }}>
                            <span className="absolute right-full mr-2 text-[9px] text-slate-600 font-mono translate-y-[-50%]">100%</span>
                          </div>
                          <div className="absolute left-0 right-0 border-t border-slate-850/50" style={{ bottom: '75%' }}>
                            <span className="absolute right-full mr-2 text-[9px] text-slate-600 font-mono translate-y-[-50%]">75%</span>
                          </div>
                          <div className="absolute left-0 right-0 border-t border-slate-850/50" style={{ bottom: '50%' }}>
                            <span className="absolute right-full mr-2 text-[9px] text-slate-600 font-mono translate-y-[-50%]">50%</span>
                          </div>
                          <div className="absolute left-0 right-0 border-t border-slate-850/50" style={{ bottom: '25%' }}>
                            <span className="absolute right-full mr-2 text-[9px] text-slate-600 font-mono translate-y-[-50%]">25%</span>
                          </div>

                          {/* Bars */}
                          {allLectures.map((lec) => {
                            const record = studentPerformance[lec.id];
                            const pct = record ? record.percentage : 0;
                            const heightPct = record ? pct : 5; // tiny dash for 0
                            
                            // Colors based on score
                            const colorClass = pct >= 80
                              ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-emerald-300'
                              : pct >= 50
                              ? 'bg-gradient-to-t from-amber-600 to-amber-400 group-hover:from-amber-500 group-hover:to-amber-300'
                              : pct > 0
                              ? 'bg-gradient-to-t from-rose-600 to-rose-400 group-hover:from-rose-500 group-hover:to-rose-300'
                              : 'bg-slate-800/40 border-2 border-dashed border-slate-700/60';

                            return (
                              <div
                                key={lec.id}
                                onClick={() => {
                                  setSelectedLectureId(lec.id);
                                  setActiveTab('quiz');
                                }}
                                className="group flex flex-col items-center flex-1 cursor-pointer"
                              >
                                {/* Percentage label */}
                                <span className="text-[10px] font-bold font-mono text-slate-400 group-hover:text-white transition-colors mb-1">
                                  {record ? `${pct}%` : '—'}
                                </span>

                                {/* The Bar */}
                                <div className="w-8 sm:w-12 relative rounded-t-md transition-all duration-300 group-hover:scale-y-[1.03]" style={{ height: `${heightPct * 1.5}px` }}>
                                  <div className={`w-full h-full rounded-t-md ${colorClass} transition-colors`} />
                                  
                                  {/* Tooltip on hover */}
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-950 text-white border border-slate-800 text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                    {record ? (
                                      <>
                                        <span>حلّ {record.correctAnswers} من {record.totalAnswered} سؤال</span>
                                        <br />
                                        <span>آخر محاولة: {record.lastAttemptDate}</span>
                                      </>
                                    ) : (
                                      <span>لم يتم الاختبار بعد، انقر لبدء التدريب!</span>
                                    )}
                                  </div>
                                </div>

                                {/* Label below the bar */}
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-400 transition-colors mt-2 text-center max-w-[75px] truncate">
                                  ف{lec.id}: {lec.arabicTitle.split(' ')[0]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex gap-4 justify-center text-[10px] text-slate-500">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> {"ممتاز (>= 80%)"}</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> {"مقبول/متوسط (50-79%)"}</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500"></span> {"يحتاج تركيز (< 50%)"}</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border border-dashed border-slate-700"></span> {"غير مختبر بعد"}</span>
                      </div>
                    </div>

                    {/* Progress to 100 Questions per Chapter Widget */}
                    <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>بنوك الفصول (مستهدف 100+ سؤال)</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1">تطور نمو بنوك الفصول للوصول للمستهدف الفني لكل فصل.</p>
                      </div>

                      <div className="space-y-3 my-auto">
                        {allLectures.map(lec => {
                          const builtIn = lec.questionBank || [];
                          const fallbacks = fallbackQuestions[lec.id] || [];
                          const custom = customQuestions[lec.id] || [];
                          const seenIds = new Set<string>();
                          const all = [...builtIn, ...fallbacks, ...custom];
                          const count = all.filter(q => {
                            if (seenIds.has(q.id)) return false;
                            seenIds.add(q.id);
                            return true;
                          }).length;
                          const pct = Math.min(100, Math.round((count / 100) * 100));
                          
                          return (
                            <div key={lec.id} className="space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-semibold text-slate-300">المحاضرة {lec.id}: {lec.arabicTitle}</span>
                                <span className="font-mono text-slate-400">{count} / 100 سؤال ({pct}%)</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full animate-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-emerald-500/5 border-r-2 border-emerald-500 rounded p-2 text-[9px] text-slate-400 leading-relaxed">
                        📌 <strong>توجيه المذاكرة الذكي:</strong> يمكنك الضغط على أيقونة التوليد في بنك الأسئلة لتلقيم المساعد وزيادة عدد الأسئلة التدريبية تلقائياً لكل فصل حتى تتجاوز 100 سؤال!
                      </div>
                    </div>
                  </div>

                  {/* Detailed SWOT (Strengths and Focus Areas) Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths card */}
                    <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-xl p-5 space-y-3">
                      <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>نقاط التمكن التام والسيادة المعرفية:</span>
                      </span>

                      {(() => {
                        const mastered = allLectures.filter(l => studentPerformance[l.id]?.percentage >= 80);
                        if (mastered.length === 0) {
                          return (
                            <p className="text-xs text-slate-500 leading-relaxed">لم تسجل بعد أي نسبة تمكن تامة (أعلى من 80%). قم بحل اختبارات الفصول وثبّت فهمك لتظهر هنا!</p>
                          );
                        }
                        return (
                          <div className="space-y-2 pt-2">
                            {mastered.map(lec => {
                              const record = studentPerformance[lec.id];
                              return (
                                <div key={lec.id} className="bg-slate-950/60 rounded-lg p-3 border border-emerald-500/10 flex justify-between items-center">
                                  <div>
                                    <span className="block text-xs font-bold text-white">الفصل {lec.id}: {lec.arabicTitle}</span>
                                    <span className="text-[10px] text-slate-500">تم تسجيله في: {record.lastAttemptDate}</span>
                                  </div>
                                  <div className="text-left">
                                    <span className="text-sm font-mono font-bold text-emerald-400 block">{record.percentage}%</span>
                                    <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">متقن متمكن</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Improvement needed card */}
                    <div className="bg-rose-950/10 border border-rose-900/30 rounded-xl p-5 space-y-3">
                      <span className="text-sm font-bold text-rose-400 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-500" />
                        <span>فصول تحتاج لمراجعة ودعم فوري:</span>
                      </span>

                      {(() => {
                        const needsImprovement = allLectures.filter(l => !studentPerformance[l.id] || studentPerformance[l.id]?.percentage < 80);
                        if (needsImprovement.length === 0) {
                          return (
                            <p className="text-xs text-slate-500 leading-relaxed">تهانينا! لقد أتقنت جميع الفصول السبعة بنسبة تفوق 80%. أنت جاهز تماماً للامتحان النهائي!</p>
                          );
                        }
                        return (
                          <div className="space-y-2 pt-2">
                            {needsImprovement.map(lec => {
                              const record = studentPerformance[lec.id];
                              return (
                                <div key={lec.id} className="bg-slate-950/60 rounded-lg p-3 border border-rose-500/10 flex justify-between items-center">
                                  <div>
                                    <span className="block text-xs font-bold text-white">الفصل {lec.id}: {lec.arabicTitle}</span>
                                    <span className="text-[10px] text-slate-500">
                                      {record ? `آخر نسبة: ${record.percentage}% في ${record.lastAttemptDate}` : 'لم يختبر بعد'}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedLectureId(lec.id);
                                      setActiveTab('quiz');
                                    }}
                                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] px-2.5 py-1 rounded font-bold border border-rose-500/20 flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <span>ابدأ الاختبار 📝</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  </div>
                  )}
                </motion.div>
              )}

              {/* TAB: INTERACTIVE FORMULA SHEET */}
              {activeTab === 'formulas' && (
                <motion.div
                  key="interactive-formulas"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <FormulasSheetTool onOpenQuickModal={() => setIsFormulaModalOpen(true)} />
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>

      </main>

      {/* Footer copyright */}
      <footer className="bg-slate-950/85 text-slate-400 border-t border-slate-900 text-center py-8 mt-16 text-xs backdrop-blur-md">
        <p>© 2026 بوابة المراجعة النهائية المكثفة للأحياء - الثانوية العامة. جميع الحقوق محفوظة.</p>
        <p className="mt-1 text-slate-500">مصمم بدقة هندسية ومفهومية لضمان التفوق الأكاديمي والتمكين المعرفي لطلاب القسم العلمي علوم.</p>
      </footer>

      {/* Floating Interactive AI Chatbot Button */}
      <div className="fixed bottom-6 left-6 z-40 dir-rtl">
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="group relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-3.5 sm:px-4 sm:py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-emerald-400/30 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          title="افتح الشات بوت التفاعلي للأحياء"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
          </div>

          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold leading-tight flex items-center gap-1">
              مستشار الأحياء
              <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">AI</span>
            </span>
            <span className="text-[10px] text-emerald-100/80 font-sans">اسأل وتدرب على التريكات</span>
          </div>
        </button>
      </div>

      {/* Study Reminders Modal */}
      <StudyRemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        allLectures={allLectures}
        reminders={studyReminders}
        onSaveReminders={handleSaveReminders}
        onStartReviewLecture={(lectureId, tab) => {
          handleLectureChange(lectureId);
          if (tab) setActiveTab(tab);
        }}
      />

      {/* Biology Interactive AI Chatbot Modal */}
      <BiologyChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        currentLecture={allLectures.find(l => l.id === selectedLectureId)}
        allLectures={allLectures}
        onNavigateToLecture={(lectureId, tab) => {
          handleLectureChange(lectureId);
          if (tab) setActiveTab(tab);
        }}
      />

      {/* Floating Formula Quick Reference Popup Modal */}
      <FloatingFormulaModal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
      />
    </div>
  );
}
