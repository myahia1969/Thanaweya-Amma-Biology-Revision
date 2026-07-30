import React, { useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { LectureData } from '../types';

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
  const [selectedLectureId, setSelectedLectureId] = useState<number>(allLectures[0]?.id || 1);
  const [frequencyDays, setFrequencyDays] = useState<number>(3); // default 3 days
  const [notes, setNotes] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

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
        {/* Modal Top Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-sm">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                تنبيهات المذاكرة والمراجعة الدورية
                {dueReminders.length > 0 && (
                  <span className="text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                    {dueReminders.length} مستحق اليوم
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                جدول التكرار المتباعد لتثبيت فصول الأحياء في الذاكرة طويلة المدى
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 font-sans">
          
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
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-md cursor-pointer transition-all"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>مراجعة الآن</span>
                      </button>

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
            <div className="flex justify-between items-center text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                جدول التنبيهات القادمة ({upcomingReminders.length})
              </span>
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
                    className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex justify-between items-center gap-3 transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{rem.lectureTitle}</h4>
                      {rem.notes && <p className="text-[11px] text-slate-400 mt-0.5">📝 {rem.notes}</p>}
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                        <span>الموعد القادم: <strong className="text-emerald-400">{rem.nextReviewDate}</strong></span>
                        <span>• التكرار: كل {rem.frequencyDays} أيام</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onStartReviewLecture(rem.lectureId, 'concepts');
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

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-center text-xs text-slate-400">
          تذكر دائماً: المراجعة المتباعدة المنتظمة ترفع معدل تذكر أسئلة النظام الحديث بنسبة 85%!
        </div>
      </motion.div>
    </div>
  );
};
