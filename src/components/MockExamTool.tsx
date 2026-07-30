import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Flag, 
  Award, 
  RotateCcw, 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  Brain, 
  BarChart3, 
  Sparkles, 
  Timer, 
  Pause, 
  TrendingUp, 
  Target,
  FileCheck2,
  ListFilter,
  Check,
  RefreshCw,
  Lightbulb,
  ShieldCheck,
  Zap,
  BookOpen
} from 'lucide-react';
import { MCQQuestion, LectureData } from '../types';
import { fallbackQuestions } from '../data/fallbackQuestions';
import { recordMistake } from '../utils/mistakeBankUtils';

interface MockExamToolProps {
  allLectures: LectureData[];
  onToast?: (msg: string) => void;
}

interface MockExamQuestionItem {
  index: number; // 1 to 50
  question: MCQQuestion;
  lectureId: number;
  lectureTitle: string;
}

export function MockExamTool({ allLectures, onToast }: MockExamToolProps) {
  // Exam Lifecycle State: 'intro' | 'active' | 'review_summary'
  const [examState, setExamState] = useState<'intro' | 'active' | 'review_summary'>('intro');

  // Exam Questions (Exactly 50 questions)
  const [examQuestions, setExamQuestions] = useState<MockExamQuestionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // User Answers state: { [qIndex]: 'A' | 'B' | 'C' | 'D' }
  const [userAnswers, setUserAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});

  // Bookmarked / Flagged questions for review: Set of qIndex
  const [flaggedIndices, setFlaggedIndices] = useState<Set<number>>(new Set());

  // Timer State (3 Hours = 180 minutes = 10,800 seconds)
  const TOTAL_EXAM_TIME_SECONDS = 3 * 60 * 60; // 10800 s
  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_EXAM_TIME_SECONDS);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [timeSpent, setTimeSpent] = useState<number>(0);

  // Filter state for post-exam review list: 'all' | 'correct' | 'wrong' | 'flagged'
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'wrong' | 'flagged'>('all');

  // Timer Countdown Effect
  useEffect(() => {
    let timerId: any = null;
    if (examState === 'active' && !isTimerPaused && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerId);
            handleAutoSubmitExam();
            return 0;
          }
          return prev - 1;
        });
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [examState, isTimerPaused, timeLeft]);

  // Generate 50 balanced questions across all chapters
  const generateMockExamPool = (): MockExamQuestionItem[] => {
    const rawPool: { question: MCQQuestion; lectureId: number; lectureTitle: string }[] = [];

    // 1. Gather all questions from allLectures
    allLectures.forEach(lec => {
      lec.questionBank.forEach(q => {
        rawPool.push({
          question: q,
          lectureId: lec.id,
          lectureTitle: lec.arabicTitle
        });
      });
    });

    // 2. Add fallback questions
    Object.entries(fallbackQuestions).forEach(([lecIdStr, qList]) => {
      const lecId = Number(lecIdStr);
      const lec = allLectures.find(l => l.id === lecId);
      const title = lec ? lec.arabicTitle : `الفصل ${lecId}`;
      qList.forEach(q => {
        // Prevent duplicate IDs if any
        if (!rawPool.some(item => item.question.id === q.id)) {
          rawPool.push({
            question: q,
            lectureId: lecId,
            lectureTitle: title
          });
        }
      });
    });

    // 3. If rawPool length is less than 50, duplicate with unique keys or generate extra
    let fullPool = [...rawPool];

    // Fisher-Yates shuffle
    for (let i = fullPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fullPool[i], fullPool[j]] = [fullPool[j], fullPool[i]];
    }

    // Take top 50, or pad if pool is smaller than 50
    const final50: MockExamQuestionItem[] = [];
    for (let i = 0; i < 50; i++) {
      const source = fullPool[i % fullPool.length];
      final50.push({
        index: i + 1,
        question: {
          ...source.question,
          id: `mock_exam_q_${i + 1}_${source.question.id}`
        },
        lectureId: source.lectureId,
        lectureTitle: source.lectureTitle
      });
    }

    return final50;
  };

  // Start Exam Action
  const handleStartExam = () => {
    const generated = generateMockExamPool();
    setExamQuestions(generated);
    setUserAnswers({});
    setFlaggedIndices(new Set());
    setCurrentIdx(0);
    setTimeLeft(TOTAL_EXAM_TIME_SECONDS);
    setTimeSpent(0);
    setIsTimerPaused(false);
    setExamState('active');

    if (onToast) {
      onToast('🏛️ تم إطلاق اختبار المحاكاة الشامل! 50 سؤالاً - 3 ساعات.');
    }
  };

  // Select Option Answer
  const handleSelectAnswer = (optionKey: 'A' | 'B' | 'C' | 'D') => {
    setUserAnswers(prev => ({
      ...prev,
      [currentIdx]: optionKey
    }));
  };

  // Toggle Flag/Bookmark for current question
  const handleToggleFlag = (idx: number) => {
    setFlaggedIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  // Auto Submit on Time Expiry
  const handleAutoSubmitExam = () => {
    if (onToast) onToast('⏰ انتهى الوقت المحدد للامتحان! تم تسليم الإجابات تلقائياً.');
    finishExamAndProcessResults();
  };

  // Manual Submit Confirmation
  const handleManualSubmitExam = () => {
    const answeredCount = Object.keys(userAnswers).length;
    const unansweredCount = 50 - answeredCount;

    let confirmMsg = 'هل أنت متأكد من إنهاء وتقديم اختبار المحاكاة؟';
    if (unansweredCount > 0) {
      confirmMsg = `تنبيه: يوجد ${unansweredCount} سؤالاً لم تقم بالإجابة عليها بعد. هل تريد التقديم الآن؟`;
    }

    if (window.confirm(confirmMsg)) {
      finishExamAndProcessResults();
    }
  };

  // Core Finish Logic
  const finishExamAndProcessResults = () => {
    setExamState('review_summary');

    // Automatically record all wrong answers into Mistake Bank!
    examQuestions.forEach((item, index) => {
      const chosen = userAnswers[index];
      const isCorrect = chosen && chosen === item.question.correctAnswer;
      if (!isCorrect) {
        recordMistake(
          item.question,
          chosen || 'timeout',
          item.lectureId,
          item.lectureTitle
        );
      }
    });

    if (onToast) {
      onToast('📊 تم تحليل نتائج الامتحان الشامل وتسجيل الأخطاء في بنك الأخطاء.');
    }
  };

  // Analytics Calculation for Review Page
  const analytics = useMemo(() => {
    if (examQuestions.length === 0) return null;

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    // Per chapter breakdown: { [lectureId]: { title: string, total: number, correct: number } }
    const chapterMap: Record<number, { title: string; total: number; correct: number }> = {};

    examQuestions.forEach((item, index) => {
      const chosen = userAnswers[index];
      const isCorrect = chosen === item.question.correctAnswer;

      if (!chapterMap[item.lectureId]) {
        chapterMap[item.lectureId] = {
          title: item.lectureTitle,
          total: 0,
          correct: 0
        };
      }
      chapterMap[item.lectureId].total += 1;

      if (chosen) {
        if (isCorrect) {
          correctCount += 1;
          chapterMap[item.lectureId].correct += 1;
        } else {
          wrongCount += 1;
        }
      } else {
        unansweredCount += 1;
      }
    });

    const scorePercentage = Math.round((correctCount / 50) * 100);

    // Formatted time spent
    const hours = Math.floor(timeSpent / 3600);
    const mins = Math.floor((timeSpent % 3600) / 60);
    const secs = timeSpent % 60;
    const timeSpentFormatted = `${hours > 0 ? `${hours}س و ` : ''}${mins}د و ${secs}ث`;

    let gradeTitle = 'ممتاز جداً 🌟';
    let gradeColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';

    if (scorePercentage < 50) {
      gradeTitle = 'بحاجة لتكثيف المراجعة ⚠️';
      gradeColor = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    } else if (scorePercentage < 75) {
      gradeTitle = 'مستوى جيد جداً 👍';
      gradeColor = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    } else if (scorePercentage < 90) {
      gradeTitle = 'متفوق وجاهز للامتحان 🚀';
      gradeColor = 'text-indigo-300 border-indigo-500/30 bg-indigo-500/10';
    }

    return {
      correctCount,
      wrongCount,
      unansweredCount,
      scorePercentage,
      timeSpentFormatted,
      gradeTitle,
      gradeColor,
      chapters: Object.values(chapterMap)
    };
  }, [examQuestions, userAnswers, timeSpent]);

  // Format Timer Text HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const activeItem = examQuestions[currentIdx];

  return (
    <div className="space-y-6">
      {/* ----------------- STATE 1: INTRO LANDING CARD ----------------- */}
      {examState === 'intro' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6 max-w-4xl mx-auto"
        >
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-right border-b border-slate-800 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20 shrink-0">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-extrabold text-white">اختبار المحاكاة الشامل (Full Mock Exam)</h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-bold">
                  محاكاة الثانوية العامة 2026 🏛️
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                نموذج امتحاني متكامل يطابق نظام امتحانات آخر العام تماماً، يختبر قدرتك على إدارة الوقت والتركيز تحت الضغط.
              </p>
            </div>
          </div>

          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-center space-y-1">
              <FileCheck2 className="w-6 h-6 text-amber-400 mx-auto" />
              <span className="text-[11px] text-slate-400 font-bold block">عدد الأسئلة</span>
              <span className="text-xl font-black text-white font-mono">50 سؤالاً</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-center space-y-1">
              <Clock className="w-6 h-6 text-emerald-400 mx-auto" />
              <span className="text-[11px] text-slate-400 font-bold block">الزمن المخصص</span>
              <span className="text-xl font-black text-emerald-400 font-mono">3 ساعات (180د)</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-center space-y-1">
              <BookOpen className="w-6 h-6 text-indigo-400 mx-auto" />
              <span className="text-[11px] text-slate-400 font-bold block">تغطية المنهج</span>
              <span className="text-xl font-black text-indigo-300 font-mono">جميع الفصول</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-center space-y-1">
              <Brain className="w-6 h-6 text-rose-400 mx-auto" />
              <span className="text-[11px] text-slate-400 font-bold block">بنك الأخطاء</span>
              <span className="text-xl font-black text-rose-300 font-mono">حفظ تلقائي</span>
            </div>
          </div>

          {/* Instructions Bullet Points */}
          <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-5 space-y-3 text-xs">
            <h4 className="font-extrabold text-amber-300 flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>تعليمات وشروط الاختبار الشامل:</span>
            </h4>
            <ul className="space-y-2 text-slate-300 leading-relaxed list-disc list-inside">
              <li>يتكون الاختبار من <strong>50 سؤال اختيار من متعدد (MCQs)</strong> تتدرج في المستويات المعرفية.</li>
              <li>يبدأ المؤقت الزمني تنازلياً فور النقر على "بدء الاختبار"، وسوف يتم تقديم الامتحان تلقائياً عند انتهاء الـ 3 ساعات.</li>
              <li>يمكنك التنقل الحر بين جميع الأسئلة باستخدام مصفوفة التنقل (1 - 50) وتظليل الأسئلة التي ترغب بمراجعتها لاحقاً 🚩.</li>
              <li>عند الإنهاء، ستحصل على <strong>تقرير تحليلي مفصل</strong> يوضح أدائك ونقاط القوة والضعف في كل فصل بالتفصيل.</li>
              <li>جميع الأخطاء التي تقع فيها سينحفظ تفسيرها العلمي فوراً داخل <strong>"بنك الأخطاء"</strong> لتتمكن من مراجعتها لاحقاً.</li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="pt-2 text-center">
            <button
              onClick={handleStartExam}
              className="bg-gradient-to-l from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-base px-10 py-4 rounded-xl shadow-xl shadow-amber-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-3 mx-auto"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>بدء اختبار المحاكاة الشامل (50 سؤالاً) ⚡</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ----------------- STATE 2: ACTIVE EXAM INTERFACE ----------------- */}
      {examState === 'active' && activeItem && (
        <div className="space-y-6">
          {/* TOP CONTROL BAR: TIMER + PROGRESS + SUBMIT */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md sticky top-2 z-20 flex flex-wrap items-center justify-between gap-4">
            {/* Exam Title & Question Counter */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                {currentIdx + 1}
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-bold">سؤال {currentIdx + 1} من 50</span>
                <span className="text-xs text-white font-bold">{activeItem.lectureTitle}</span>
              </div>
            </div>

            {/* COUNTDOWN TIMER */}
            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border font-mono font-bold transition-all ${
              timeLeft < 15 * 60 
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                : 'bg-slate-950 border-slate-800 text-emerald-400'
            }`}>
              <Timer className="w-5 h-5 shrink-0" />
              <span className="text-lg">{formatTime(timeLeft)}</span>
              <button
                onClick={() => setIsTimerPaused(!isTimerPaused)}
                className="text-slate-400 hover:text-white mr-1 p-1 rounded hover:bg-slate-900 transition-colors"
                title={isTimerPaused ? 'استئناف الوقت' : 'إيقاف مؤقت'}
              >
                {isTimerPaused ? <Play className="w-3.5 h-3.5 fill-current text-amber-400" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* QUICK STATS & SUBMIT EXAM BUTTON */}
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-400 hidden sm:block">
                المجاب عنه: <strong className="text-emerald-400 font-mono">{Object.keys(userAnswers).length}</strong> / 50
              </div>

              <button
                onClick={handleManualSubmitExam}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>تقديم الامتحان وإظهار التقرير</span>
              </button>
            </div>
          </div>

          {/* MAIN EXAM CONTENT GRID: QUESTION BOX + QUESTION PALETTE */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT 3 COLS: QUESTION CARD & OPTIONS */}
            <div className="lg:col-span-3 space-y-5">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6"
              >
                {/* Question Header & Flag Toggle */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-950 text-slate-300 border border-slate-800 text-[10px] px-2.5 py-1 rounded-md font-bold">
                      {activeItem.lectureTitle}
                    </span>
                    {activeItem.question.sourceYear && (
                      <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] px-2 py-0.5 rounded font-mono">
                        {activeItem.question.sourceYear}
                      </span>
                    )}
                  </div>

                  {/* Flag / Bookmark Button */}
                  <button
                    onClick={() => handleToggleFlag(currentIdx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      flaggedIndices.has(currentIdx)
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${flaggedIndices.has(currentIdx) ? 'fill-current text-amber-400' : ''}`} />
                    <span>{flaggedIndices.has(currentIdx) ? 'مُعلم للمراجعة 🚩' : 'تعليم للمراجعة'}</span>
                  </button>
                </div>

                {/* Question Text */}
                <div className="bg-slate-950/70 border-r-4 border-amber-500 rounded-l-xl p-5 border-y border-l border-slate-900">
                  <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                    س{currentIdx + 1}: {activeItem.question.questionText}
                  </h3>
                </div>

                {/* OPTIONS RADIO CARDS */}
                <div className="space-y-3">
                  {Object.entries(activeItem.question.options).map(([optKey, optText]) => {
                    const isSelected = userAnswers[currentIdx] === optKey;

                    return (
                      <button
                        key={optKey}
                        onClick={() => handleSelectAnswer(optKey as any)}
                        className={`w-full text-right p-4 rounded-xl border text-sm transition-all duration-200 flex items-start gap-3.5 cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-l from-emerald-950/80 to-slate-950 border-emerald-500/80 text-white font-bold shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                            : 'bg-slate-950/50 border-slate-850 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border transition-all ${
                          isSelected 
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-black' 
                            : 'bg-slate-850 border-slate-750 text-slate-400'
                        }`}>
                          {optKey}
                        </span>
                        <span className="flex-1 leading-relaxed mt-0.5">{optText}</span>
                      </button>
                    );
                  })}
                </div>

                {/* NAVIGATION FOOTER */}
                <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                  <button
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السؤال السابق</span>
                  </button>

                  <span className="text-xs text-slate-400 font-mono font-bold">
                    {currentIdx + 1} / 50
                  </span>

                  <button
                    disabled={currentIdx === 49}
                    onClick={() => setCurrentIdx(prev => Math.min(49, prev + 1))}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 flex items-center gap-1 cursor-pointer font-black"
                  >
                    <span>السؤال التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </div>

            {/* RIGHT 1 COL: QUESTION PALETTE MATRIX (1 to 50) */}
            <div className="space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <ListFilter className="w-4 h-4 text-amber-400" />
                    <span>مصفوفة الأسئلة (1 - 50)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                    {Object.keys(userAnswers).length}/50
                  </span>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-3 gap-1.5 text-[10px] text-slate-400 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>مجاب</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>مُعلم 🚩</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
                    <span>متبقي</span>
                  </div>
                </div>

                {/* Grid of 50 Buttons */}
                <div className="grid grid-cols-5 gap-1.5 max-h-[420px] overflow-y-auto pr-1">
                  {Array.from({ length: 50 }, (_, i) => {
                    const isCurrent = i === currentIdx;
                    const isAnswered = userAnswers[i] !== undefined;
                    const isFlagged = flaggedIndices.has(i);

                    let btnColor = 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-850';

                    if (isAnswered) {
                      btnColor = 'bg-emerald-600 text-white border-emerald-500 font-bold';
                    }
                    if (isFlagged) {
                      btnColor = 'bg-amber-500 text-slate-950 border-amber-400 font-black';
                    }
                    if (isCurrent) {
                      btnColor += ' ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 scale-105';
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentIdx(i)}
                        className={`h-9 rounded-lg text-xs font-mono font-bold border transition-all flex items-center justify-center cursor-pointer relative ${btnColor}`}
                      >
                        {i + 1}
                        {isFlagged && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Submit button inside sidebar too */}
                <button
                  onClick={handleManualSubmitExam}
                  className="w-full bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>تقديم وانهاء الامتحان</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- STATE 3: POST-EXAM ANALYTICS REPORT ----------------- */}
      {examState === 'review_summary' && analytics && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* TOP SCORE OVERVIEW BANNER */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6">
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border font-mono font-black shadow-xl shrink-0 ${analytics.gradeColor}`}>
                  <span className="text-3xl">{analytics.scorePercentage}%</span>
                  <span className="text-[10px] font-sans">المجموع النهائي</span>
                </div>

                <div className="space-y-1 text-center md:text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold border ${analytics.gradeColor}`}>
                    {analytics.gradeTitle}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">تقرير نتيجة اختبار المحاكاة الشامل</h2>
                  <p className="text-xs text-slate-400">
                    تم الإجابة على <strong>{50 - analytics.unansweredCount}</strong> سؤالاً من أصل 50 سؤالاً في زمن قدره <strong>{analytics.timeSpentFormatted}</strong>.
                  </p>
                </div>
              </div>

              {/* RETAKE OR RETURN BUTTONS */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleStartExam}
                  className="bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>بدء محاكاة جديدة (50 سؤالاً) ⚡</span>
                </button>
              </div>
            </div>

            {/* KEY METRICS CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">إجابات صحيحة</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">{analytics.correctCount} / 50</span>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">إجابات خاطئة</span>
                  <span className="text-lg font-black text-rose-400 font-mono">{analytics.wrongCount}</span>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">أسئلة متروكة</span>
                  <span className="text-lg font-black text-slate-300 font-mono">{analytics.unansweredCount}</span>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">الوقت المستغرق</span>
                  <span className="text-xs font-black text-indigo-300 font-mono">{analytics.timeSpentFormatted}</span>
                </div>
              </div>
            </div>

            {/* CHAPTER-BY-CHAPTER BREAKDOWN BAR CHARTS */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>تحليل نسبة الإتقان حسب فصول المنهج:</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analytics.chapters.map((ch, idx) => {
                  const rate = ch.total > 0 ? Math.round((ch.correct / ch.total) * 100) : 0;
                  return (
                    <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-200">{ch.title}</span>
                        <span className="text-amber-400 font-mono">{ch.correct}/{ch.total} ({rate}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-850">
                        <div
                          className={`h-full transition-all duration-500 ${
                            rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${rate}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DETAILED QUESTION-BY-QUESTION REVIEW LIST */}
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>مراجعة إجابات الـ 50 سؤالاً بالتفصيل:</span>
              </h3>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setReviewFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reviewFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الكل (50)
                </button>
                <button
                  onClick={() => setReviewFilter('correct')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reviewFilter === 'correct' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  صحيحة ({analytics.correctCount})
                </button>
                <button
                  onClick={() => setReviewFilter('wrong')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    reviewFilter === 'wrong' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  خاطئة ({analytics.wrongCount})
                </button>
              </div>
            </div>

            {/* List of items */}
            {examQuestions.map((item, index) => {
              const userAns = userAnswers[index];
              const isCorrect = userAns === item.question.correctAnswer;
              const isFlagged = flaggedIndices.has(index);

              // Filtering logic
              if (reviewFilter === 'correct' && !isCorrect) return null;
              if (reviewFilter === 'wrong' && isCorrect) return null;
              if (reviewFilter === 'flagged' && !isFlagged) return null;

              return (
                <div
                  key={item.question.id || index}
                  className={`bg-slate-900/50 border rounded-xl p-5 shadow-xl backdrop-blur-sm space-y-4 ${
                    isCorrect ? 'border-emerald-500/30' : userAns ? 'border-rose-500/30' : 'border-slate-800'
                  }`}
                >
                  {/* Top Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-950 text-slate-300 font-mono font-bold text-xs flex items-center justify-center border border-slate-800">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-300">{item.lectureTitle}</span>
                      {isFlagged && (
                        <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded font-bold">
                          مُعلم للمراجعة 🚩
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1 rounded-lg font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>إجابة صحيحة</span>
                        </span>
                      ) : userAns ? (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs px-3 py-1 rounded-lg font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>إجابة خاطئة (مسجلة في بنك الأخطاء)</span>
                        </span>
                      ) : (
                        <span className="bg-slate-800 text-slate-400 text-xs px-3 py-1 rounded-lg font-bold">
                          سؤال متروك
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <h4 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                    {item.question.questionText}
                  </h4>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(item.question.options).map(([k, text]) => {
                      const isOptionCorrect = k === item.question.correctAnswer;
                      const isOptionUserChosen = userAns === k;

                      let style = 'bg-slate-950/40 border-slate-850 text-slate-400';

                      if (isOptionCorrect) {
                        style = 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 font-bold';
                      } else if (isOptionUserChosen) {
                        style = 'bg-rose-950/50 border-rose-500/50 text-rose-300 line-through opacity-80';
                      }

                      return (
                        <div key={k} className={`p-3 rounded-xl border flex items-start gap-2.5 ${style}`}>
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold shrink-0 ${
                            isOptionCorrect ? 'bg-emerald-500 text-slate-950' : isOptionUserChosen ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {k}
                          </span>
                          <span className="flex-1 leading-relaxed">{text}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-1">
                    <span className="font-extrabold text-amber-300 flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>التفسير العلمي المعتمد:</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {item.question.explanation.correct}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
