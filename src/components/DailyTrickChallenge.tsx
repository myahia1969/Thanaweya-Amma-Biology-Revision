import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Zap, 
  Flame, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  BookOpen, 
  Award,
  HelpCircle,
  RotateCcw,
  TrendingUp,
  Info
} from 'lucide-react';
import { LectureData, ExamTrick, MCQQuestion } from '../types';

interface DailyTrickChallengeProps {
  allLectures: LectureData[];
  onNavigateToLecture: (lectureId: number, tab?: string) => void;
}

interface CombinedTrickItem {
  id: string;
  lectureId: number;
  lectureArabicTitle: string;
  trick: ExamTrick;
  relatedQuestion?: MCQQuestion;
}

export const DailyTrickChallenge: React.FC<DailyTrickChallengeProps> = ({
  allLectures,
  onNavigateToLecture
}) => {
  // Aggregate all tricks from all lectures
  const aggregatedTricks = useMemo<CombinedTrickItem[]>(() => {
    const list: CombinedTrickItem[] = [];
    allLectures.forEach(lecture => {
      lecture.tricks.forEach((trick, idx) => {
        // Find a matching question if available
        const relatedQuestion = lecture.questionBank[idx % lecture.questionBank.length];
        list.push({
          id: `${lecture.id}-${trick.id}`,
          lectureId: lecture.id,
          lectureArabicTitle: lecture.arabicTitle,
          trick,
          relatedQuestion
        });
      });
    });
    return list;
  }, [allLectures]);

  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Compute today's index deterministically based on date
  const todayTrickIndex = useMemo(() => {
    if (aggregatedTricks.length === 0) return 0;
    const d = new Date();
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    return seed % aggregatedTricks.length;
  }, [aggregatedTricks, todayStr]);

  const [currentTrickIndex, setCurrentTrickIndex] = useState<number>(todayTrickIndex);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // User streak & completion state in localStorage
  const [streak, setStreak] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('thanaweya_daily_streak') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [lastCompletedDate, setLastCompletedDate] = useState<string>(() => {
    try {
      return localStorage.getItem('thanaweya_daily_last_date') || '';
    } catch {
      return '';
    }
  });

  // Countdown timer to midnight
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = Math.max(0, midnight.getTime() - now.getTime());

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeTrickItem = aggregatedTricks[currentTrickIndex] || aggregatedTricks[0];
  const isTodayChallenge = currentTrickIndex === todayTrickIndex;
  const isCompletedToday = lastCompletedDate === todayStr && isTodayChallenge;

  const handleSelectOption = (opt: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted) return;
    setSelectedOption(opt);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isSubmitted) return;
    setIsSubmitted(true);
    setShowExplanation(true);

    if (activeTrickItem.relatedQuestion && selectedOption === activeTrickItem.relatedQuestion.correctAnswer) {
      if (isTodayChallenge && lastCompletedDate !== todayStr) {
        // Update streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        let newStreak = streak;
        if (lastCompletedDate === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }

        setStreak(newStreak);
        setLastCompletedDate(todayStr);

        try {
          localStorage.setItem('thanaweya_daily_streak', newStreak.toString());
          localStorage.setItem('thanaweya_daily_last_date', todayStr);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const handlePickRandomTrick = () => {
    let nextIdx = Math.floor(Math.random() * aggregatedTricks.length);
    if (nextIdx === currentTrickIndex && aggregatedTricks.length > 1) {
      nextIdx = (nextIdx + 1) % aggregatedTricks.length;
    }
    setCurrentTrickIndex(nextIdx);
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowExplanation(false);
  };

  const handleResetToToday = () => {
    setCurrentTrickIndex(todayTrickIndex);
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowExplanation(false);
  };

  if (!activeTrickItem) return null;

  const { trick, relatedQuestion, lectureArabicTitle, lectureId } = activeTrickItem;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md mb-8 dir-rtl">
      {/* Background Accent Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Header Bar of the Daily Challenge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-4 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                تحدي التريكات اليومي
                {isTodayChallenge && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> اليومي
                  </span>
                )}
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              تريكة عشوائية من المنهج تتجدد تلقائياً كل 24 ساعة لاختبار قوة الملاحظة والاستدلال
            </p>
          </div>
        </div>

        {/* Status Indicators: Timer & Streak */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Daily Streak Badge */}
          <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold text-amber-400 shadow-sm">
            <Flame className="w-4 h-4 text-amber-500 animate-bounce" />
            <span>السلسلة: {streak} أيام</span>
          </div>

          {/* 24h Countdown Timer */}
          <div className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-mono text-emerald-400 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Challenge Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Left Column: Trick Concept & Misconceptions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                {lectureArabicTitle}
              </span>
              <button
                onClick={() => onNavigateToLecture(lectureId, 'tricks')}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 underline font-sans cursor-pointer"
              >
                فتح الفصل <ChevronLeft className="w-3 h-3" />
              </button>
            </div>

            <h4 className="text-sm font-bold text-white leading-snug">
              ⚡ {trick.title}
            </h4>

            {trick.crossChapterLink && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-xs text-amber-300 font-sans leading-relaxed">
                <strong className="block text-[10px] uppercase text-amber-400 font-bold mb-1">🔗 رابط بين الفصول:</strong>
                {trick.crossChapterLink}
              </div>
            )}

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {trick.coreConcept}
            </p>

            {trick.misconceptions && trick.misconceptions.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
                <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                  ⚠️ المفاهيم المغلوطة الحتمية:
                </span>
                {trick.misconceptions.slice(0, 2).map((misc, idx) => (
                  <div key={idx} className="text-[11px] text-slate-400 font-sans border-r-2 border-rose-500/50 pr-2">
                    <span className="text-slate-300 font-semibold">{misc.termA}</span> مقابل <span className="text-slate-300 font-semibold">{misc.termB}</span>
                    <p className="text-slate-400 text-[10px] mt-0.5">{misc.difference}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Daily Question */}
        <div className="lg:col-span-2 space-y-4">
          {relatedQuestion ? (
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  سؤال التطبيق السريع على التريكة:
                </span>
                {relatedQuestion.sourceYear && (
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
                    {relatedQuestion.sourceYear}
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-white leading-relaxed font-sans">
                {relatedQuestion.questionText}
              </p>

              {/* 4 Answer Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 font-sans">
                {(['A', 'B', 'C', 'D'] as const).map(key => {
                  const optionText = relatedQuestion.options[key];
                  const isSelected = selectedOption === key;
                  const isCorrectKey = key === relatedQuestion.correctAnswer;

                  let optionStyle = "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700";

                  if (isSubmitted) {
                    if (isCorrectKey) {
                      optionStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold shadow-md";
                    } else if (isSelected && !isCorrectKey) {
                      optionStyle = "bg-rose-500/20 border-rose-500 text-rose-200 font-bold";
                    } else {
                      optionStyle = "bg-slate-900/50 border-slate-850 text-slate-500 opacity-60";
                    }
                  } else if (isSelected) {
                    optionStyle = "bg-amber-500/15 border-amber-500 text-amber-200 font-bold shadow-md";
                  }

                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectOption(key)}
                      disabled={isSubmitted}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-3 text-xs leading-relaxed ${optionStyle}`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSubmitted && isCorrectKey
                          ? 'bg-emerald-500 text-slate-950'
                          : isSubmitted && isSelected && !isCorrectKey
                          ? 'bg-rose-500 text-white'
                          : isSelected
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {key}
                      </span>
                      <span className="flex-1">{optionText}</span>
                      {isSubmitted && isCorrectKey && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {isSubmitted && isSelected && !isCorrectKey && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {!isSubmitted ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedOption}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-lg ${
                      selectedOption 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    تأكيد الإجابة
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
                      selectedOption === relatedQuestion.correctAnswer
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {selectedOption === relatedQuestion.correctAnswer ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          إجابة صحيحة! أحسنت 🎯
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          إجابة غير دقيقة - راجع التفسير
                        </>
                      )}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {!isTodayChallenge && (
                    <button
                      onClick={handleResetToToday}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
                    >
                      العودة لتحدي اليوم
                    </button>
                  )}

                  <button
                    onClick={handlePickRandomTrick}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>تريكة أخرى عشوائياً</span>
                  </button>
                </div>
              </div>

              {/* Detailed Explanation Box */}
              {isSubmitted && showExplanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2 mt-3 font-sans"
                >
                  <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    الشرح المفصل والإجابة النموذجية:
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {relatedQuestion.explanation.correct}
                  </p>
                </motion.div>
              )}

            </div>
          ) : (
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 text-center text-slate-400 font-sans">
              تطبيق مباشر على تريكة المنهج. اضغط على أزرار التريكات للاستكشاف.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
