import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { pastExamsEgyptList, PastExamPaper } from '../data/pastExamsEgypt';
import { MCQQuestion } from '../types';
import {
  GraduationCap,
  Award,
  CheckCircle2,
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
  Zap,
  ShieldCheck,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Bookmark,
  Share2,
  Download,
  Printer,
  Search
} from 'lucide-react';

interface PastExamsEgyptToolProps {
  onToast?: (message: string) => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export function PastExamsEgyptTool({ onToast, isFocusMode, onToggleFocusMode }: PastExamsEgyptToolProps) {
  // Active Exam Paper State
  const [selectedExamId, setSelectedExamId] = useState<string>(pastExamsEgyptList[0].id);
  
  // View Mode: 'model_answers' (study mode with official explanations) | 'test' (interactive exam with timer) | 'result'
  const [viewMode, setViewMode] = useState<'model_answers' | 'test' | 'result'>('model_answers');

  // Interactive Test States
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  
  // Timer State (3 hours = 180 mins = 10800 secs)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(180 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isTimerHidden, setIsTimerHidden] = useState<boolean>(false);

  // Search/Filter inside exam
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<'all' | 2024 | 2023 | 2022 | 'guidance'>('all');

  const selectedExam = useMemo(() => {
    return pastExamsEgyptList.find(e => e.id === selectedExamId) || pastExamsEgyptList[0];
  }, [selectedExamId]);

  // Filtered Exam List by Year
  const filteredExamPapers = useMemo(() => {
    if (yearFilter === 'all') return pastExamsEgyptList;
    if (yearFilter === 'guidance') return pastExamsEgyptList.filter(e => e.session === 'guidance');
    return pastExamsEgyptList.filter(e => e.year === yearFilter);
  }, [yearFilter]);

  // Questions inside selected exam filtered by search
  const displayedQuestions = useMemo(() => {
    if (!searchQuery.trim()) return selectedExam.questions;
    return selectedExam.questions.filter(q =>
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.sourceYear?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedExam, searchQuery]);

  const activeQuestion = displayedQuestions[currentQIndex] || displayedQuestions[0];

  // Timer Countdown Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeftSeconds > 0 && viewMode === 'test') {
      interval = setInterval(() => {
        setTimeLeftSeconds(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setViewMode('result');
            onToast?.('⏰ انتهى وقت الامتحان التجريبي الرسمي! جاري إعداد تقرير الدرجات.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeftSeconds, viewMode, onToast]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartExamTest = () => {
    setUserAnswers({});
    setFlaggedQuestions({});
    setCurrentQIndex(0);
    setTimeLeftSeconds(selectedExam.timeAllowedMinutes * 60);
    setIsTimerRunning(true);
    setViewMode('test');
    onToast?.(`🚀 بدأ امتحان: ${selectedExam.arabicTitle}. الوقت المتاح 3 ساعات.`);
  };

  const handleSelectAnswer = (optionKey: 'A' | 'B' | 'C' | 'D') => {
    if (!activeQuestion) return;
    setUserAnswers(prev => ({
      ...prev,
      [activeQuestion.id]: optionKey
    }));
  };

  const handleToggleFlag = (qId: string) => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  // Score Calculation
  const scoreReport = useMemo(() => {
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    selectedExam.questions.forEach(q => {
      const ans = userAnswers[q.id];
      if (!ans) {
        unansweredCount++;
      } else if (ans === q.correctAnswer) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    const total = selectedExam.questions.length;
    const percentage = Math.round((correctCount / total) * 100);

    return {
      correctCount,
      wrongCount,
      unansweredCount,
      total,
      percentage
    };
  }, [selectedExam, userAnswers]);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-sm space-y-6 text-right font-sans" dir="rtl">
      
      {/* Top Banner Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full font-black">
              جمهورية مصر العربية 🇪🇬 - الثانوية العامة
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
              مفاتيح التصحيح المعتمدة 🏛️
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-amber-400" />
            <span>امتحانات السنوات السابقة والنماذج الرسمية للوزارة</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            استعرض امتحانات دور أول ودور ثاني والأعوام السابقة المعتمدة لوزارة التربية والتعليم، مع الإجابات النموذجية، نموذج الشرح الفني، والتفنيذ الكامل لكل اختيار.
          </p>
        </div>

        {/* Primary View Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setViewMode('model_answers');
              setIsTimerRunning(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black border flex items-center gap-2 cursor-pointer transition-all ${
              viewMode === 'model_answers'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>عرض الإجابات النموذجية والشرح</span>
          </button>

          <button
            onClick={handleStartExamTest}
            className={`px-4 py-2 rounded-xl text-xs font-black border flex items-center gap-2 cursor-pointer transition-all ${
              viewMode === 'test'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950/80 border-slate-800 text-amber-400 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>بدء المحاكاة التفاعلية (مؤقت 3س)</span>
          </button>
        </div>
      </div>

      {/* Filter Papers Selector Ribbon */}
      <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5 text-amber-400">
            <Filter className="w-4 h-4" />
            <span>اختر النسخة الامتحانية المعتمدة:</span>
          </span>

          {/* Year filter buttons */}
          <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-thin">
            <button
              onClick={() => setYearFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                yearFilter === 'all' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setYearFilter(2024)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                yearFilter === 2024 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              امتحانات 2024
            </button>
            <button
              onClick={() => setYearFilter(2023)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                yearFilter === 2023 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              امتحانات 2023
            </button>
            <button
              onClick={() => setYearFilter('guidance')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                yearFilter === 'guidance' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              النماذج الاسترشادية
            </button>
          </div>
        </div>

        {/* Paper Cards Selector Horizontal Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {filteredExamPapers.map(exam => {
            const isSelected = exam.id === selectedExamId;
            return (
              <button
                key={exam.id}
                onClick={() => {
                  setSelectedExamId(exam.id);
                  setCurrentQIndex(0);
                  if (viewMode === 'test') {
                    handleStartExamTest();
                  }
                }}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border-amber-500/60 shadow-md shadow-amber-500/5'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {exam.year}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {exam.totalQuestions} سؤالاً
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                    {exam.arabicTitle}
                  </h4>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>⏱️ 3 ساعات</span>
                  <span className={isSelected ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                    {isSelected ? 'المحدد حالياً ✓' : 'اختر الاختيار'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Mode View Container */}
      {viewMode === 'model_answers' && (
        <div className="space-y-6">
          
          {/* Header Info Banner for current selected exam */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block">
                وضع المراجعة المستمرة والإجابات النموذجية
              </span>
              <h4 className="text-lg font-black text-white">{selectedExam.arabicTitle}</h4>
              <p className="text-xs text-slate-400">{selectedExam.description}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs space-y-1 shrink-0">
              <div className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ملاحظة الكنترول: {selectedExam.ministerialNotes}</span>
              </div>
            </div>
          </div>

          {/* Search bar inside questions */}
          <div className="relative">
            <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="ابحث في أسئلة هذا الامتحان أو نصوص الإجابات الشارحة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Questions List with Model Answers */}
          <div className="space-y-5">
            {displayedQuestions.map((question, idx) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-right relative overflow-hidden"
              >
                {/* Question Header */}
                <div className="flex justify-between items-start gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-400">سؤال امتحاني معتمد</span>
                  </div>

                  <span className="text-[10px] bg-slate-900 text-amber-300 border border-slate-800 px-2.5 py-1 rounded-lg font-mono">
                    المصدر: {question.sourceYear || selectedExam.arabicTitle}
                  </span>
                </div>

                {/* Question Body Text */}
                <h4 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                  {question.questionText}
                </h4>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(['A', 'B', 'C', 'D'] as const).map(optionKey => {
                    const isCorrect = optionKey === question.correctAnswer;
                    return (
                      <div
                        key={optionKey}
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                          isCorrect
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-500/5'
                            : 'bg-slate-900/60 border-slate-850 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                            isCorrect
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {optionKey}
                          </span>
                          <span>{question.options[optionKey]}</span>
                        </div>

                        {isCorrect && (
                          <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded">
                            الإجابة النموذجية ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Model Explanation Box */}
                <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border-r-4 border-emerald-500 rounded-xl p-4 space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>التعليل العلمي والتفنيد المعتمد من الوزارة:</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      الرمز الصحيح: ({question.correctAnswer})
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
                    {question.explanation.correct}
                  </p>
                </div>

              </motion.div>
            ))}
          </div>

        </div>
      )}

      {/* Interactive Exam Simulation Mode */}
      {viewMode === 'test' && (
        <div className="space-y-5">
          {/* Active Exam Bar */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-black">
                {currentQIndex + 1}/{displayedQuestions.length}
              </span>
              <div>
                <h4 className="text-sm font-bold text-white">{selectedExam.arabicTitle}</h4>
                <p className="text-[10px] text-slate-400">بيئة اختبار حقيقية تحاكي امتحانات الثانوية العامة</p>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 font-mono shadow-inner">
              <Clock className={`w-4 h-4 text-amber-400 ${isTimerRunning && !isTimerHidden ? 'animate-pulse' : ''}`} />
              
              {isTimerHidden ? (
                <span className="text-xs font-sans text-slate-400 font-bold px-1">
                  •• : •• : •• (مُخفى)
                </span>
              ) : (
                <span className="text-sm font-bold text-amber-300 dir-ltr">
                  {formatTime(timeLeftSeconds)}
                </span>
              )}

              <button
                onClick={() => {
                  setIsTimerHidden(!isTimerHidden);
                  onToast?.(isTimerHidden ? '👁️ تم إظهار مؤقت الامتحان التنازلي.' : '🙈 تم إخفاء المؤقت لتعزيز التركيز.');
                }}
                className={`p-1 rounded-lg transition-all cursor-pointer border ${
                  isTimerHidden
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'text-slate-400 hover:text-white border-transparent hover:bg-slate-800'
                }`}
                title={isTimerHidden ? 'إظهار الوقت' : 'إخفاء الوقت للتركيز'}
              >
                {isTimerHidden ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
              </button>

              {onToggleFocusMode && (
                <button
                  onClick={() => {
                    onToggleFocusMode();
                    onToast?.(!isFocusMode ? '🎯 تم تفعيل وضع التركيز! تم إخفاء الترويسة لزيادة مساحة العرض.' : '🔓 تم إيقاف وضع التركيز وإظهار الترويسة.');
                  }}
                  className={`p-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                    isFocusMode
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800'
                  }`}
                  title={isFocusMode ? 'إنهاء وضع التركيز' : 'تفعيل وضع التركيز (إخفاء الترويسة الرئيسية)'}
                >
                  {isFocusMode ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden sm:inline">تركيز</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">وضع التركيز</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => setViewMode('result')}
                className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1 rounded-lg cursor-pointer transition-all mr-1"
              >
                إنهاء الامتحان 🏁
              </button>
            </div>
          </div>

          {/* Active Question Box */}
          {activeQuestion && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6 text-right">
              <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-3">
                <span className="font-bold text-amber-400">السؤال رقم {currentQIndex + 1}</span>
                <button
                  onClick={() => handleToggleFlag(activeQuestion.id)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    flaggedQuestions[activeQuestion.id]
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{flaggedQuestions[activeQuestion.id] ? 'تم التمييز للمراجعة' : 'ميّز للمراجعة'}</span>
                </button>
              </div>

              <h3 className="text-base sm:text-lg font-black text-white leading-relaxed">
                {activeQuestion.questionText}
              </h3>

              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as const).map(optionKey => {
                  const isChosen = userAnswers[activeQuestion.id] === optionKey;
                  return (
                    <button
                      key={optionKey}
                      onClick={() => handleSelectAnswer(optionKey)}
                      className={`w-full p-4 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-3 ${
                        isChosen
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-lg shadow-amber-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-200 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                        isChosen ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {optionKey}
                      </span>
                      <span className="text-xs sm:text-sm">{activeQuestion.options[optionKey]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-between items-center border-t border-slate-800 pt-4">
                <button
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السؤال السابق</span>
                </button>

                <button
                  disabled={currentQIndex === displayedQuestions.length - 1}
                  onClick={() => setCurrentQIndex(prev => Math.min(displayedQuestions.length - 1, prev + 1))}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  <span>السؤال التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result Report Mode */}
      {viewMode === 'result' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-white">تقرير نتيجة الامتحان التجريبي الرسمي</h3>
            <p className="text-xs text-slate-400">{selectedExam.arabicTitle}</p>
          </div>

          <div className="text-4xl font-black text-amber-400 font-mono">
            {scoreReport.percentage}%
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-xs font-bold">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-emerald-300">
              <span className="block text-lg font-black">{scoreReport.correctCount}</span>
              <span>إجابات صحيحة</span>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-300">
              <span className="block text-lg font-black">{scoreReport.wrongCount}</span>
              <span>إجابات خاطئة</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-slate-400">
              <span className="block text-lg font-black">{scoreReport.unansweredCount}</span>
              <span>لم تُجب</span>
            </div>
          </div>

          <button
            onClick={() => setViewMode('model_answers')}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all inline-flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>عرض الإجابات النموذجية كاملة مع التوضيح الشامل</span>
          </button>
        </div>
      )}

    </div>
  );
}
