import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  BookOpen, 
  Sparkles, 
  Brain, 
  Filter, 
  Search, 
  Trash2, 
  Play, 
  Lightbulb, 
  HelpCircle, 
  Award, 
  ArrowRight, 
  Layers,
  Flame,
  Check,
  RefreshCw,
  Clock,
  Zap
} from 'lucide-react';
import { MCQQuestion, LectureData, MistakeItem } from '../types';
import { 
  getMistakeBank, 
  saveMistakeBank, 
  markMistakeAsMastered, 
  DEFAULT_DEMO_MISTAKES 
} from '../utils/mistakeBankUtils';

interface MistakeBankToolProps {
  allLectures: LectureData[];
  onToast?: (msg: string) => void;
}

export function MistakeBankTool({ allLectures, onToast }: MistakeBankToolProps) {
  // Main list state from localStorage
  const [mistakes, setMistakes] = useState<MistakeItem[]>(() => {
    const saved = getMistakeBank();
    if (saved.length > 0) return saved;
    // If empty initially, auto load demo mistakes so user immediately sees value
    return DEFAULT_DEMO_MISTAKES();
  });

  // Active sub view: 'list' | 'retake_quiz' | 'mastered_list'
  const [activeView, setActiveView] = useState<'list' | 'retake_quiz'>('list');

  // Filters
  const [selectedLectureFilter, setSelectedLectureFilter] = useState<'all' | number>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unmastered' | 'mastered'>('unmastered');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Retake Quiz Engine state
  const [quizQuestions, setQuizQuestions] = useState<MistakeItem[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [retakeSessionStats, setRetakeSessionStats] = useState<{
    correctThisSession: number;
    totalAttempted: number;
  }>({ correctThisSession: 0, totalAttempted: 0 });

  // Sync to localStorage on state change
  useEffect(() => {
    saveMistakeBank(mistakes);
  }, [mistakes]);

  // Calculated Metrics
  const metrics = useMemo(() => {
    const total = mistakes.length;
    const masteredCount = mistakes.filter(m => m.mastered).length;
    const unmasteredCount = total - masteredCount;
    const masteryRate = total > 0 ? Math.round((masteredCount / total) * 100) : 0;

    return {
      total,
      masteredCount,
      unmasteredCount,
      masteryRate
    };
  }, [mistakes]);

  // Filtered mistakes list
  const filteredMistakes = useMemo(() => {
    return mistakes.filter(item => {
      // Lecture filter
      if (selectedLectureFilter !== 'all' && item.lectureId !== selectedLectureFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'unmastered' && item.mastered) return false;
      if (statusFilter === 'mastered' && !item.mastered) return false;

      // Search query
      if (searchQuery.trim()) {
        const qText = item.question.questionText.toLowerCase();
        const lTitle = item.lectureTitle.toLowerCase();
        const term = searchQuery.toLowerCase();
        return qText.includes(term) || lTitle.includes(term);
      }

      return true;
    });
  }, [mistakes, selectedLectureFilter, statusFilter, searchQuery]);

  // Action: Toggle Mastered Status manually
  const handleToggleMastered = (id: string) => {
    setMistakes(prev => {
      const updated = prev.map(m => {
        if (m.id === id) {
          const nextState = !m.mastered;
          if (onToast) {
            onToast(nextState ? '🎉 تم تعليم المفهوم كـ "مُصحح ومُتقن"!' : '🔄 تم إعادة المفهوم لحالة "بحاجة لمراجعة".');
          }
          return { ...m, mastered: nextState };
        }
        return m;
      });
      return updated;
    });
  };

  // Action: Delete Single Mistake
  const handleDeleteMistake = (id: string) => {
    setMistakes(prev => prev.filter(m => m.id !== id));
    if (onToast) onToast('🗑️ تم إزالة السؤال من بنك الأخطاء.');
  };

  // Action: Clear All Mistakes
  const handleClearAll = () => {
    if (window.confirm('هل أنت متأكد من مسح جميع الأسئلة والأخطاء المسجلة؟')) {
      setMistakes([]);
      saveMistakeBank([]);
      if (onToast) onToast('🧹 تم تفريغ بنك الأخطاء بالكامل.');
    }
  };

  // Action: Load Demo Mistakes
  const handleLoadDemo = () => {
    const demo = DEFAULT_DEMO_MISTAKES();
    setMistakes(demo);
    saveMistakeBank(demo);
    if (onToast) onToast('✨ تم تحميل الأسئلة النموذجية الشائعة الأخطاء بنجاح.');
  };

  // Start Retake Quiz Session for unmastered mistakes
  const handleStartRetakeQuiz = () => {
    const unmasteredPool = mistakes.filter(m => !m.mastered);
    if (unmasteredPool.length === 0) {
      if (onToast) onToast('🌟 أحسنت! لا توجد أخطاء غير مُتقنة حالياً لإعادة اختبارها.');
      return;
    }

    // Shuffle pool
    const shuffled = [...unmasteredPool].sort(() => 0.5 - Math.random());
    setQuizQuestions(shuffled);
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setRetakeSessionStats({ correctThisSession: 0, totalAttempted: 0 });
    setActiveView('retake_quiz');
  };

  // Action: Quick Retry - launches an instant quiz session containing questions in mistake bank
  const handleQuickRetry = (onlyFiltered: boolean = false) => {
    const candidatePool = onlyFiltered && filteredMistakes.length > 0 ? filteredMistakes : mistakes;
    if (candidatePool.length === 0) {
      if (onToast) onToast('⚠️ لا توجد أسئلة حالياً في بنك الأخطاء لبدء الإعادة السريعة.');
      return;
    }

    // Shuffle questions
    const shuffled = [...candidatePool].sort(() => 0.5 - Math.random());
    setQuizQuestions(shuffled);
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setRetakeSessionStats({ correctThisSession: 0, totalAttempted: 0 });
    setActiveView('retake_quiz');

    if (onToast) {
      onToast(`⚡ تم إطلاق "الإعادة السريعة" (Quick Retry) لـ ${shuffled.length} أسئلة أخطاء!`);
    }
  };

  // Submit Answer in Retake Quiz
  const handleSubmitRetakeAnswer = (optKey: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(optKey);
    setIsAnswerSubmitted(true);

    const activeMistake = quizQuestions[currentQuizIndex];
    const isCorrect = optKey === activeMistake.question.correctAnswer;

    setRetakeSessionStats(prev => ({
      correctThisSession: prev.correctThisSession + (isCorrect ? 1 : 0),
      totalAttempted: prev.totalAttempted + 1
    }));

    if (isCorrect) {
      // Auto mark as mastered in global state!
      markMistakeAsMastered(activeMistake.id);
      setMistakes(prev => prev.map(m => m.id === activeMistake.id ? { ...m, mastered: true } : m));
      if (onToast) onToast('✨ رائع جداً! تم تصحيح المفهوم وتثبيته في بنك الأخطاء.');
    }
  };

  // Next Question in Retake Quiz
  const handleNextRetakeQuestion = () => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
    } else {
      // Quiz finished
      setActiveView('list');
      if (onToast) onToast(`🏁 اكتملت جلسة مراجعة الأخطاء! صححت ${retakeSessionStats.correctThisSession} مفهوماً.`);
    }
  };

  const activeQuizMistake = quizQuestions[currentQuizIndex];

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">بنك الأخطاء وتصحيح المفاهيم (Mistake Bank)</h3>
              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                {metrics.unmasteredCount} أسئلة تحتاج مراجعة
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              مكان مخصص يجمع كل الأسئلة التي تعثرت فيها سابقاً، لإعادة حلها وفهم أسباب الخطأ وتحويل نقاط الضعف إلى إتقان تـام.
            </p>
          </div>
        </div>

        {/* TOP VIEW SWITCHER */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-850 shrink-0">
          <button
            onClick={() => setActiveView('list')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'list'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>قائمة الأخطاء ({filteredMistakes.length})</span>
          </button>

          <button
            onClick={() => handleQuickRetry(false)}
            className="bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold px-3.5 py-2 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 transform hover:scale-[1.02]"
            title="إعادة سريعة فورية لجميع الأسئلة المسجلة في بنك الأخطاء"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-slate-950" />
            <span>إعادة سريعة فورية (Quick Retry) ⚡</span>
          </button>

          <button
            onClick={handleStartRetakeQuiz}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'retake_quiz'
                ? 'bg-gradient-to-l from-emerald-500 to-teal-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/20'
                : 'text-emerald-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>اختبار المفاهيم غير المُتقنة</span>
          </button>
        </div>
      </div>

      {/* METRICS & PROGRESS STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">إجمالي الأخطاء المسجلة</span>
            <span className="text-lg font-extrabold text-white font-mono">{metrics.total} سؤالاً</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">بحاجة لمراجعة وتثبيت</span>
            <span className="text-lg font-extrabold text-amber-400 font-mono">{metrics.unmasteredCount} سؤالاً</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">تم تصحيح المفهوم</span>
            <span className="text-lg font-extrabold text-emerald-400 font-mono">{metrics.masteredCount} مفاهيم</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-slate-400 font-bold block">نسبة الإتقان والتصحيح</span>
            <span className="text-lg font-extrabold text-indigo-300 font-mono">{metrics.masteryRate}%</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: BROWSE & REVIEW MISTAKES */}
      {activeView === 'list' && (
        <div className="space-y-5">
          {/* SEARCH & FILTER CONTROLS BAR */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في نص السؤال أو المفهوم..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pr-9 pl-4 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500 font-bold"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Filter by Lecture */}
              <select
                value={selectedLectureFilter}
                onChange={(e) => setSelectedLectureFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none"
              >
                <option value="all">جميع الفصول ({allLectures.length})</option>
                {allLectures.map(lec => (
                  <option key={lec.id} value={lec.id}>{lec.arabicTitle}</option>
                ))}
              </select>

              {/* Filter by Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none"
              >
                <option value="unmastered">بحاجة لمراجعة ({metrics.unmasteredCount})</option>
                <option value="mastered">تم تصحيح المفهوم ({metrics.masteredCount})</option>
                <option value="all">جميع الحالات ({metrics.total})</option>
              </select>

              {/* Secondary Actions */}
              {filteredMistakes.length > 0 && (
                <button
                  onClick={() => handleQuickRetry(true)}
                  className="bg-gradient-to-l from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                  title="إعادة سريعة فورية للأسئلة المفلترة حالياً"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
                  <span>إعادة سريعة للمفلترة ({filteredMistakes.length}) ⚡</span>
                </button>
              )}

              {mistakes.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تفريغ البنك</span>
                </button>
              )}
            </div>
          </div>

          {/* EMPTY STATE */}
          {filteredMistakes.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center space-y-4 max-w-xl mx-auto"
            >
              <div className="w-16 h-16 rounded-full bg-slate-800/80 text-amber-400 flex items-center justify-center mx-auto border border-slate-700">
                <Brain className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">لا توجد أسئلة مسجلة في هذا الفلتر</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  عندما تُخطئ في أي سؤال أثناء ممارسة بنك الأسئلة أو اختبار السرعة، سينحفظ السؤال هنا تلقائياً لتقوم بمراجعته لاحقاً.
                </p>
              </div>

              {mistakes.length === 0 && (
                <button
                  onClick={handleLoadDemo}
                  className="bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold px-6 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 mx-auto cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>تحميل أسئلة نموذجية شائعة الأخطاء للمراجعة</span>
                </button>
              )}
            </motion.div>
          )}

          {/* MISTAKE CARDS GRID */}
          <div className="space-y-4">
            {filteredMistakes.map((item, idx) => {
              const q = item.question;
              return (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`bg-slate-900/50 border rounded-xl p-5 shadow-xl backdrop-blur-sm space-y-4 relative overflow-hidden transition-all ${
                    item.mastered 
                      ? 'border-emerald-500/40 bg-slate-950/40' 
                      : 'border-rose-500/30 hover:border-rose-500/60'
                  }`}
                >
                  {/* Top Card Badge Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-950 text-slate-300 border border-slate-800 text-[10px] px-2.5 py-0.5 rounded-md font-bold">
                        {item.lectureTitle}
                      </span>
                      {q.sourceYear && (
                        <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] px-2 py-0.5 rounded font-mono">
                          {q.sourceYear}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleMastered(item.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          item.mastered
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.mastered ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>تم تصحيح المفهوم ✅</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                            <span>تعيين كـ "تم التصحيح"</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteMistake(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                        title="حذف هذا الخطأ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white leading-relaxed">
                      س{idx + 1}: {q.questionText}
                    </h4>
                  </div>

                  {/* Options Comparison Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(q.options).map(([key, optText]) => {
                      const isCorrect = key === q.correctAnswer;
                      const isWrongChosen = key === item.wrongAnswerChosen;

                      let style = 'bg-slate-950/40 border-slate-850 text-slate-400';
                      let icon = null;

                      if (isCorrect) {
                        style = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold';
                        icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
                      } else if (isWrongChosen) {
                        style = 'bg-rose-950/40 border-rose-500/50 text-rose-300 line-through opacity-80';
                        icon = <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
                      }

                      return (
                        <div
                          key={key}
                          className={`p-3 rounded-xl border flex items-start gap-2.5 ${style}`}
                        >
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold shrink-0 ${
                            isCorrect ? 'bg-emerald-500 text-slate-950' : isWrongChosen ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {key}
                          </span>
                          <span className="flex-1 leading-relaxed">{optText}</span>
                          {icon}
                        </div>
                      );
                    })}
                  </div>

                  {/* SCIENTIFIC EXPLANATION & CONCEPT CORRECTION BOX */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <Lightbulb className="w-4 h-4" />
                      <span>التفسير العلمي وتصحيح المفهوم الخاطئ:</span>
                    </div>

                    <p className="text-slate-300 leading-relaxed font-medium">
                      {q.explanation.correct}
                    </p>

                    {item.wrongAnswerChosen !== 'timeout' && (
                      <div className="pt-2 border-t border-slate-900 text-slate-400 text-[11px] flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-rose-300">سبب الوقوع في الخطأ ({item.wrongAnswerChosen}): </strong>
                          {item.wrongAnswerChosen === 'A' && q.explanation.incorrectA}
                          {item.wrongAnswerChosen === 'B' && q.explanation.incorrectB}
                          {item.wrongAnswerChosen === 'C' && q.explanation.incorrectC}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: RETAKE QUIZ SESSION (إعادة اختبار وتصحيح المفاهيم) */}
      {activeView === 'retake_quiz' && activeQuizMistake && (
        <motion.div
          key={currentQuizIndex}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-2xl backdrop-blur-sm space-y-6 relative overflow-hidden"
        >
          {/* Header & Retake Progress */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold text-xs px-3 py-1 rounded-lg">
                جلسة التصحيح: سؤال {currentQuizIndex + 1} من {quizQuestions.length}
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {activeQuizMistake.lectureTitle}
              </span>
            </div>

            <button
              onClick={() => setActiveView('list')}
              className="text-xs text-slate-400 hover:text-white border border-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              مغادرة الجلسة
            </button>
          </div>

          {/* Question Box */}
          <div className="bg-slate-950/80 border-r-4 border-emerald-500 rounded-l-xl p-5 border-l border-y border-slate-900 shadow-inner">
            <p className="text-base text-white font-semibold leading-relaxed">
              {activeQuizMistake.question.questionText}
            </p>
          </div>

          {/* Options Grid */}
          <div className="space-y-3">
            {Object.entries(activeQuizMistake.question.options).map(([key, optText]) => {
              const isSelected = selectedAnswer === key;
              const isCorrectAns = activeQuizMistake.question.correctAnswer === key;

              let btnStyle = 'bg-slate-950/40 border-slate-800 text-slate-200 hover:bg-slate-900 hover:border-slate-700';

              if (isAnswerSubmitted) {
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
                  disabled={isAnswerSubmitted}
                  onClick={() => handleSubmitRetakeAnswer(key as any)}
                  className={`w-full text-right p-4 rounded-xl border text-sm transition-all duration-200 flex items-start gap-3 cursor-pointer ${btnStyle}`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5 border shrink-0 ${
                    isAnswerSubmitted
                      ? (isCorrectAns ? 'bg-emerald-500 border-emerald-500 text-slate-950' : isSelected ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500')
                      : 'bg-slate-800 border-slate-700 text-emerald-400'
                  }`}>
                    {key}
                  </span>
                  <span className="flex-1 leading-relaxed">{optText}</span>
                </button>
              );
            })}
          </div>

          {/* Scientific Feedback Banner upon answer */}
          {isAnswerSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-xl border space-y-3 ${
                selectedAnswer === activeQuizMistake.question.correctAnswer
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedAnswer === activeQuizMistake.question.correctAnswer ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                      <span className="font-extrabold text-sm">ممتاز! تم حل السؤال واختيار الإجابة الصحيحة.</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                      <span className="font-extrabold text-sm">إجابة غير دقيقة، الإجابة الصحيحة هي ({activeQuizMistake.question.correctAnswer}).</span>
                    </>
                  )}
                </div>

                <button
                  onClick={handleNextRetakeQuestion}
                  className="bg-white text-slate-950 font-bold px-5 py-2 rounded-xl text-xs hover:bg-slate-200 transition-all cursor-pointer shadow"
                >
                  {currentQuizIndex < quizQuestions.length - 1 ? 'السؤال التالي ←' : 'إنهاء الجلسة 🏁'}
                </button>
              </div>

              {/* Scientific explanation */}
              <div className="text-xs space-y-1 border-t border-slate-800/60 pt-2">
                <span className="font-bold text-amber-300 block">التفسير العلمي للمفهوم:</span>
                <p className="leading-relaxed opacity-95">
                  {activeQuizMistake.question.explanation.correct}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
