import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Timer, 
  Trophy, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play, 
  RotateCcw, 
  ChevronLeft, 
  Sparkles, 
  Star, 
  Flame, 
  BarChart2, 
  User, 
  Medal,
  HelpCircle,
  Filter,
  Trash2
} from 'lucide-react';
import { MCQQuestion, LectureData } from '../types';
import { recordMistake } from '../utils/mistakeBankUtils';
import { useLanguage } from '../context/LanguageContext';
import { autoTranslateText } from '../utils/autoTranslator';
import { AnimatedScoreCounter } from './AnimatedScoreCounter';

export interface SpeedLeaderboardEntry {
  id: string;
  userName: string;
  score: number;
  correctCount: number;
  totalTimeSeconds: number;
  avgTimePerQuestion: number;
  scopeTitle: string;
  lectureId: number | 'all';
  date: string;
}

const DEFAULT_LEADERBOARD: SpeedLeaderboardEntry[] = [
  {
    id: 'lb-1',
    userName: 'أحمد محمود',
    score: 1340,
    correctCount: 10,
    totalTimeSeconds: 110,
    avgTimePerQuestion: 11.0,
    scopeTitle: 'اختبار شامل لجميع الفصول',
    lectureId: 'all',
    date: '٢٩ يوليو ٢٠٢٦'
  },
  {
    id: 'lb-2',
    userName: 'سارة يوسف',
    score: 1180,
    correctCount: 10,
    totalTimeSeconds: 145,
    avgTimePerQuestion: 14.5,
    scopeTitle: 'الفصل الأول: الدعامة والحركة',
    lectureId: 1,
    date: '٢٨ يوليو ٢٠٢٦'
  },
  {
    id: 'lb-3',
    userName: 'عمر خالد',
    score: 1020,
    correctCount: 9,
    totalTimeSeconds: 135,
    avgTimePerQuestion: 15.0,
    scopeTitle: 'الفصل السادس: البيولوجيا الجزيئية',
    lectureId: 6,
    date: '٢٩ يوليو ٢٠٢٦'
  },
  {
    id: 'lb-4',
    userName: 'مريم حسن',
    score: 910,
    correctCount: 9,
    totalTimeSeconds: 165,
    avgTimePerQuestion: 18.3,
    scopeTitle: 'اختبار شامل لجميع الفصول',
    lectureId: 'all',
    date: '٢٧ يوليو ٢٠٢٦'
  },
  {
    id: 'lb-5',
    userName: 'يوسف العبد',
    score: 830,
    correctCount: 8,
    totalTimeSeconds: 125,
    avgTimePerQuestion: 15.6,
    scopeTitle: 'الفصل الثالث: التكاثر في الكائنات الحية',
    lectureId: 3,
    date: '٢٦ يوليو ٢٠٢٦'
  }
];

interface SpeedQuizToolProps {
  currentLecture: LectureData;
  allLectures: LectureData[];
  extendedQuestions: MCQQuestion[];
  onToast?: (msg: string) => void;
}

export function SpeedQuizTool({
  currentLecture,
  allLectures,
  extendedQuestions,
  onToast
}: SpeedQuizToolProps) {
  const { isAr, language } = useLanguage();
  // Game states
  const [quizState, setQuizState] = useState<'idle' | 'running' | 'feedback' | 'completed' | 'leaderboard'>('idle');
  const [scope, setScope] = useState<'current' | 'all'>('all');
  const [usedQuestionIds, setUsedQuestionIds] = useState<Set<string>>(new Set());
  
  // Active Speed Quiz States
  const [selectedQuestions, setSelectedQuestions] = useState<MCQQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [lastQuestionResult, setLastQuestionResult] = useState<{
    isCorrect: boolean;
    pointsEarned: number;
    timeSpent: number;
    wasTimeout: boolean;
  } | null>(null);

  // Answers history for end report
  const [answersHistory, setAnswersHistory] = useState<Array<{
    question: MCQQuestion;
    chosenOption: 'A' | 'B' | 'C' | 'D' | 'timeout';
    isCorrect: boolean;
    timeSpent: number;
    pointsEarned: number;
  }>>([]);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<SpeedLeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem('thanaweya_speed_quiz_leaderboard');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_LEADERBOARD;
  });

  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('thanaweya_student_name') || '';
  });
  const [isScoreSaved, setIsScoreSaved] = useState<boolean>(false);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'all' | number>('all');

  // Save leaderboard to local storage
  const saveLeaderboardToStorage = (entries: SpeedLeaderboardEntry[]) => {
    try {
      localStorage.setItem('thanaweya_speed_quiz_leaderboard', JSON.stringify(entries));
    } catch (e) {
      console.error(e);
    }
  };

  // Sound/Visual pulse effect trigger
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pool of available questions based on selected scope
  const availableQuestionPool = useMemo(() => {
    if (scope === 'all') {
      const allQs: MCQQuestion[] = [];
      allLectures.forEach(lec => {
        allQs.push(...lec.questionBank);
      });
      allQs.push(...extendedQuestions);
      // Remove duplicates by id
      const seen = new Set<string>();
      return allQs.filter(q => {
        if (seen.has(q.id)) return false;
        seen.add(q.id);
        return true;
      });
    } else {
      // Current lecture pool
      const seen = new Set<string>();
      return extendedQuestions.filter(q => {
        if (seen.has(q.id)) return false;
        seen.add(q.id);
        return true;
      });
    }
  }, [scope, allLectures, extendedQuestions]);

  // Start Speed Quiz Engine
  const handleStartQuiz = () => {
    if (availableQuestionPool.length === 0) {
      if (onToast) onToast('⚠️ لا توجد أسئلة متوفرة في هذا النطاق لحساب السرعة.');
      return;
    }

    // Filter out previously answered questions to guarantee fresh set on replay
    let eligiblePool = availableQuestionPool.filter(q => !usedQuestionIds.has(q.id));
    
    // If running low on fresh questions, reset tracking so quiz can cycle back
    if (eligiblePool.length < 10) {
      eligiblePool = [...availableQuestionPool];
      setUsedQuestionIds(new Set());
    }

    // Fisher-Yates shuffle for maximum randomness
    const shuffled = [...eligiblePool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const picked = shuffled.slice(0, 10);

    // Update used questions set
    setUsedQuestionIds(prev => {
      const next = new Set(prev);
      picked.forEach(q => next.add(q.id));
      return next;
    });

    setSelectedQuestions(picked);
    setCurrentIndex(0);
    setTimeLeft(30);
    setTotalScore(0);
    setAnswersHistory([]);
    setSelectedOption(null);
    setLastQuestionResult(null);
    setIsScoreSaved(false);
    setQuizState('running');

    if (onToast) {
      onToast('🎲 تم تجهيز 10 أسئلة جديدة من كامل المنهج!');
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (quizState !== 'running') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time expired for this question!
          clearInterval(timerRef.current as NodeJS.Timeout);
          handleQuestionFinish('timeout', 30, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizState, currentIndex]);

  // Handle option selection or timeout
  const handleOptionClick = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (quizState !== 'running') return;
    const timeSpent = 30 - timeLeft;
    setSelectedOption(opt);
    handleQuestionFinish(opt, timeSpent, false);
  };

  const handleQuestionFinish = (
    chosen: 'A' | 'B' | 'C' | 'D' | 'timeout',
    timeSpent: number,
    wasTimeout: boolean
  ) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const activeQ = selectedQuestions[currentIndex];
    const isCorrect = chosen !== 'timeout' && chosen === activeQ.correctAnswer;
    
    // Automatically log wrong questions to Mistake Bank
    if (!isCorrect) {
      recordMistake(
        activeQ,
        chosen,
        currentLecture.id,
        currentLecture.arabicTitle
      );
    }
    
    // Scoring logic:
    // Base 100 points for correct answer
    // Speed Bonus: 4 extra points for each second remaining (max 30s left * 4 = 120 extra points!)
    const remainingSeconds = Math.max(0, 30 - timeSpent);
    const pointsEarned = isCorrect ? (100 + remainingSeconds * 4) : 0;

    const newScore = totalScore + pointsEarned;
    setTotalScore(newScore);

    setLastQuestionResult({
      isCorrect,
      pointsEarned,
      timeSpent,
      wasTimeout
    });

    const newAnswerRecord = {
      question: activeQ,
      chosenOption: chosen,
      isCorrect,
      timeSpent,
      pointsEarned
    };

    setAnswersHistory(prev => [...prev, newAnswerRecord]);
    setQuizState('feedback');

    // After 1.2s delay, move to next question or complete
    setTimeout(() => {
      if (currentIndex < selectedQuestions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setTimeLeft(30);
        setSelectedOption(null);
        setLastQuestionResult(null);
        setQuizState('running');
      } else {
        setQuizState('completed');
      }
    }, 1200);
  };

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (answersHistory.length === 0) {
      return { correctCount: 0, totalTime: 0, avgTime: 0, totalScore: 0 };
    }
    const correctCount = answersHistory.filter(a => a.isCorrect).length;
    const totalTime = answersHistory.reduce((acc, curr) => acc + curr.timeSpent, 0);
    const avgTime = Math.round((totalTime / answersHistory.length) * 10) / 10;
    return {
      correctCount,
      totalTime,
      avgTime,
      totalScore
    };
  }, [answersHistory, totalScore]);

  // Save high score to Leaderboard
  const handleSaveToLeaderboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    try {
      localStorage.setItem('thanaweya_student_name', userName.trim());
    } catch (err) {
      console.error(err);
    }

    const scopeTitle = scope === 'all' 
      ? 'اختبار شامل لجميع الفصول' 
      : `${currentLecture.arabicTitle}`;

    const newEntry: SpeedLeaderboardEntry = {
      id: `lb_${Date.now()}`,
      userName: userName.trim(),
      score: totalScore,
      correctCount: summaryMetrics.correctCount,
      totalTimeSeconds: summaryMetrics.totalTime,
      avgTimePerQuestion: summaryMetrics.avgTime,
      scopeTitle,
      lectureId: scope === 'all' ? 'all' : currentLecture.id,
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    };

    const updatedLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score || a.totalTimeSeconds - b.totalTimeSeconds);

    setLeaderboard(updatedLeaderboard);
    saveLeaderboardToStorage(updatedLeaderboard);
    setIsScoreSaved(true);
    if (onToast) onToast('🏆 تم حفظ إنجازك بنجاح في لوحة المتفوقين!');
    setQuizState('leaderboard');
  };

  // Clear local leaderboard
  const handleClearLeaderboard = () => {
    if (window.confirm('هل أنت متأكد من مسح جميع النتائج المسجلة في جدول الترتيب؟')) {
      setLeaderboard(DEFAULT_LEADERBOARD);
      saveLeaderboardToStorage(DEFAULT_LEADERBOARD);
      if (onToast) onToast('🧹 تم إعادة تعيين جدول المتفوقين إلى القائمة الافتراضية.');
    }
  };

  // Filtered leaderboard entries
  const filteredLeaderboard = useMemo(() => {
    if (leaderboardFilter === 'all') return leaderboard;
    return leaderboard.filter(item => item.lectureId === leaderboardFilter);
  }, [leaderboard, leaderboardFilter]);

  const activeQuestion = selectedQuestions[currentIndex];

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
            <Zap className="w-6 h-6 fill-current animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">اختبار السرعة التنافسي (Speed Quiz)</h3>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                10 أسئلة • 30 ثانية لكل سؤال
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تحدّ معلوماتك وسرعة بديهتك تحت الضغط الزمني لحصد أعلى النقاط وتصدر لوحة المتفوقين.
            </p>
          </div>
        </div>

        {/* TOP TAB CONTROLS */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-850 self-start md:self-auto">
          <button
            onClick={() => setQuizState('idle')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              quizState === 'idle' || quizState === 'running' || quizState === 'feedback' || quizState === 'completed'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>خوض التحدي</span>
          </button>
          <button
            onClick={() => setQuizState('leaderboard')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              quizState === 'leaderboard'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span>لوحة المتفوقين ({leaderboard.length})</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: IDLE / CONFIG SCREEN */}
      {quizState === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-6"
        >
          {/* Rules Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white mb-1">مؤقت 30 ثانية لكل سؤال</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  يجب اختيار الإجابة الصحيحة قبل انتهاء العداد، وسينتقل النظام تلقائياً للسؤال التالي.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white mb-1">مكافأة السرعة (Speed Bonus)</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  كل إجابة صحيحة تمنحك 100 نقطة أساسية + 4 نقاط إضافية عن كل ثانية متبقية في المؤقت!
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white mb-1">لوحة ترتيب متصدرين حية</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  احصد أعلى النقاط وسجل اسمك في لوحة شرف المتفوقين للمنافسة على المركز الأول.
                </p>
              </div>
            </div>
          </div>

          {/* Scope Selector */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400" />
              اختر نطاق الأسئلة لاختبار السرعة:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScope('current')}
                className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
                  scope === 'current'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-lg shadow-amber-500/5'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-amber-300">الفصل الحالي فقط</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                    {currentLecture.arabicTitle}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  اختبار 10 أسئلة عشوائية مخصصة من بنك أسئلة {currentLecture.title}.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
                  scope === 'all'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-lg shadow-amber-500/5'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-amber-300">اختبار شامل لجميع الفصول</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">
                    6 فصول كاملة
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  أسئلة عشوائية متفرقة تشمل كافة أجزاء المنهج لتجربة امتحانية كاملة الشمول.
                </p>
              </button>
            </div>
          </div>

          {/* High Scores Preview */}
          <div className="border-t border-slate-800 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Medal className="w-8 h-8 text-yellow-400" />
              <div>
                <span className="text-xs text-slate-400 block">أعلى نتيجة مسجلة حتى الآن:</span>
                <span className="text-sm font-bold text-white font-mono">
                  {leaderboard[0]?.userName || 'لا يوجد'} — {leaderboard[0]?.score || 0} نقطة ({leaderboard[0]?.correctCount || 0}/10)
                </span>
              </div>
            </div>

            <button
              onClick={handleStartQuiz}
              className="w-full sm:w-auto bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.02]"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>ابدأ التحدي الآن (10 أسئلة)!</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* VIEW 2: RUNNING & FEEDBACK SCREEN */}
      {(quizState === 'running' || quizState === 'feedback') && activeQuestion && (
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-2xl backdrop-blur-sm space-y-6 relative overflow-hidden"
        >
          {/* Top Progress & Score Row */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold text-xs px-3 py-1 rounded-lg">
                سؤال {currentIndex + 1} من {selectedQuestions.length}
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {activeQuestion.sourceYear || 'سؤال امتحاني'}
              </span>
            </div>

            {/* Current Score Counter */}
            <div className="flex items-center gap-2 bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400 font-bold">مجموع النقاط:</span>
              <span className="text-base font-extrabold text-amber-400 font-mono">{totalScore}</span>
            </div>
          </div>

          {/* TIMER BAR */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-rose-400 animate-bounce' : 'text-amber-400'}`} />
                <span>الوقت المتبقي للسؤال:</span>
              </span>
              <span className={`font-mono font-extrabold text-base ${
                timeLeft <= 5 ? 'text-rose-400 animate-pulse' : timeLeft <= 12 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {timeLeft} ثانية
              </span>
            </div>

            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <motion.div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  timeLeft <= 5 
                    ? 'bg-rose-500 shadow-lg shadow-rose-500/50' 
                    : timeLeft <= 12 
                    ? 'bg-amber-500' 
                    : 'bg-gradient-to-l from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              />
            </div>
          </div>

          {/* QUESTION TEXT */}
          <div className="bg-slate-950/70 border-r-4 border-amber-500 rounded-l-xl p-5 border-l border-y border-slate-900 shadow-inner">
            <p className="text-base text-white font-semibold leading-relaxed">
              {activeQuestion.questionText}
            </p>
          </div>

          {/* OPTIONS GRID */}
          <div className="space-y-3">
            {Object.entries(activeQuestion.options).map(([key, optText]) => {
              const isSelected = selectedOption === key;
              const isCorrectAns = activeQuestion.correctAnswer === key;

              let btnStyle = 'bg-slate-950/40 border-slate-800 text-slate-200 hover:bg-slate-900 hover:border-slate-700';

              if (quizState === 'feedback') {
                if (isCorrectAns) {
                  btnStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-500/20 border-rose-500/60 text-rose-300 font-bold';
                } else {
                  btnStyle = 'bg-slate-950/20 border-slate-900 text-slate-500 opacity-40';
                }
              }

              return (
                <button
                  key={key}
                  disabled={quizState === 'feedback'}
                  onClick={() => handleOptionClick(key as any)}
                  className={`w-full text-right p-4 rounded-xl border text-sm transition-all duration-200 flex items-start gap-3 cursor-pointer ${btnStyle}`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5 border shrink-0 ${
                    quizState === 'feedback'
                      ? (isCorrectAns ? 'bg-emerald-500 border-emerald-500 text-slate-950' : isSelected ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500')
                      : 'bg-slate-800 border-slate-700 text-amber-400'
                  }`}>
                    {key}
                  </span>
                  <span className="flex-1 leading-relaxed">{optText}</span>
                </button>
              );
            })}
          </div>

          {/* FEEDBACK OVERLAY BANNER */}
          {quizState === 'feedback' && lastQuestionResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border flex items-center justify-between ${
                lastQuestionResult.isCorrect 
                  ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' 
                  : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {lastQuestionResult.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-sm block">إجابة صحيحة وسريعة!</span>
                      <span className="text-xs text-emerald-300">
                        استغرقت {lastQuestionResult.timeSpent} ثوانٍ فقط.
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                    <div>
                      <span className="font-bold text-sm block">
                        {lastQuestionResult.wasTimeout ? 'انتهى الوقت المحدد!' : 'إجابة خاطئة'}
                      </span>
                      <span className="text-xs text-rose-300">
                        الإجابة الصحيحة هي ({activeQuestion.correctAnswer}).
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-left font-mono">
                <span className={`text-lg font-extrabold ${lastQuestionResult.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {lastQuestionResult.isCorrect ? `+${lastQuestionResult.pointsEarned} pt` : '0 pt'}
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* VIEW 3: QUIZ COMPLETED & SUMMARY SCREEN */}
      {quizState === 'completed' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-2xl backdrop-blur-sm space-y-6 text-center"
        >
          {/* Trophy & Animated Score Counter */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <AnimatedScoreCounter
              value={Math.round((summaryMetrics.correctCount / 10) * 100)}
              size="lg"
              label={isAr ? `إجابات صحيحة (${summaryMetrics.correctCount}/10)` : `Correct Answers (${summaryMetrics.correctCount}/10)`}
              showRing={true}
              showSparkles={true}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">{isAr ? "اكتمل اختبار السرعة بنجاح!" : "Speed Quiz Completed Successfully!"}</h3>
            <p className="text-xs text-slate-400">{isAr ? "ملخص أدائك وسرعة استجابتك في الأسئلة العشرة" : "Summary of performance and speed across the 10 questions"}</p>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">إجمالي النقاط</span>
              <span className="text-xl font-extrabold text-amber-400 font-mono">{summaryMetrics.totalScore}</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">الإجابات الصحيحة</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                {summaryMetrics.correctCount} / 10
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">متوسط زمن السؤال</span>
              <span className="text-xl font-extrabold text-cyan-400 font-mono">
                {summaryMetrics.avgTime} ث
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
              <span className="text-[11px] text-slate-400 block mb-1">إجمالي الوقت</span>
              <span className="text-xl font-extrabold text-indigo-400 font-mono">
                {summaryMetrics.totalTime} ث
              </span>
            </div>
          </div>

          {/* Save to Leaderboard Form */}
          <div className="max-w-md mx-auto bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 text-right" dir="rtl">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              سجّل اسمك في لوحة المتفوقين للمنافسة:
            </h4>

            {!isScoreSaved ? (
              <form onSubmit={handleSaveToLeaderboard} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="اكتب اسمك الثلاثي..."
                  className="flex-1 bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer shrink-0"
                >
                  حفظ وتسجيل
                </button>
              </form>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-xl text-xs font-bold flex items-center justify-between">
                <span>✅ تم تسجيل إنجازك بنجاح في الجدول!</span>
                <button
                  onClick={() => setQuizState('leaderboard')}
                  className="text-amber-400 hover:underline cursor-pointer"
                >
                  عرض اللوحة
                </button>
              </div>
            )}
          </div>

          {/* Detailed Question Answers Review */}
          <div className="max-w-2xl mx-auto space-y-3 text-right" dir="rtl">
            <h4 className="text-xs font-bold text-slate-400 border-b border-slate-850 pb-2">
              تفاصيل الإجابات وزمن الاستجابة:
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {answersHistory.map((ans, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    ans.isCorrect ? 'bg-slate-950/60 border-slate-850' : 'bg-rose-950/20 border-rose-900/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {ans.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-200 line-clamp-1 max-w-md">
                      س{idx + 1}: {ans.question.questionText}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
                    <span className="text-slate-400">{ans.timeSpent}ث</span>
                    <span className={ans.isCorrect ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      +{ans.pointsEarned} pt
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={handleStartQuiz}
              className="bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold px-6 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transform hover:scale-[1.02]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة التحدي بأسئلة جديدة (10 أسئلة) ⚡</span>
            </button>
            <button
              onClick={() => setQuizState('leaderboard')}
              className="bg-slate-950 hover:bg-slate-900 text-white border border-slate-800 font-bold px-6 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>عرض جدول ترتيب المتفوقين</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* VIEW 4: LEADERBOARD SCREEN (جدول ترتيب المتفوقين) */}
      {quizState === 'leaderboard' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-6"
        >
          {/* Leaderboard Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-7 h-7 text-yellow-400" />
              <div>
                <h3 className="text-lg font-bold text-white">جدول ترتيب متفوقي اختبار السرعة</h3>
                <p className="text-xs text-slate-400">ترتيب الطلاب بناءً على مجموع النقاط، الدقة، والسرعة الفائقة.</p>
              </div>
            </div>

            {/* Filter Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">التصفية:</span>
              <select
                value={leaderboardFilter}
                onChange={(e) => setLeaderboardFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none"
              >
                <option value="all">جميع الفصول والاختبار الشامل</option>
                {allLectures.map(lec => (
                  <option key={lec.id} value={lec.id}>{lec.arabicTitle}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Top 3 Podium Highlights */}
          {filteredLeaderboard.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* 2nd Place */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-center space-y-2 order-2 md:order-1 relative overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-slate-700 text-slate-200 font-bold mx-auto flex items-center justify-center text-sm shadow">
                  🥈 2
                </div>
                <h4 className="font-bold text-white text-sm">{filteredLeaderboard[1].userName}</h4>
                <p className="text-xs text-amber-400 font-mono font-bold">{filteredLeaderboard[1].score} نقطة</p>
                <p className="text-[10px] text-slate-400">
                  {filteredLeaderboard[1].correctCount}/10 إجابات • {filteredLeaderboard[1].totalTimeSeconds}ث
                </p>
              </div>

              {/* 1st Place (Gold Winner) */}
              <div className="bg-gradient-to-b from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/40 p-5 rounded-xl text-center space-y-2 order-1 md:order-2 shadow-xl shadow-amber-500/5 relative overflow-hidden transform md:-translate-y-2">
                <span className="absolute top-2 left-2 text-xs text-yellow-400 font-bold font-mono">المركز الأول</span>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 font-black mx-auto flex items-center justify-center text-lg shadow-lg shadow-amber-500/30">
                  🥇 1
                </div>
                <h4 className="font-extrabold text-white text-base">{filteredLeaderboard[0].userName}</h4>
                <p className="text-base text-amber-300 font-mono font-black">{filteredLeaderboard[0].score} نقطة</p>
                <p className="text-xs text-slate-300 font-medium">
                  {filteredLeaderboard[0].correctCount}/10 إجابات • متوسط {filteredLeaderboard[0].avgTimePerQuestion}ث/سؤال
                </p>
              </div>

              {/* 3rd Place */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-center space-y-2 order-3 relative overflow-hidden">
                <div className="w-10 h-10 rounded-full bg-amber-900/40 text-amber-300 font-bold mx-auto flex items-center justify-center text-sm shadow">
                  🥉 3
                </div>
                <h4 className="font-bold text-white text-sm">{filteredLeaderboard[2].userName}</h4>
                <p className="text-xs text-amber-400 font-mono font-bold">{filteredLeaderboard[2].score} نقطة</p>
                <p className="text-[10px] text-slate-400">
                  {filteredLeaderboard[2].correctCount}/10 إجابات • {filteredLeaderboard[2].totalTimeSeconds}ث
                </p>
              </div>
            </div>
          )}

          {/* Main Leaderboard Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-right text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">الترتيب</th>
                  <th className="p-3.5">اسم الطالب (البطل)</th>
                  <th className="p-3.5">نطاق الاختبار</th>
                  <th className="p-3.5">الدقة</th>
                  <th className="p-3.5">النقاط</th>
                  <th className="p-3.5">الزمن الإجمالي</th>
                  <th className="p-3.5">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredLeaderboard.map((entry, idx) => (
                  <tr 
                    key={entry.id || idx}
                    className={`transition-colors ${
                      idx === 0 ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="p-3.5 font-bold font-mono text-center">
                      {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      {entry.userName}
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {entry.scopeTitle}
                    </td>
                    <td className="p-3.5 font-mono text-emerald-400 font-bold">
                      {entry.correctCount} / 10
                    </td>
                    <td className="p-3.5 font-mono font-extrabold text-amber-400">
                      {entry.score}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {entry.totalTimeSeconds} ثانية
                    </td>
                    <td className="p-3.5 text-[10px] text-slate-500">
                      {entry.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={handleClearLeaderboard}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح السجل وإعادة التعيين</span>
            </button>

            <button
              onClick={handleStartQuiz}
              className="bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold px-6 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>بدء جولة جديدة بأسئلة جديدة (10 أسئلة) ⚡</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
