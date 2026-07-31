import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  BellRing, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  BookOpen, 
  X, 
  AlertCircle, 
  Sparkles,
  RotateCcw,
  Check,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  Square,
  Flame,
  Zap,
  ShieldAlert,
  Timer,
  AlarmClock,
  ExternalLink,
  Download
} from 'lucide-react';
import { LectureData } from '../types';
import { playLoudAlarmSound, stopLoudAlarmSound, AlarmToneType } from '../utils/alarmSound';

export interface StudyReminder {
  id: string;
  lectureId: number;
  lectureTitle: string;
  frequencyDays: number;
  nextReviewDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
  lastReviewedAt?: string;
}

export const createGoogleCalendarUrl = (reminder: StudyReminder, alarmTime: string = '17:00') => {
  const dateParts = reminder.nextReviewDate.split('-').map(Number);
  const timeParts = (alarmTime || '17:00').split(':').map(Number);

  const year = dateParts[0] || 2026;
  const month = (dateParts[1] || 1) - 1;
  const day = dateParts[2] || 1;
  const hour = timeParts[0] || 17;
  const minute = timeParts[1] || 0;

  const startDate = new Date(year, month, day, hour, minute);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

  const formatIsoUtc = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startIso = formatIsoUtc(startDate);
  const endIso = formatIsoUtc(endDate);

  const title = `📅 مراجعة أحياء: ${reminder.lectureTitle}`;
  const details = `تنبيه مراجعة مادة الأحياء للثانوية العامة (النظام الجديد)\n\n📖 الفصل: ${reminder.lectureTitle}\n🔄 دورية المراجعة: كل ${reminder.frequencyDays} أيام\n📝 ملاحظات الطالب: ${reminder.notes || 'لا يوجد ملاحظات إضافية'}\n\n💡 تذكر: الاستمرارية والمراجعة المنظمة طريقك للـ 60/60!`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startIso}/${endIso}&details=${encodeURIComponent(details)}`;
};

export const downloadIcsCalendarFile = (reminder: StudyReminder, alarmTime: string = '17:00') => {
  const dateParts = reminder.nextReviewDate.split('-').map(Number);
  const timeParts = (alarmTime || '17:00').split(':').map(Number);

  const year = dateParts[0] || 2026;
  const month = (dateParts[1] || 1) - 1;
  const day = dateParts[2] || 1;
  const hour = timeParts[0] || 17;
  const minute = timeParts[1] || 0;

  const startDate = new Date(year, month, day, hour, minute);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatIsoUtc = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startIso = formatIsoUtc(startDate);
  const endIso = formatIsoUtc(endDate);

  const title = `مراجعة أحياء: ${reminder.lectureTitle}`;
  const details = `مراجعة الأحياء - ${reminder.lectureTitle}. ${reminder.notes || ''}`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Thanaweya Amma Biology Revision//AR',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DESCRIPTION:${details}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `study-reminder-lecture-${reminder.lectureId}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

interface StudyRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  allLectures: LectureData[];
  onStartReviewLecture: (lectureId: number, tab?: string) => void;
  reminders: StudyReminder[];
  onSaveReminders: (updated: StudyReminder[]) => void;
}

export const StudyRemindersModal: React.FC<StudyRemindersModalProps> = ({
  isOpen,
  onClose,
  allLectures,
  onStartReviewLecture,
  reminders,
  onSaveReminders
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'alarm_timer' | 'schedule_list'>('alarm_timer');

  // Alarm Sound Settings
  const [selectedTone, setSelectedTone] = useState<AlarmToneType>('siren');
  const [volume, setVolume] = useState<number>(0.9);
  const [isPlayingTestSound, setIsPlayingTestSound] = useState<boolean>(false);
  const [isAlarmRinging, setIsAlarmRinging] = useState<boolean>(false);

  // Countdown Timer State
  const [timerPresetMinutes, setTimerPresetMinutes] = useState<number>(25);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Daily Scheduled Alarm Clock State
  const [scheduledAlarmTime, setScheduledAlarmTime] = useState<string>('17:00'); // 5:00 PM
  const [isScheduledAlarmActive, setIsScheduledAlarmActive] = useState<boolean>(false);
  const [lastRungMinute, setLastRungMinute] = useState<string>('');

  // Reminder list state
  const [selectedLectureId, setSelectedLectureId] = useState<number>(allLectures[0]?.id || 1);
  const [frequencyDays, setFrequencyDays] = useState<number>(3); // default 3 days
  const [notes, setNotes] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timeLeftSeconds > 0) {
      interval = setInterval(() => {
        setTimeLeftSeconds(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            triggerLoudAlarm('🚨 انتهى وقت المؤقت! حان موعد بدء المذاكرة والمراجعة الآن!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeLeftSeconds]);

  // Scheduled Alarm Clock Check Effect
  useEffect(() => {
    const clockInterval = setInterval(() => {
      if (isScheduledAlarmActive && scheduledAlarmTime) {
        const now = new Date();
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        if (currentHHMM === scheduledAlarmTime && lastRungMinute !== currentHHMM) {
          setLastRungMinute(currentHHMM);
          triggerLoudAlarm(`⏰ حان الموعد اليومي المكتوب (${scheduledAlarmTime}) لبدء وقت المذاكرة!`);
        }
      }
    }, 5000);

    return () => clearInterval(clockInterval);
  }, [isScheduledAlarmActive, scheduledAlarmTime, lastRungMinute]);

  const triggerLoudAlarm = (message: string) => {
    setIsAlarmRinging(true);
    playLoudAlarmSound(selectedTone, volume, 12);
  };

  const stopAlarmRing = () => {
    stopLoudAlarmSound();
    setIsAlarmRinging(false);
    setIsPlayingTestSound(false);
  };

  const handleToggleTestSound = () => {
    if (isPlayingTestSound || isAlarmRinging) {
      stopAlarmRing();
    } else {
      setIsPlayingTestSound(true);
      playLoudAlarmSound(selectedTone, volume, 5);
      setTimeout(() => {
        setIsPlayingTestSound(false);
      }, 5000);
    }
  };

  const handleStartTimer = (minutes: number) => {
    setTimerPresetMinutes(minutes);
    setTimeLeftSeconds(minutes * 60);
    setIsTimerRunning(true);
    stopAlarmRing();
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeftSeconds(timerPresetMinutes * 60);
    stopAlarmRing();
  };

  const formatMMSS = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Helper to format date YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const todayStr = formatDate(new Date());

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const lecture = allLectures.find(l => l.id === selectedLectureId) || allLectures[0];
    
    // Calculate next review date = today + frequencyDays
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + frequencyDays);

    const newReminder: StudyReminder = {
      id: `rem-${Date.now()}`,
      lectureId: lecture.id,
      lectureTitle: lecture.arabicTitle,
      frequencyDays,
      nextReviewDate: formatDate(nextDate),
      notes: notes.trim() || undefined,
      createdAt: todayStr
    };

    const updated = [newReminder, ...reminders];
    onSaveReminders(updated);
    setNotes('');
    setIsAddingNew(false);
  };

  const handleDeleteReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    onSaveReminders(updated);
  };

  const handleMarkAsReviewed = (id: string) => {
    const updated = reminders.map(r => {
      if (r.id === id) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + r.frequencyDays);
        return {
          ...r,
          lastReviewedAt: todayStr,
          nextReviewDate: formatDate(nextDate)
        };
      }
      return r;
    });
    onSaveReminders(updated);
  };

  const handleSnoozeOneDay = (id: string) => {
    const updated = reminders.map(r => {
      if (r.id === id) {
        const curr = new Date(r.nextReviewDate);
        curr.setDate(curr.getDate() + 1);
        return {
          ...r,
          nextReviewDate: formatDate(curr)
        };
      }
      return r;
    });
    onSaveReminders(updated);
  };

  if (!isOpen) return null;

  // Filter due reminders
  const dueReminders = reminders.filter(r => r.nextReviewDate <= todayStr);
  const upcomingReminders = reminders.filter(r => r.nextReviewDate > todayStr);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md dir-rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
      >
        {/* Ringing Banner Warning if Alarm Active */}
        {isAlarmRinging && (
          <div className="bg-rose-600 text-white px-5 py-3 flex items-center justify-between animate-bounce shadow-xl border-b border-rose-700 z-20">
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
              <AlarmClock className="w-5 h-5 animate-spin" />
              <span>🚨 المنبه الصوتي العالي يعمل الآن! حان وقت بداية جلسة المذاكرة!</span>
            </div>
            <button
              onClick={stopAlarmRing}
              className="bg-white text-rose-700 hover:bg-slate-100 font-bold px-3 py-1 rounded-lg text-xs cursor-pointer shadow-md"
            >
              إيقاف المنبه ⏹️
            </button>
          </div>
        )}

        {/* Modal Top Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-sm">
              <BellRing className={`w-5 h-5 ${isTimerRunning ? 'animate-pulse text-amber-400' : 'text-rose-400'}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                منبه ومؤقت المذاكرة بصوت عالي
                {dueReminders.length > 0 && (
                  <span className="text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                    {dueReminders.length} مستحق اليوم
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                ضبط التنبيهات الصوتية المرتفعة ومؤقت المذاكرة للالتزام بالجدول التكراري
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopAlarmRing();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tab Nav Bar */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-6 py-2 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveSubTab('alarm_timer')}
            className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'alarm_timer'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <AlarmClock className="w-4 h-4 text-rose-400" />
            <span>🔊 المنبه الصوتي والمؤقت</span>
          </button>

          <button
            onClick={() => setActiveSubTab('schedule_list')}
            className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'schedule_list'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>📅 جدول التكرار المتباعد ({reminders.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 font-sans">
          
          {activeSubTab === 'alarm_timer' ? (
            <div className="space-y-6">
              {/* Main Timer Display Section */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 text-center space-y-4 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-300">
                  <Timer className="w-4 h-4 text-rose-400" />
                  <span>مؤقت جلسة المذاكرة النشط</span>
                </div>

                {/* Big Digital Clock Counter */}
                <div className="py-2">
                  <span className={`font-mono text-5xl md:text-6xl font-black tracking-wider transition-all ${
                    isTimerRunning ? 'text-amber-400 animate-pulse' : 'text-white'
                  }`}>
                    {formatMMSS(timeLeftSeconds)}
                  </span>
                  <span className="block text-xs text-slate-500 mt-2 font-mono">
                    {isTimerRunning ? '⏱️ العداد يعمل الآن...' : 'متوقف - اضغط "بدء" أو اختر مدة زمنية'}
                  </span>
                </div>

                {/* Preset Duration Buttons */}
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {[15, 25, 45, 60].map(mins => (
                    <button
                      key={mins}
                      onClick={() => handleStartTimer(mins)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        timerPresetMinutes === mins && isTimerRunning
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg scale-105'
                          : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
                      }`}
                    >
                      {mins} دقيقة {mins === 25 ? '(بومودورو)' : ''}
                    </button>
                  ))}
                </div>

                {/* Timer Action Controls */}
                <div className="flex justify-center items-center gap-3 pt-2">
                  {!isTimerRunning ? (
                    <button
                      onClick={() => setIsTimerRunning(true)}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>تشغيل العداد 🚀</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsTimerRunning(false)}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-lg cursor-pointer transition-all"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>إيقاف مؤقت ⏸️</span>
                    </button>
                  )}

                  <button
                    onClick={handleResetTimer}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إعادة ضبط</span>
                  </button>
                </div>
              </div>

              {/* Loud Sound Settings & Audio Synthesizer Controls */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-rose-400" />
                    <span>إعدادات نغمة المنبه العالي (Web Audio Sound API)</span>
                  </h4>

                  <button
                    onClick={handleToggleTestSound}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isPlayingTestSound || isAlarmRinging
                        ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                        : 'bg-slate-900 hover:bg-slate-850 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {isPlayingTestSound || isAlarmRinging ? (
                      <>
                        <VolumeX className="w-4 h-4" />
                        <span>إيقاف الصوت التجريبي ⏹️</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-rose-400" />
                        <span>🔊 تجربة المنبه العالي الآن</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Alarm Tone Chooser */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">نوع نغمة المنبه الصوتي:</label>
                    <select
                      value={selectedTone}
                      onChange={(e) => {
                        setSelectedTone(e.target.value as AlarmToneType);
                        stopAlarmRing();
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                    >
                      <option value="siren">🚨 صفارة إنذار عالية التردد (High Siren)</option>
                      <option value="bell">🔔 جرس مدرسة حاد المتكرر (School Bell)</option>
                      <option value="digital">⚡ منبه رقمي إلكتروني سريع (Digital Beep)</option>
                      <option value="chime">🎵 نغمة تنبيه رنانة تصاعدية (Chime)</option>
                    </select>
                  </div>

                  {/* Volume Controller */}
                  <div>
                    <div className="flex justify-between text-slate-300 font-semibold mb-1">
                      <span>مستوى شدة الصوت:</span>
                      <span className="font-mono text-rose-400 font-bold">{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="1.0"
                      step="0.05"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Scheduled Daily Clock Alarm */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <AlarmClock className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white">منبه المذاكرة اليومي في وقت محدد</h4>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isScheduledAlarmActive}
                      onChange={(e) => setIsScheduledAlarmActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                {isScheduledAlarmActive && (
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-4 text-xs">
                    <span className="text-slate-300">حدد ساعة بدء المذاكرة اليومية:</span>
                    <input
                      type="time"
                      value={scheduledAlarmTime}
                      onChange={(e) => setScheduledAlarmTime(e.target.value)}
                      className="bg-slate-950 text-amber-400 font-mono font-bold border border-slate-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick Add Toggle Button */}
              {!isAddingNew ? (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة تنبيه مراجعة جديد لفصل معين</span>
                </button>
              ) : (
                <form onSubmit={handleCreateReminder} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> ضبط مواعيد مراجعة الفصل
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      إلغاء
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-300 font-semibold mb-1">اختر الفصل للمراجعة:</label>
                      <select
                        value={selectedLectureId}
                        onChange={(e) => setSelectedLectureId(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {allLectures.map(l => (
                          <option key={l.id} value={l.id}>
                            {l.arabicTitle}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 font-semibold mb-1">تكرار المراجعة (الدورية):</label>
                      <select
                        value={frequencyDays}
                        onChange={(e) => setFrequencyDays(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value={1}>يومياً (كل 24 ساعة)</option>
                        <option value={2}>كل يومين</option>
                        <option value={3}>كل 3 أيام (موصى به لثانوية عامة)</option>
                        <option value={5}>كل 5 أيام</option>
                        <option value={7}>أسبوعياً (كل 7 أيام)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 font-semibold mb-1">ملاحظة شخصية للمراجعة (اختياري):</label>
                    <input
                      type="text"
                      placeholder="مثال: مراجعة قوانين N والقطع العضلية، أو التركيز على مسألة الكودونات"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-all shadow-md"
                    >
                      حفظ التنبيه وإضافته للجدول
                    </button>
                  </div>
                </form>
              )}

              {/* Section 1: Due Reminders Today */}
              {dueReminders.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                    <AlertCircle className="w-4 h-4 animate-bounce" />
                    <span>التنبيهات المستحقة للمراجعة الآن ({dueReminders.length}):</span>
                  </div>

                  <div className="space-y-2">
                    {dueReminders.map(rem => (
                      <div
                        key={rem.id}
                        className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{rem.lectureTitle}</span>
                            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                              مستحق اليوم
                            </span>
                          </div>
                          {rem.notes && (
                            <p className="text-xs text-slate-300 mt-1">📝 {rem.notes}</p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-1">
                            دورية المراجعة: كل {rem.frequencyDays} أيام
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              onStartReviewLecture(rem.lectureId, 'concepts');
                              handleMarkAsReviewed(rem.id);
                              stopAlarmRing();
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-md cursor-pointer transition-all"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>مراجعة الآن</span>
                          </button>

                          <a
                            href={createGoogleCalendarUrl(rem, scheduledAlarmTime)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 hover:text-white"
                            title="إضافة موعد هذه المراجعة إلى تقويم جوجل في هاتفك"
                          >
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            <span>تقويم جوجل 📅</span>
                            <ExternalLink className="w-3 h-3 text-indigo-400 opacity-80" />
                          </a>

                          <button
                            onClick={() => handleSnoozeOneDay(rem.id)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                            title="تأجيل المراجعة لليوم التالي"
                          >
                            تأجيل +1 يوم
                          </button>

                          <button
                            onClick={() => handleDeleteReminder(rem.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="حذف التنبيه"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Scheduled / Upcoming Reminders */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    جدول التنبيهات القادمة ({upcomingReminders.length})
                  </span>
                  
                  {upcomingReminders.length > 0 && (
                    <span className="text-[10px] font-normal text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      مزامنة التقويم المباشرة مجهزة لهاتفك 📲
                    </span>
                  )}
                </div>

                {upcomingReminders.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4 bg-slate-950/40 rounded-xl border border-slate-850">
                    لا توجد تنبيهات قادمة محددة. اضغط على "إضافة تنبيه مراجعة جديد" لضبط المواعيد!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {upcomingReminders.map(rem => (
                      <div
                        key={rem.id}
                        className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{rem.lectureTitle}</h4>
                          {rem.notes && <p className="text-[11px] text-slate-400 mt-0.5">📝 {rem.notes}</p>}
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 mt-1">
                            <span>الموعد القادم: <strong className="text-emerald-400">{rem.nextReviewDate}</strong></span>
                            <span>• التكرار: كل {rem.frequencyDays} أيام</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={createGoogleCalendarUrl(rem, scheduledAlarmTime)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 hover:text-white shadow-sm"
                            title="إضافة إلى تقويم جوجل (Google Calendar) لمزامنة المراجعة مع الهاتف"
                          >
                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                            <span>إضافة لتقويم جوجل</span>
                            <ExternalLink className="w-3 h-3 text-indigo-400 opacity-80" />
                          </a>

                          <button
                            onClick={() => downloadIcsCalendarFile(rem, scheduledAlarmTime)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
                            title="تنزيل ملف تقويم (.ics) لتطبيقات الهاتف وApple Calendar"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              onStartReviewLecture(rem.lectureId, 'concepts');
                              stopAlarmRing();
                              onClose();
                            }}
                            className="px-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1"
                          >
                            <span>فتح الفصل</span>
                            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                          </button>

                          <button
                            onClick={() => handleDeleteReminder(rem.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="حذف التنبيه"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-center text-xs text-slate-400">
          تذكر دائماً: المنبه الصوتي والمراجعة المنتظمة تضمن لك أقصى درجات الانضباط والتركيز الذهني!
        </div>
      </motion.div>
    </div>
  );
};

