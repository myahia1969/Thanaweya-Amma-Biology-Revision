import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  BellRing,
  Sparkles,
  Coffee,
  CheckCircle2,
  Maximize2,
  Clock,
  ChevronDown,
  X,
  Award
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface PomodoroTimerProps {
  className?: string;
  compact?: boolean;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ className = '', compact = false }) => {
  const { isAr } = useLanguage();

  // Mode: 'focus' (25 min), 'shortBreak' (5 min), 'longBreak' (15 min)
  type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
  const [mode, setMode] = useState<TimerMode>('focus');

  // Time configurations in seconds
  const MODE_TIMES: Record<TimerMode, number> = {
    focus: 25 * 60,      // 25 mins
    shortBreak: 5 * 60,  // 5 mins
    longBreak: 15 * 60   // 15 mins
  };

  const [timeLeft, setTimeLeft] = useState<number>(MODE_TIMES.focus);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    const saved = localStorage.getItem('bio_pomodoro_completed');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Track total active study duration in seconds across all sessions
  const [totalStudySeconds, setTotalStudySeconds] = useState<number>(() => {
    const saved = localStorage.getItem('bio_pomodoro_total_seconds');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [sessionSuccessToast, setSessionSuccessToast] = useState<string | null>(null);

  // Sound Chime Generator using Web Audio API
  const playAudibleChime = () => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Pleasant multi-tone success chime (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);

        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.18 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.18);
        osc.stop(ctx.currentTime + idx * 0.18 + 0.6);
      });
    } catch (err) {
      console.error('Audio chime error:', err);
    }
  };

  // Main countdown timer & total study duration accumulator
  useEffect(() => {
    let timerId: ReturnType<typeof setInterval>;

    if (isRunning && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft(prev => prev - 1);

        // If in focus mode, accumulate total study time
        if (mode === 'focus') {
          setTotalStudySeconds(prev => {
            const updated = prev + 1;
            localStorage.setItem('bio_pomodoro_total_seconds', updated.toString());
            return updated;
          });
        }
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Session Completed!
      setIsRunning(false);
      playAudibleChime();

      if (mode === 'focus') {
        const newCompleted = completedSessions + 1;
        setCompletedSessions(newCompleted);
        localStorage.setItem('bio_pomodoro_completed', newCompleted.toString());

        const msg = isAr 
          ? '🎉 أبدعت! أنهيت جلسة تركيز كاملة لمدة 25 دقيقة. استرح لمدة 5 دقائق الآن.'
          : '🎉 Great job! Completed a 25-minute focus session. Take a 5-minute break now.';
        setSessionSuccessToast(msg);

        // Auto switch to short break
        setMode('shortBreak');
        setTimeLeft(MODE_TIMES.shortBreak);
      } else {
        const msg = isAr 
          ? '🔔 انتهت الاستراحة! جاهز لبدء جلسة استذكار جديدة؟'
          : '🔔 Break ended! Ready to start another focus session?';
        setSessionSuccessToast(msg);

        // Auto switch back to focus
        setMode('focus');
        setTimeLeft(MODE_TIMES.focus);
      }
    }

    return () => clearInterval(timerId);
  }, [isRunning, timeLeft, mode, isMuted, completedSessions, isAr]);

  // Handle mode change manually
  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODE_TIMES[newMode]);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODE_TIMES[mode]);
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format total seconds to readable HH:MM:SS
  const formatTotalStudyTime = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hours > 0) {
      return isAr ? `${hours} ساعة و ${mins} دقيقة` : `${hours}h ${mins}m`;
    }
    return isAr ? `${mins} دقيقة` : `${mins}m ${secs}s`;
  };

  const progressPercentage = Math.round(((MODE_TIMES[mode] - timeLeft) / MODE_TIMES[mode]) * 100);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Toast popup when session finishes */}
      <AnimatePresence>
        {sessionSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border-2 border-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md"
          >
            <BellRing className="w-6 h-6 text-emerald-400 animate-bounce shrink-0" />
            <div className="text-xs font-bold leading-relaxed">{sessionSuccessToast}</div>
            <button
              onClick={() => setSessionSuccessToast(null)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Pill Button */}
      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-900/90 via-slate-950 to-slate-900 border border-slate-700/60 hover:border-emerald-500/50 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-md transition-all">
        {/* Mode Icon */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
          title={isAr ? "فتح عداد التركيز وتفاصيل الاستذكار" : "Open Pomodoro Focus Timer Details"}
        >
          {mode === 'focus' ? (
            <Timer className={`w-3.5 h-3.5 ${isRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
          ) : (
            <Coffee className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
          )}

          {/* Time Display */}
          <span className="font-mono font-black text-emerald-300 tracking-wider text-xs">
            {formatTime(timeLeft)}
          </span>
        </button>

        {/* Play/Pause toggle */}
        <button
          onClick={toggleTimer}
          className={`p-1 rounded-full transition-all cursor-pointer ${
            isRunning
              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
          }`}
          title={isRunning ? (isAr ? "إيقاف مؤقت" : "Pause") : (isAr ? "تشغيل مؤقت التركيز" : "Start Focus Timer")}
        >
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 translate-x-[0.5px]" />}
        </button>

        {/* Total Duration Badge */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 border-r border-slate-700/80 pr-2 mr-0.5"
          title={isAr ? "إجمالي وقت الاستذكار في هذه الجلسة" : "Total Study Time in Current Session"}
        >
          <Clock className="w-3 h-3 text-indigo-400" />
          <span className="font-mono font-semibold">{formatTotalStudyTime(totalStudySeconds)}</span>
        </button>

        {/* Audio Chime Mute/Unmute */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
          title={isMuted ? (isAr ? "تشغيل التنبيه الصوتي" : "Unmute Sound Chime") : (isAr ? "كتم التنبيه الصوتي" : "Mute Sound Chime")}
        >
          {isMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
        </button>
      </div>

      {/* Expandable Detail Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl text-white space-y-6 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Timer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white">
                      {isAr ? 'مؤقت التركيز الذكي (Pomodoro)' : 'Smart Focus Pomodoro'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isAr ? 'تقنية بومودورو لزيادة الاستيعاب ومنع الإجهاد' : 'Maximize focus with interval study sessions'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => switchMode('focus')}
                  className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'focus'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تركيز 25د' : 'Focus 25m'}</span>
                </button>

                <button
                  onClick={() => switchMode('shortBreak')}
                  className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'shortBreak'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>{isAr ? 'استراحة 5د' : 'Break 5m'}</span>
                </button>

                <button
                  onClick={() => switchMode('longBreak')}
                  className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'longBreak'
                      ? 'bg-indigo-500 text-slate-950 font-black shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طويلة 15د' : 'Long 15m'}</span>
                </button>
              </div>

              {/* Main Circular Counter Display */}
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <div className="relative flex items-center justify-center">
                  <svg width="180" height="180" className="transform -rotate-90">
                    <circle
                      cx="90"
                      cy="90"
                      r="75"
                      className="stroke-slate-800"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <motion.circle
                      cx="90"
                      cy="90"
                      r="75"
                      className={
                        mode === 'focus'
                          ? 'stroke-emerald-400'
                          : mode === 'shortBreak'
                          ? 'stroke-amber-400'
                          : 'stroke-indigo-400'
                      }
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 75}
                      strokeDashoffset={2 * Math.PI * 75 * (1 - progressPercentage / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                      transition={{ duration: 0.5 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-mono font-black text-4xl text-white tracking-tight">
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">
                      {mode === 'focus' ? (isAr ? 'جلسة تركيز' : 'Focus Session') : (isAr ? 'استراحة راحة' : 'Rest Break')}
                    </span>
                  </div>
                </div>

                {/* Primary Action Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleTimer}
                    className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl transition-all cursor-pointer ${
                      isRunning
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>{isAr ? 'إيقاف مؤقت' : 'Pause'}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>{isAr ? 'بدء التركيز' : 'Start Focus'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={resetTimer}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all cursor-pointer border border-slate-700"
                    title={isAr ? "إعادة ضبط المؤقت" : "Reset Timer"}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Statistics & Session Tracker */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{isAr ? 'الجلسات المكتملة' : 'Sessions Done'}</span>
                    <span className="font-mono font-black text-base text-amber-300">{completedSessions} {isAr ? 'جلسات' : 'sessions'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{isAr ? 'إجمالي وقت المذاكرة' : 'Total Study Time'}</span>
                    <span className="font-mono font-black text-base text-indigo-300">{formatTotalStudyTime(totalStudySeconds)}</span>
                  </div>
                </div>
              </div>

              {/* Audible Chime Setting */}
              <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-slate-300">{isAr ? 'تنبيه جرس نهاية الـ 25 دقيقة (Audio Chime)' : '25-Min Session Complete Chime'}</span>
                </div>
                <button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    if (isMuted) playAudibleChime();
                  }}
                  className={`px-3 py-1 rounded-lg font-extrabold transition-all cursor-pointer border ${
                    !isMuted
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {!isMuted ? (isAr ? 'مُفعّل 🔔' : 'Enabled 🔔') : (isAr ? 'صامت 🔇' : 'Muted 🔇')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
