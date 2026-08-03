import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BookOpen, 
  HelpCircle, 
  FileText, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  BarChart2, 
  Filter, 
  Check, 
  AlertTriangle,
  Flame,
  Zap,
  GraduationCap,
  ShieldCheck,
  Send,
  Eye,
  Bookmark
} from 'lucide-react';
import { guidanceQuestions2026, guidanceModelMetaData, GuidanceQuestion } from '../data/guidanceModel2026';
import { useLanguage } from '../context/LanguageContext';
import { autoTranslateText } from '../utils/autoTranslator';
import { AnimatedScoreCounter } from './AnimatedScoreCounter';

interface GuidanceModel2026ToolProps {
  onNavigateToTab?: (tab: string) => void;
  onSelectLecture?: (lectureId: number) => void;
}

export const GuidanceModel2026Tool: React.FC<GuidanceModel2026ToolProps> = ({
  onNavigateToTab,
  onSelectLecture
}) => {
  const { isAr, language } = useLanguage();

  // Mode: 'overview' | 'exam' | 'result'
  const [examMode, setExamMode] = useState<'overview' | 'exam' | 'result'>('overview');
  
  // Timer option: 180 minutes (3 hours)
  const [timeLeft, setTimeLeft] = useState<number>(180 * 60);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [showTimer, setShowTimer] = useState<boolean>(true);

  // Filters
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  
  // Quiz states
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(true); // Study mode default
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Filtered Questions
  const filteredQuestions = React.useMemo(() => {
    if (selectedChapter === 'all') return guidanceQuestions2026;
    return guidanceQuestions2026.filter(q => q.chapter === selectedChapter);
  }, [selectedChapter]);

  const currentQuestion = filteredQuestions[currentIndex] || guidanceQuestions2026[0];

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timeLeft > 0 && !isSubmitted) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerActive(false);
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, isSubmitted]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartExam = (timed: boolean = true) => {
    setUserAnswers({});
    setFlaggedQuestions({});
    setCurrentIndex(0);
    setTimeLeft(180 * 60);
    setIsTimerActive(timed);
    setShowTimer(timed);
    setIsSubmitted(false);
    setExamMode('exam');
  };

  const handleAnswerSelect = (optionKey: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionKey
    }));
  };

  const handleToggleFlag = (qId: string) => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleFinishExam = () => {
    setIsTimerActive(false);
    setIsSubmitted(true);
    setExamMode('result');
  };

  // Score Calculations
  const resultsSummary = React.useMemo(() => {
    let earnedMarks = 0;
    let totalPossibleMarks = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const chapterStats: Record<string, { total: number; correct: number; totalMarks: number; earnedMarks: number }> = {};

    guidanceQuestions2026.forEach(q => {
      totalPossibleMarks += q.marks;
      if (!chapterStats[q.chapter]) {
        chapterStats[q.chapter] = { total: 0, correct: 0, totalMarks: 0, earnedMarks: 0 };
      }
      chapterStats[q.chapter].total += 1;
      chapterStats[q.chapter].totalMarks += q.marks;

      const ans = userAnswers[q.id];
      if (!ans) {
        unansweredCount++;
      } else if (ans === q.correctAnswer) {
        earnedMarks += q.marks;
        correctCount++;
        chapterStats[q.chapter].correct += 1;
        chapterStats[q.chapter].earnedMarks += q.marks;
      } else {
        incorrectCount++;
      }
    });

    const percentage = Math.round((earnedMarks / totalPossibleMarks) * 100);

    let gradeTitle = 'ممتاز (مستوى متقدم)';
    let gradeBadgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (percentage < 50) {
      gradeTitle = 'يحتاج إلى مراجعة مكثفة';
      gradeBadgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    } else if (percentage < 75) {
      gradeTitle = 'جيد جداً (مستوى متوسط)';
      gradeBadgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    } else if (percentage < 90) {
      gradeTitle = 'متفوق (مستوى عالي)';
      gradeBadgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }

    return {
      earnedMarks,
      totalPossibleMarks,
      correctCount,
      incorrectCount,
      unansweredCount,
      percentage,
      gradeTitle,
      gradeBadgeColor,
      chapterStats
    };
  }, [userAnswers]);

  const chaptersList = [
    { id: 'all', label: 'جميع الفصول (الامتحان الشامل)' },
    { id: 'الدعامة والحركة', label: 'الدعامة والحركة' },
    { id: 'التنسيق الهرموني', label: 'التنسيق الهرموني' },
    { id: 'التكاثر', label: 'التكاثر في الكائنات الحية' },
    { id: 'المناعة', label: 'المناعة في الكائنات الحية' },
    { id: 'DNA والبيولوجيا الجزيئية', label: 'DNA والبيولوجيا الجزيئية' },
    { id: 'RNA وتخليق البروتين', label: 'RNA وتخليق البروتين' }
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500" />
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>وزارة التربية والتعليم والتعليم الفني - مصر</span>
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-1 rounded-full text-xs font-bold">
                إصدار 2026 المعتمد
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-emerald-400 shrink-0" />
              <span>النموذج الاسترشادي الرسمي أحياء 2026</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              المحاكاة الرسمية التامة لورقة امتحان شهادة الإتمام الثانوية العامة (علمي علوم)، مصممة وفقاً للمواصفات الامتحانية وتوزيع الدرجات ونماذج الإجابة المعتمدة للوزارة.
            </p>
          </div>

          {/* Stat Badges */}
          <div className="flex items-center gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800 shrink-0">
            <div className="text-center px-2">
              <span className="text-xs text-slate-400 block font-bold">عدد الأسئلة</span>
              <span className="text-lg font-mono font-extrabold text-emerald-400">{guidanceModelMetaData.totalQuestions} سؤالاً</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center px-2">
              <span className="text-xs text-slate-400 block font-bold">الدرجة الكلية</span>
              <span className="text-lg font-mono font-extrabold text-amber-400">{guidanceModelMetaData.totalMarks} درجة</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center px-2">
              <span className="text-xs text-slate-400 block font-bold">الزمن المحدد</span>
              <span className="text-lg font-mono font-extrabold text-indigo-400">3 ساعات</span>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW: OVERVIEW MODE */}
      {examMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Controls Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 backdrop-blur-sm">
              
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">اختر نظام المذاكرة أو الامتحان</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Timed Real Exam Mode */}
                <div className="bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 p-5 rounded-xl space-y-3 transition-all flex flex-col justify-between group">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white text-base">نمط المحاكاة الزمنية الرسمية</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      امتحان مؤقت بـ 3 ساعات كاملة مع عداد تنازلي حقيقي لتدريبك على إدارة وقت الامتحان، وتقييم شامل بعد التسليم.
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartExam(true)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs py-2.5 rounded-lg border border-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md group-hover:shadow-indigo-500/20"
                  >
                    <Send className="w-4 h-4" />
                    <span>ابدأ الامتحان الرسمي (مؤقت 3 ساعات)</span>
                  </button>
                </div>

                {/* Free Practice & Study Mode */}
                <div className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/60 p-5 rounded-xl space-y-3 transition-all flex flex-col justify-between group">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white text-base">نمط المذاكرة والشرح الفوري</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      تصفح وتدرب على أسئلة النموذج بحرية، مع عرض التفسير العلمي الدقيق لكل تشتيت ومفتاح الوزارة فور اختيار الإجابة.
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartExam(false)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs py-2.5 rounded-lg border border-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md group-hover:shadow-emerald-500/20"
                  >
                    <Eye className="w-4 h-4" />
                    <span>تصفح الأسئلة مع الشرح الفوري</span>
                  </button>
                </div>

              </div>

              {/* Filter by Chapter Selector */}
              <div className="bg-slate-950/50 border border-slate-800/80 p-4 rounded-xl space-y-3">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-400" />
                  <span>تصفية الأسئلة حسب الفصل الدراسي:</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {chaptersList.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChapter(ch.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedChapter === ch.id
                          ? 'bg-indigo-600 text-white border border-indigo-400 shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Exam Specifications & Ministry Guidelines Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>مواصفات الورقة الامتحانية أحياء 2026</span>
              </h3>
              
              <ul className="text-xs text-slate-300 space-y-3 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span><strong>عدد الأسئلة:</strong> 46 سؤالاً تغطي كافة فصول المنهج (الدعامة، الهرمونات، التكاثر، المناعة، DNA، RNA).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span><strong>توزيع الدرجات:</strong> أسئلة درجة واحدة وأسئلة درجتين للمستويات العليا للتفكير.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  <span><strong>المقاييس الفسيولوجية:</strong> تركز الأسئلة على نواتج التعلم، والربط الفسيولوجي، والجداول البيانية.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span><strong>التفسير المعتمد:</strong> يتوفر نموذج إجابة تفصيلي يعلل سبب خطأ البدائل المشتتة وتأكيد اختيار الفكرة.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* VIEW: EXAM / QUESTION RUNNER MODE */}
      {examMode === 'exam' && currentQuestion && (
        <div className="space-y-6">
          
          {/* Top Sticky Progress & Navigation Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md sticky top-4 z-20 flex flex-col md:flex-row justify-between items-center gap-4">
            
            <div className="flex items-center gap-3">
              <span className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 px-3 py-1 rounded-full text-xs font-bold font-mono">
                سؤال {currentIndex + 1} من {filteredQuestions.length}
              </span>
              <span className="text-xs text-slate-400 font-bold hidden sm:inline">
                الفصل: <span className="text-slate-200">{currentQuestion.chapter}</span>
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded font-bold border ${
                currentQuestion.marks === 2 
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {currentQuestion.marks === 2 ? '⭐ سؤال من درجتين' : 'درجة واحدة'}
              </span>
            </div>

            {/* Timer and Action Controls */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              {showTimer && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold ${
                  timeLeft < 600 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
                    : 'bg-slate-950 text-amber-400 border-slate-800'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              )}

              <button
                onClick={() => handleToggleFlag(currentQuestion.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  flaggedQuestions[currentQuestion.id]
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{flaggedQuestions[currentQuestion.id] ? 'علمت للمراجعة' : 'تعليم السؤال'}</span>
              </button>

              <button
                onClick={handleFinishExam}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg border border-emerald-400/30 shadow-md cursor-pointer"
              >
                إنهاء وتسليم الامتحان
              </button>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            
            {/* Question Text */}
            <div className="space-y-3">
              <h3 className="text-base md:text-lg font-bold text-white leading-relaxed">
                {currentQuestion.number}. {currentQuestion.questionText}
              </h3>

              {/* Diagram description if present */}
              {currentQuestion.diagramInfo && (
                <div className="bg-slate-950/80 border border-indigo-500/30 p-3.5 rounded-xl text-xs text-indigo-300 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-indigo-400">
                    <FileText className="w-4 h-4" />
                    <span>وصف رسم وتخطيط السؤال الوزاري المصاحب:</span>
                  </span>
                  <p className="leading-relaxed">{currentQuestion.diagramInfo}</p>
                </div>
              )}
            </div>

            {/* Options List */}
            <div className="grid grid-cols-1 gap-3">
              {(['A', 'B', 'C', 'D'] as const).map(optionKey => {
                const isSelected = userAnswers[currentQuestion.id] === optionKey;
                const isCorrect = currentQuestion.correctAnswer === optionKey;
                
                let optionClasses = 'bg-slate-950/80 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700';

                if (isSubmitted || !showTimer) {
                  // In review or practice mode
                  if (isSelected && isCorrect) {
                    optionClasses = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                  } else if (isSelected && !isCorrect) {
                    optionClasses = 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold';
                  } else if (isCorrect && (isSubmitted || userAnswers[currentQuestion.id])) {
                    optionClasses = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 font-bold';
                  }
                } else if (isSelected) {
                  optionClasses = 'bg-indigo-950/80 border-indigo-500 text-indigo-200 font-bold';
                }

                return (
                  <button
                    key={optionKey}
                    onClick={() => handleAnswerSelect(optionKey)}
                    className={`p-4 rounded-xl border text-right transition-all cursor-pointer flex items-start gap-3 relative ${optionClasses}`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold font-mono shrink-0 mt-0.5 ${
                      isSelected 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-900 border border-slate-700 text-slate-300'
                    }`}>
                      {optionKey === 'A' ? 'أ' : optionKey === 'B' ? 'ب' : optionKey === 'C' ? 'ج' : 'د'}
                    </span>
                    <span className="text-sm font-semibold leading-relaxed pt-0.5">
                      {currentQuestion.options[optionKey]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Instant Answer Explanation (In Practice Mode or after answer choice) */}
            {(userAnswers[currentQuestion.id] || isSubmitted) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-3"
              >
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>تفسير نموذج الإجابة الوزاري المعتمد 2026:</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    فكرة الوزارة: {currentQuestion.ministryFocusKey}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-emerald-400">التعليل العلمي الصحيح: </strong>
                  {currentQuestion.explanation.correctReason}
                </p>
              </motion.div>
            )}

            {/* Navigation Bottom Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className={`px-4 py-2 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
                  currentIndex === 0
                    ? 'bg-slate-950 text-slate-700 border-slate-900 cursor-not-allowed'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800 cursor-pointer'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
                <span>السؤال السابق</span>
              </button>

              {/* Question Quick Picker Dots */}
              <div className="hidden md:flex flex-wrap gap-1 max-w-md justify-center">
                {filteredQuestions.map((q, idx) => {
                  const answered = !!userAnswers[q.id];
                  const isCurrent = idx === currentIndex;
                  const flagged = flaggedQuestions[q.id];
                  
                  let dotColor = 'bg-slate-800 text-slate-400 border-slate-700';
                  if (isCurrent) dotColor = 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/50';
                  else if (flagged) dotColor = 'bg-amber-500/30 text-amber-300 border-amber-500/50';
                  else if (answered) dotColor = 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50';

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-6 h-6 rounded text-[10px] font-mono font-bold border flex items-center justify-center transition-all cursor-pointer ${dotColor}`}
                      title={`سؤال ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentIndex(prev => Math.min(filteredQuestions.length - 1, prev + 1))}
                disabled={currentIndex === filteredQuestions.length - 1}
                className={`px-4 py-2 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
                  currentIndex === filteredQuestions.length - 1
                    ? 'bg-slate-950 text-slate-700 border-slate-900 cursor-not-allowed'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800 cursor-pointer'
                }`}
              >
                <span>السؤال التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* VIEW: RESULT SCORE & REVIEW MODE */}
      {examMode === 'result' && (
        <div className="space-y-6">
          
          {/* Main Score Overview Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-6 text-center">
            
            <div className="flex flex-col items-center justify-center space-y-2">
              <AnimatedScoreCounter
                value={resultsSummary.percentage}
                size="lg"
                label={isAr ? `الدرجة النهائي (${resultsSummary.earnedMarks}/${resultsSummary.totalPossibleMarks})` : `Final Score (${resultsSummary.earnedMarks}/${resultsSummary.totalPossibleMarks})`}
                showRing={true}
                showSparkles={true}
                gradeTitle={resultsSummary.gradeTitle}
              />
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block font-bold">إجابات صحيحة</span>
                <span className="text-emerald-400 font-bold font-mono text-base">{resultsSummary.correctCount}</span>
              </div>
              <div className="border-r border-l border-slate-800">
                <span className="text-slate-400 block font-bold">إجابات خاطئة</span>
                <span className="text-rose-400 font-bold font-mono text-base">{resultsSummary.incorrectCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">لم تجب عنها</span>
                <span className="text-amber-400 font-bold font-mono text-base">{resultsSummary.unansweredCount}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  setExamMode('exam');
                  setCurrentIndex(0);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl border border-indigo-400/30 cursor-pointer shadow-lg"
              >
                مراجعة إجاباتك مع النموذج الوزاري
              </button>
              
              <button
                onClick={() => handleStartExam(true)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-5 py-2.5 rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة خوض الامتحان</span>
              </button>
            </div>

          </div>

          {/* Chapter Wise Performance Breakdown */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <BarChart2 className="w-5 h-5 text-indigo-400" />
              <span>تحليل المستوى الفسيولوجي وفق الفصول الدراسية:</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.entries(resultsSummary.chapterStats) as [string, { total: number; correct: number; totalMarks: number; earnedMarks: number }][]).map(([chName, stat]) => {
                const percent = stat.totalMarks > 0 ? Math.round((stat.earnedMarks / stat.totalMarks) * 100) : 0;
                return (
                  <div key={chName} className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-200">{chName}</span>
                      <span className="text-emerald-400 font-mono">{stat.earnedMarks} / {stat.totalMarks} درجة ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full transition-all duration-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
