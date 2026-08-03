import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Award, 
  RotateCcw, 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  Brain, 
  Sparkles, 
  Timer, 
  Pause, 
  FileCheck2, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  BookOpen, 
  Edit3, 
  Eraser, 
  Printer, 
  HelpCircle,
  Split,
  Maximize2,
  ScanLine,
  Eye,
  PenTool,
  Search
} from 'lucide-react';
import { MCQQuestion, LectureData } from '../types';
import { fallbackQuestions } from '../data/fallbackQuestions';
import { recordMistake } from '../utils/mistakeBankUtils';
import { useLanguage } from '../context/LanguageContext';
import { autoTranslateText } from '../utils/autoTranslator';
import { AnimatedScoreCounter } from './AnimatedScoreCounter';

interface BubbleSheetExamToolProps {
  allLectures: LectureData[];
  onToast?: (msg: string) => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export interface BubbleExamQuestion {
  index: number; // 1 to N
  question: MCQQuestion;
  lectureId: number;
  lectureTitle: string;
}

type ToolType = 'pencil' | 'pen' | 'eraser';

export function BubbleSheetExamTool({ allLectures, onToast }: BubbleSheetExamToolProps) {
  const { isAr, language } = useLanguage();
  // Exam Stage: 'select_preset' | 'exam_active' | 'scanning' | 'results'
  const [examStage, setExamStage] = useState<'select_preset' | 'exam_active' | 'scanning' | 'results'>('select_preset');

  // Exam Config
  const [examTitle, setExamTitle] = useState<string>('امتحان أحياء بابل شيت 2025 - الدور الأول');
  const [questionCount, setQuestionCount] = useState<number>(50);
  const [allocatedTimeMinutes, setAllocatedTimeMinutes] = useState<number>(180); // 3 hours = 180 min
  const [selectedLectureId, setSelectedLectureId] = useState<number | 'all'>('all');
  
  // Student Info Header on Bubble Sheet
  const [studentName, setStudentName] = useState<string>('طالب الثانوية العامة');
  const [seatingNumber, setSeatingNumber] = useState<string>('749201');
  const [formModel, setFormModel] = useState<'أ' | 'ب' | 'ج' | 'د'>('أ');

  // Questions state
  const [questions, setQuestions] = useState<BubbleExamQuestion[]>([]);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(0);

  // Bubble Sheet Shaded Answers Map: { [questionIndex 1..N]: string[] } 
  // e.g. { 1: ['A'], 2: ['B'], 3: ['A', 'C'] } -> array allows tracking double shading / errors!
  const [bubbleAnswers, setBubbleAnswers] = useState<Record<number, string[]>>({});

  // Active Tool: pencil (رصاص), pen (جاف), eraser (ممحاة)
  const [activeTool, setActiveTool] = useState<ToolType>('pencil');

  // View Mode: 'split' (أسئلة + بابل شيت) | 'sheet_only' (ورقة الإجابة فقط) | 'booklet_only' (كراسة الأسئلة فقط)
  const [viewMode, setViewMode] = useState<'split' | 'sheet_only' | 'booklet_only'>('split');

  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number>(180 * 60);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);

  // Scanning animation state
  const [scanProgress, setScanProgress] = useState<number>(0);

  // Filter in result view
  const [resultFilter, setResultFilter] = useState<'all' | 'correct' | 'wrong' | 'double_shaded' | 'unshaded'>('all');

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (examStage === 'exam_active' && !isTimerPaused && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleStartScanning();
            return 0;
          }
          return prev - 1;
        });
        setTimeSpentSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [examStage, isTimerPaused, secondsRemaining]);

  // Generate Questions based on preset or custom
  const startExamWithPreset = (presetType: 'official_50' | 'midterm_25' | 'speed_10' | 'custom', customCount = 50, customTimeMin = 180) => {
    let count = 50;
    let timeMin = 180;
    let title = 'امتحان الأحياء بابل شيت - الثانوية العامة';

    if (presetType === 'official_50') {
      count = 50;
      timeMin = 180;
      title = 'امتحان الأحياء الرسمي البابل شيت 2025 (50 سؤال - 3 ساعات)';
    } else if (presetType === 'midterm_25') {
      count = 25;
      timeMin = 60;
      title = 'اختبار بابل شيت الشفرة الوراثية والدعامة (25 سؤال - ساعة)';
    } else if (presetType === 'speed_10') {
      count = 10;
      timeMin = 15;
      title = 'تدريب تظليل دقيق سريع على البابل شيت (10 أسئلة - 15 دقيقة)';
    } else {
      count = customCount;
      timeMin = customTimeMin;
      title = `اختبار بابل شيت مخصص (${customCount} سؤال - ${customTimeMin} دقيقة)`;
    }

    // Build Question Pool from Lectures or Fallbacks
    let pool: { question: MCQQuestion; lectureId: number; lectureTitle: string }[] = [];
    
    const targetLectures = selectedLectureId === 'all' 
      ? allLectures 
      : allLectures.filter(l => l.id === selectedLectureId);

    targetLectures.forEach(lecture => {
      lecture.questionBank.forEach(q => {
        pool.push({
          question: q,
          lectureId: lecture.id,
          lectureTitle: lecture.arabicTitle || lecture.title
        });
      });
    });

    if (pool.length < count) {
      Object.entries(fallbackQuestions).forEach(([lecIdStr, qList]) => {
        const lecId = Number(lecIdStr);
        if (selectedLectureId !== 'all' && selectedLectureId !== lecId) return;

        const lec = allLectures.find(l => l.id === lecId);
        const titleName = lec ? lec.arabicTitle : `الفصل ${lecId}`;
        qList.forEach(q => {
          if (!pool.some(item => item.question.id === q.id)) {
            pool.push({
              question: q,
              lectureId: lecId,
              lectureTitle: titleName
            });
          }
        });
      });
    }

    if (selectedLectureId !== 'all') {
      const selectedLec = allLectures.find(l => l.id === selectedLectureId);
      if (selectedLec) {
        title = `امتحان بابل شيت: ${selectedLec.arabicTitle} (${Math.min(pool.length, count)} سؤال)`;
      }
    }

    // If pool is still smaller than count, adjust count
    const finalCount = Math.min(pool.length, count);

    // Shuffle pool deterministically
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, finalCount);

    const examItems: BubbleExamQuestion[] = shuffled.map((item, idx) => ({
      index: idx + 1,
      question: item.question,
      lectureId: item.lectureId,
      lectureTitle: item.lectureTitle
    }));

    setQuestions(examItems);
    setExamTitle(title);
    setQuestionCount(count);
    setAllocatedTimeMinutes(timeMin);
    setSecondsRemaining(timeMin * 60);
    setTimeSpentSeconds(0);
    setBubbleAnswers({});
    setSelectedQuestionIdx(0);
    setExamStage('exam_active');

    if (onToast) onToast(`🚀 بدأ ${title}. قم بتظليل الدوائر في ورقة البابل شيت!`);
  };

  // Handle Shading a Bubble Circle for Question
  const handleToggleBubble = (qIndex: number, choiceOption: 'A' | 'B' | 'C' | 'D') => {
    setBubbleAnswers(prev => {
      const current = prev[qIndex] || [];
      if (activeTool === 'eraser') {
        // Erase this option or all options for question
        return {
          ...prev,
          [qIndex]: current.filter(c => c !== choiceOption)
        };
      }

      // If already has this option, clicking again in pencil mode un-shades it
      if (current.includes(choiceOption)) {
        return {
          ...prev,
          [qIndex]: current.filter(c => c !== choiceOption)
        };
      } else {
        // Pencil or Pen tool: add option (if pen, could replace or allow multi shading to simulate user error)
        if (activeTool === 'pen') {
          // Pen replaces answer by default unless double click
          return {
            ...prev,
            [qIndex]: [choiceOption]
          };
        } else {
          // Pencil: replaces answer or sets single answer
          return {
            ...prev,
            [qIndex]: [choiceOption]
          };
        }
      }
    });
  };

  // Toggle Double Shading (simulate user mistake)
  const handleToggleDoubleShade = (qIndex: number, choiceOption: string) => {
    setBubbleAnswers(prev => {
      const current = prev[qIndex] || [];
      if (current.includes(choiceOption)) {
        return { ...prev, [qIndex]: current.filter(c => c !== choiceOption) };
      } else {
        return { ...prev, [qIndex]: [...current, choiceOption] };
      }
    });
  };

  // Clear all bubbles for a question
  const handleClearQuestionBubbles = (qIndex: number) => {
    setBubbleAnswers(prev => {
      const copy = { ...prev };
      delete copy[qIndex];
      return copy;
    });
  };

  // Clear all bubbles & Reset Score to zero
  const handleResetAll = () => {
    setBubbleAnswers({});
    setTimeSpentSeconds(0);
    if (onToast) onToast('🔄 تم مسح جميع إجابات البابل شيت وإعادة ضبط النتيجة إلى الصفر.');
  };

  // Trigger Scanning Phase
  const handleStartScanning = () => {
    setExamStage('scanning');
    setScanProgress(0);

    const scanInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(scanInterval);
          finishScanningAndEvaluate();
          return 100;
        }
        return prev + 10;
      });
    }, 180);
  };

  // Evaluate and recorded mistakes
  const finishScanningAndEvaluate = () => {
    // Record mistakes for bank
    questions.forEach(qItem => {
      const shaded = bubbleAnswers[qItem.index] || [];
      const isCorrect = shaded.length === 1 && shaded[0] === qItem.question.correctAnswer;
      if (!isCorrect && shaded.length > 0) {
        recordMistake(qItem.question, shaded[0], qItem.lectureId, qItem.lectureTitle);
      }
    });

    setExamStage('results');
    if (onToast) onToast('✨ اكتمل الفحص الضوئي وتصحيح البابل شيت بنجاح!');
  };

  // Calculate Scores & Metrics
  const examMetrics = useMemo(() => {
    let correctCount = 0;
    let wrongCount = 0;
    let doubleShadedCount = 0;
    let unshadedCount = 0;

    questions.forEach(qItem => {
      const shaded = bubbleAnswers[qItem.index] || [];
      if (shaded.length === 0) {
        unshadedCount++;
      } else if (shaded.length > 1) {
        doubleShadedCount++;
      } else if (shaded[0] === qItem.question.correctAnswer) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    const total = questions.length || 1;
    const percentage = Math.round((correctCount / total) * 100);

    let gradeTitle = 'ممتاز مرتفع 🏆';
    let gradeBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

    if (percentage < 50) {
      gradeTitle = 'يحتاج إلى مراجعة مكثفة ⚠️';
      gradeBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    } else if (percentage < 70) {
      gradeTitle = 'جيد 📈';
      gradeBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    } else if (percentage < 85) {
      gradeTitle = 'جيد جداً 🌟';
      gradeBadgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    }

    return {
      correctCount,
      wrongCount,
      doubleShadedCount,
      unshadedCount,
      total,
      percentage,
      gradeTitle,
      gradeBadgeColor
    };
  }, [questions, bubbleAnswers]);

  // Format Seconds to MM:SS or HH:MM:SS
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Option Letter in Arabic
  const getArabicOption = (letter: string) => {
    switch (letter) {
      case 'A': return 'أ';
      case 'B': return 'ب';
      case 'C': return 'ج';
      case 'D': return 'د';
      default: return letter;
    }
  };

  // -------------------------------------------------------------
  // PRESET SELECTION STAGE
  // -------------------------------------------------------------
  if (examStage === 'select_preset') {
    return (
      <div className="space-y-6">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/70 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-bold">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                <span>محاكاة التصحيح الإلكتروني للبابل شيت 📝</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                امتحانات ورقة البابل شيت (Bubble Sheet Exam System)
              </h2>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                بيئة تدريب تفاعلية تحاكي النظام الرسمي لوزارة التربية والتعليم المصرية. قم بتظليل دوائر الإجابة (أ، ب، ج، د)، تجنب الأخطاء الشائعة كالتظليل المزدوج، واستخدم الفحص الضوئي الآلي الفوري.
              </p>
            </div>
            
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-right space-y-1.5 shrink-0 min-w-[200px]">
              <div className="text-xs text-slate-400 font-semibold flex items-center justify-end gap-1">
                <span>نظام التظليل المعتمد</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-amber-400 font-extrabold text-sm">أدوات: رصاص ✏️ / جاف 🖊️ / ممحاة 🧹</div>
              <div className="text-xs text-slate-400">تصحيح ضوئي بالأوتوماتيك OCR</div>
            </div>
          </div>
        </div>

        {/* Student Data Header Preview Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-400" />
              بيانات ورقة البابل شيت الرسمية
            </h3>
            <span className="text-xs text-amber-400/80 font-mono bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
              نموذج الوزارة المطور
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">اسم الطالب رباعي:</label>
              <input 
                type="text" 
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">رقم الجلوس (7 أرقام):</label>
              <input 
                type="text" 
                value={seatingNumber}
                onChange={e => setSeatingNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-amber-300 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">اختيار موضوع / فصل الامتحان:</label>
              <select
                value={selectedLectureId}
                onChange={e => setSelectedLectureId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-amber-300 focus:border-amber-500 focus:outline-none"
              >
                <option value="all">🌐 منهج الأحياء كامل (شامل كلي)</option>
                {allLectures.map(lec => (
                  <option key={lec.id} value={lec.id}>
                    📚 {lec.arabicTitle}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">نموذج كراسة الأسئلة:</label>
              <div className="flex gap-2">
                {(['أ', 'ب', 'ج', 'د'] as const).map(model => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => setFormModel(model)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                      formModel === model 
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black' 
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    نموذج ({model})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Exam Presets Cards */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            اختر نوع امتحان البابل شيت للبدء:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Preset 1: Official 50 Questions */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-slate-900 hover:bg-slate-850 border border-amber-500/40 rounded-xl p-6 shadow-xl space-y-4 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
              onClick={() => startExamWithPreset('official_50')}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full pointer-events-none group-hover:bg-amber-500/20 transition-all" />
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full font-extrabold">
                    امتحان رسمي 🏛️
                  </span>
                  <span className="text-xs font-mono text-slate-400">50 سؤال</span>
                </div>
                <h4 className="text-lg font-extrabold text-white group-hover:text-amber-300 transition-colors">
                  امتحان الأحياء النهائي البابل شيت (50 سؤال)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  محاكاة كاملة للامتحان النهائي للثانوية العامة بنفس زمن الإجابة (3 ساعات) مع 50 سؤالاً تشمل كافة أبواب المنهج ورسم ورقة الإجابة المعتمدة.
                </p>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 pt-2 border-t border-slate-800">
                  <span className="flex items-center gap-1 text-amber-400 font-mono">
                    <Clock className="w-3.5 h-3.5" /> 180 دقيقة (3س)
                  </span>
                  <span>تظليل كلي + تقرير OCR</span>
                </div>
              </div>

              <button className="w-full mt-4 py-3 bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer">
                <Play className="w-4 h-4 fill-current" />
                <span>بدء الامتحان البابل شيت الشامل</span>
              </button>
            </motion.div>

            {/* Preset 2: Midterm 25 Questions */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-6 shadow-xl space-y-4 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
              onClick={() => startExamWithPreset('midterm_25')}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
                    اختبار متوسط 🧪
                  </span>
                  <span className="text-xs font-mono text-slate-400">25 سؤال</span>
                </div>
                <h4 className="text-lg font-extrabold text-white group-hover:text-emerald-300 transition-colors">
                  امتحان بابل شيت منتصف المنهج (25 سؤال)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  اختبار مكثف لتقييم السرعة والدقة في تظليل الدوائر على الفصول الأولى (الدعامة والحركة، الهرمونات، التكاثر، والبيولوجيا).
                </p>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 pt-2 border-t border-slate-800">
                  <span className="flex items-center gap-1 text-emerald-400 font-mono">
                    <Clock className="w-3.5 h-3.5" /> 60 دقيقة
                  </span>
                  <span>تظليل متوسط</span>
                </div>
              </div>

              <button className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer">
                <Play className="w-4 h-4 fill-current" />
                <span>بدء اختبار الـ 25 سؤال</span>
              </button>
            </motion.div>

            {/* Preset 3: Speed 10 Questions */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-6 shadow-xl space-y-4 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
              onClick={() => startExamWithPreset('speed_10')}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-1 rounded-full font-bold">
                    تدريب سريع ⚡
                  </span>
                  <span className="text-xs font-mono text-slate-400">10 أسئلة</span>
                </div>
                <h4 className="text-lg font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                  تحدي دقة السرعة في التظليل (10 أسئلة)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  تدريب خاطف لتنمية مهارة عدم تجاوز إطار الدائرة وتفادي التظليل المزدوج تحت ضغط الوقت (15 دقيقة فقط).
                </p>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 pt-2 border-t border-slate-800">
                  <span className="flex items-center gap-1 text-indigo-400 font-mono">
                    <Clock className="w-3.5 h-3.5" /> 15 دقيقة
                  </span>
                  <span>تدريب دقة التظليل</span>
                </div>
              </div>

              <button className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer">
                <Play className="w-4 h-4 fill-current" />
                <span>بدء تحدي السرعة</span>
              </button>
            </motion.div>
          </div>
        </div>

        {/* Custom Exam Generator */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <PenTool className="w-4 h-4 text-amber-400" />
            تخصيص نموذج بابل شيت آخر:
          </h4>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">عدد الأسئلة:</span>
              <select
                value={questionCount}
                onChange={e => setQuestionCount(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono font-bold"
              >
                <option value={10}>10 أسئلة</option>
                <option value={20}>20 سؤالاً</option>
                <option value={30}>30 سؤالاً</option>
                <option value={40}>40 سؤالاً</option>
                <option value={50}>50 سؤالاً</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">الزمن المحدد (بالدقائق):</span>
              <select
                value={allocatedTimeMinutes}
                onChange={e => setAllocatedTimeMinutes(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono font-bold"
              >
                <option value={15}>15 دقيقة</option>
                <option value={30}>30 دقيقة</option>
                <option value={45}>45 دقيقة</option>
                <option value={60}>60 دقيقة (ساعة)</option>
                <option value={120}>120 دقيقة (ساعتان)</option>
                <option value={180}>180 دقيقة (3 ساعات)</option>
              </select>
            </div>

            <button
              onClick={() => startExamWithPreset('custom', questionCount, allocatedTimeMinutes)}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-lg border border-amber-500/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>بدء بالنموذج المخصص</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SCANNING / OCR PROCESSING STAGE
  // -------------------------------------------------------------
  if (examStage === 'scanning') {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center text-center space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
        {/* Animated Scanning Beam */}
        <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden shadow-2xl">
          <div 
            className="absolute left-0 right-0 h-1 bg-amber-400 shadow-[0_0_15px_#f59e0b] transition-all duration-300 ease-linear z-20"
            style={{ top: `${scanProgress}%` }}
          />

          <div className="space-y-4 opacity-75">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-400">قارئ ورقة البابل شيت الضوئي (OCR Scanner)</span>
              <span className="text-xs font-mono text-slate-400">نموذج: {formModel}</span>
            </div>
            
            <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-slate-500 text-left dir-ltr">
              <div>Q1: [X] [ ] [ ] [ ]</div>
              <div>Q2: [ ] [X] [ ] [ ]</div>
              <div>Q3: [ ] [ ] [X] [ ]</div>
              <div>Q4: [X] [ ] [ ] [ ]</div>
              <div>Q5: [ ] [ ] [ ] [X]</div>
              <div>Q6: [X] [X] ERR!</div>
              <div>Q7: [ ] [X] [ ] [ ]</div>
              <div>Q8: [ ] [ ] [ ] [X]</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-amber-400 font-extrabold text-lg">
            <ScanLine className="w-6 h-6 animate-spin text-amber-400" />
            <span>جاري إجراء التثبت والمسح الضوئي لكراسة البابل شيت... ({scanProgress}%)</span>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            يقوم القارئ الإلكتروني بمطابقة دوائر التظليل السوداء والزرقاء مع النموذج المعياري لإجابات أحياء الثانوية العامة.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RESULTS / CORRECTION AUDIT STAGE
  // -------------------------------------------------------------
  if (examStage === 'results') {
    const filteredQuestions = questions.filter(qItem => {
      const shaded = bubbleAnswers[qItem.index] || [];
      const isCorrect = shaded.length === 1 && shaded[0] === qItem.question.correctAnswer;
      if (resultFilter === 'correct') return isCorrect;
      if (resultFilter === 'wrong') return shaded.length === 1 && !isCorrect;
      if (resultFilter === 'double_shaded') return shaded.length > 1;
      if (resultFilter === 'unshaded') return shaded.length === 0;
      return true;
    });

    return (
      <div className="space-y-6 dir-rtl">
        {/* Score Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-right">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${examMetrics.gradeBadgeColor}`}>
                <Award className="w-4 h-4" />
                <span>النتيجة والتقدير: {examMetrics.gradeTitle}</span>
              </span>
              <h2 className="text-3xl font-black text-white">
                تقرير فحص ورقة البابل شيت ({studentName})
              </h2>
              <p className="text-xs text-slate-400">
                رقم الجلوس: <span className="font-mono text-amber-300 font-bold">{seatingNumber}</span> | النموذج: <span className="font-bold text-amber-400">({formModel})</span> | الوقت المستغرق: <span className="font-mono text-emerald-400 font-bold">{formatTime(timeSpentSeconds)}</span>
              </p>
            </div>

            {/* Score Animated Counter & Ring */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <AnimatedScoreCounter
                value={examMetrics.percentage}
                size="lg"
                label={isAr ? `درجة البابل شيت (${examMetrics.correctCount}/${examMetrics.total})` : `Bubble Sheet Score (${examMetrics.correctCount}/${examMetrics.total})`}
                showRing={true}
                showSparkles={true}
              />
            </div>
          </div>

          {/* Metrics Quick Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800 text-center">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
              <span className="block text-xs font-bold text-emerald-400">إجابات صحيحة 🟢</span>
              <span className="text-xl font-extrabold text-emerald-300 font-mono">{examMetrics.correctCount}</span>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
              <span className="block text-xs font-bold text-rose-400">إجابات خاطئة 🔴</span>
              <span className="text-xl font-extrabold text-rose-300 font-mono">{examMetrics.wrongCount}</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
              <span className="block text-xs font-bold text-amber-400">تظليل مزدوج ملغى ⚠️</span>
              <span className="text-xl font-extrabold text-amber-300 font-mono">{examMetrics.doubleShadedCount}</span>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 p-3 rounded-xl">
              <span className="block text-xs font-bold text-slate-400">أسئلة متروكة ⚪</span>
              <span className="text-xl font-extrabold text-slate-300 font-mono">{examMetrics.unshadedCount}</span>
            </div>
          </div>
        </div>

        {/* Filter & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="text-slate-400">تصفية نتائج التظليل:</span>
            <button
              onClick={() => setResultFilter('all')}
              className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                resultFilter === 'all' ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              الكل ({questions.length})
            </button>
            <button
              onClick={() => setResultFilter('correct')}
              className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                resultFilter === 'correct' ? 'bg-emerald-600 text-white border-emerald-400 font-extrabold' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              صحيح 🟢 ({examMetrics.correctCount})
            </button>
            <button
              onClick={() => setResultFilter('wrong')}
              className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                resultFilter === 'wrong' ? 'bg-rose-600 text-white border-rose-400 font-extrabold' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              خطأ 🔴 ({examMetrics.wrongCount})
            </button>
            <button
              onClick={() => setResultFilter('double_shaded')}
              className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                resultFilter === 'double_shaded' ? 'bg-amber-600 text-white border-amber-400 font-extrabold' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              تظليل مزدوج ⚠️ ({examMetrics.doubleShadedCount})
            </button>
          </div>

          <button
            onClick={() => setExamStage('select_preset')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-lg border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة امتحان بابل شيت جديد</span>
          </button>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          {filteredQuestions.map(qItem => {
            const shaded = bubbleAnswers[qItem.index] || [];
            const isCorrect = shaded.length === 1 && shaded[0] === qItem.question.correctAnswer;
            const isDouble = shaded.length > 1;
            const isUnshaded = shaded.length === 0;

            return (
              <div 
                key={qItem.index} 
                className={`bg-slate-900 border rounded-xl p-5 shadow-lg space-y-4 ${
                  isCorrect 
                    ? 'border-emerald-500/30 bg-emerald-950/10' 
                    : isDouble 
                    ? 'border-amber-500/40 bg-amber-950/10' 
                    : isUnshaded 
                    ? 'border-slate-800' 
                    : 'border-rose-500/30 bg-rose-950/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-800 text-amber-300 font-mono font-bold text-sm flex items-center justify-center shrink-0 border border-slate-700">
                      {qItem.index}
                    </span>
                    <div>
                      <span className="text-xs text-slate-400 font-semibold">{qItem.lectureTitle}</span>
                      <h4 className="text-sm font-bold text-slate-100">{qItem.question.questionText}</h4>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded text-xs font-bold border shrink-0 ${
                    isCorrect 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : isDouble 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                      : isUnshaded 
                      ? 'bg-slate-800 text-slate-400 border-slate-700' 
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {isCorrect ? 'إجابة مظللة صحيحة ✓' : isDouble ? 'تظليل مزدوج ملغى ⚠️' : isUnshaded ? 'لم يتم التظليل ⚪' : 'إجابة خاطئة ✗'}
                  </span>
                </div>

                {/* Bubble choices preview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {(['A', 'B', 'C', 'D'] as const).map(opt => {
                    const isChoiceShaded = shaded.includes(opt);
                    const isRightAnswer = qItem.question.correctAnswer === opt;

                    let choiceBg = 'bg-slate-950 text-slate-300 border-slate-800';
                    if (isRightAnswer) {
                      choiceBg = 'bg-emerald-950/60 text-emerald-200 border-emerald-500/60 font-bold';
                    } else if (isChoiceShaded) {
                      choiceBg = 'bg-rose-950/60 text-rose-200 border-rose-500/60 font-bold';
                    }

                    return (
                      <div key={opt} className={`p-2.5 rounded-lg border flex items-center justify-between ${choiceBg}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs border ${
                            isChoiceShaded 
                              ? 'bg-slate-900 text-amber-300 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                              : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}>
                            {getArabicOption(opt)}
                          </span>
                          <span>{qItem.question.options[opt]}</span>
                        </div>

                        {isRightAnswer && <span className="text-[10px] text-emerald-400 font-extrabold">الإجابة النموذجية ✓</span>}
                        {isChoiceShaded && !isRightAnswer && <span className="text-[10px] text-rose-400 font-bold">تظليلك ✏️</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {qItem.question.explanation && (
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 text-xs text-slate-300 space-y-1">
                    <span className="font-bold text-amber-400 block">التفسير العلمي والشرح:</span>
                    <p className="leading-relaxed">{qItem.question.explanation.correct}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // EXAM ACTIVE STAGE: SPLIT / BUBBLE SHEET INTERACTIVE VIEW
  // -------------------------------------------------------------
  const currentQ = questions[selectedQuestionIdx];

  return (
    <div className="space-y-4 dir-rtl">
      {/* Top Fixed Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 sticky top-4 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-black flex items-center justify-center border border-amber-500/40">
            {formModel}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 line-clamp-1">{examTitle}</h3>
            <span className="text-xs text-slate-400">الطالب: {studentName} ({seatingNumber})</span>
          </div>
        </div>

        {/* Shading Tool Selector: Pencil / Pen / Eraser */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTool('pencil')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTool === 'pencil' 
                ? 'bg-amber-500 text-slate-950 font-black shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="تظليل بقلم الرصاص"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>رصاص ✏️</span>
          </button>
          <button
            onClick={() => setActiveTool('pen')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTool === 'pen' 
                ? 'bg-indigo-600 text-white font-black shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="تظليل بقلم الجاف"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>جاف 🖊️</span>
          </button>
          <button
            onClick={() => setActiveTool('eraser')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTool === 'eraser' 
                ? 'bg-rose-600 text-white font-black shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="مسح التظليل"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>ممحاة 🧹</span>
          </button>
        </div>

        {/* View Layout Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded cursor-pointer font-semibold ${
              viewMode === 'split' ? 'bg-slate-800 text-amber-300 font-bold' : 'text-slate-400'
            }`}
          >
            شاشة مزدوجة ↔️
          </button>
          <button
            onClick={() => setViewMode('sheet_only')}
            className={`px-2.5 py-1 rounded cursor-pointer font-semibold ${
              viewMode === 'sheet_only' ? 'bg-slate-800 text-amber-300 font-bold' : 'text-slate-400'
            }`}
          >
            البابل شيت فقط 📜
          </button>
          <button
            onClick={() => setViewMode('booklet_only')}
            className={`px-2.5 py-1 rounded cursor-pointer font-semibold ${
              viewMode === 'booklet_only' ? 'bg-slate-800 text-amber-300 font-bold' : 'text-slate-400'
            }`}
          >
            الأسئلة فقط 📘
          </button>
        </div>

        {/* Countdown Timer & Submit */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30 text-sm">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => {
              if (window.confirm('هل أنت متأكد من تسليم ورقة البابل شيت وتصحيح الاختبار فورياً؟')) {
                handleStartScanning();
              }
            }}
            className="px-4 py-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-lg shadow-lg flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <FileCheck2 className="w-4 h-4 text-emerald-300" />
            <span>تصحيح الاختبار 📑</span>
          </button>
        </div>
      </div>

      {/* Main Split Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Question Booklet (كراسة الأسئلة) */}
        {(viewMode === 'split' || viewMode === 'booklet_only') && currentQ && (
          <div className={`${viewMode === 'booklet_only' ? 'lg:col-span-12' : 'lg:col-span-6'} bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 sticky top-24`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/40">
                  {currentQ.index}
                </span>
                <span className="text-xs font-bold text-slate-300">سؤال رقم ({currentQ.index}) من {questions.length}</span>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{currentQ.lectureTitle}</span>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-bold text-white leading-relaxed">
                {currentQ.question.questionText}
              </h3>

              {/* Multiple Choice Options in Booklet */}
              <div className="space-y-2.5 pt-2">
                {(['A', 'B', 'C', 'D'] as const).map(opt => {
                  const shadedList = bubbleAnswers[currentQ.index] || [];
                  const isShaded = shadedList.includes(opt);

                  return (
                    <button
                      key={opt}
                      onClick={() => handleToggleBubble(currentQ.index, opt)}
                      className={`w-full text-right p-3.5 rounded-xl border text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        isShaded 
                          ? 'bg-amber-500/20 text-amber-200 border-amber-500/60 shadow-md font-bold' 
                          : 'bg-slate-950 hover:bg-slate-850 text-slate-300 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs border ${
                          isShaded 
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.6)] font-black' 
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}>
                          {getArabicOption(opt)}
                        </span>
                        <span>{currentQ.question.options[opt]}</span>
                      </div>

                      {isShaded && (
                        <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                          <span>مظلل بالبابل شيت</span>
                          <Check className="w-4 h-4 text-amber-400" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs font-bold">
              <button
                disabled={selectedQuestionIdx === 0}
                onClick={() => setSelectedQuestionIdx(prev => Math.max(0, prev - 1))}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-slate-300 rounded-lg border border-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السؤال السابق</span>
              </button>

              <span className="text-slate-400 font-mono">
                {selectedQuestionIdx + 1} / {questions.length}
              </span>

              <button
                disabled={selectedQuestionIdx === questions.length - 1}
                onClick={() => setSelectedQuestionIdx(prev => Math.min(questions.length - 1, prev + 1))}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-extrabold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <span>السؤال التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Right Side: Interactive Bubble Sheet Sheet (ورقة البابل شيت الرسمية) */}
        {(viewMode === 'split' || viewMode === 'sheet_only') && (
          <div className={`bubble-sheet-container ${viewMode === 'sheet_only' ? 'lg:col-span-12' : 'lg:col-span-6'} bg-slate-950 border-2 border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 relative`}>
            
            {/* Sheet Header Banner */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center space-y-1 relative overflow-hidden">
              <div className="text-[11px] font-bold text-amber-400/90 tracking-wider">جمهورية مصر العربية - وزارة التربية والتعليم</div>
              <h3 className="text-base font-black text-white">ورقة إجابة البابل شيت (BUBBLE SHEET EXAM FORM)</h3>
              <div className="text-xs text-slate-400 flex justify-center gap-4 font-mono pt-1">
                <span>النموذج: ({formModel})</span>
                <span>المادة: الأحياء</span>
                <span>رقم الجلوس: {seatingNumber}</span>
              </div>
            </div>

            {/* Bubble Sheet Guidelines Note */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-[11px] text-amber-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>تعليمات: انقر على الدائرة لتظليل الإجابة بالقلم المختار. احذر تظليل دائرتين للسؤال نفسه لتفادي الإلغاء.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('هل أنت متأكد من إعادة مسح جميع إجابات البابل شيت وتصفير النتيجة؟')) {
                    handleResetAll();
                  }
                }}
                className="reset-all-btn text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold px-2 py-1 rounded flex items-center gap-1 shrink-0 cursor-pointer transition-all"
                title="إعادة مسح جميع الإجابات وتصفير النتيجة"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All (تصفير)</span>
              </button>
            </div>

            {/* Grid of Bubble Questions (1 to N) */}
            <div className="max-h-[600px] overflow-y-auto pr-1 space-y-2 border border-slate-800/80 p-3 rounded-xl bg-slate-900/60">
              {questions.map(qItem => {
                const isCurrent = qItem.index === selectedQuestionIdx + 1;
                const shadedOptions = bubbleAnswers[qItem.index] || [];
                const isDoubleShaded = shadedOptions.length > 1;

                return (
                  <div 
                    key={qItem.index} 
                    onClick={() => setSelectedQuestionIdx(qItem.index - 1)}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isCurrent 
                        ? 'bg-amber-500/15 border-amber-500/60 shadow-md ring-1 ring-amber-500/40' 
                        : isDoubleShaded 
                        ? 'bg-rose-950/20 border-rose-500/40' 
                        : 'bg-slate-900 hover:bg-slate-850 border-slate-800/80'
                    }`}
                  >
                    {/* Question Number & Status */}
                    <div className="flex items-center gap-2 min-w-[70px]">
                      <span className={`w-6 h-6 rounded-full font-mono font-bold text-xs flex items-center justify-center border ${
                        isCurrent 
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold' 
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {qItem.index}
                      </span>
                      {isDoubleShaded && (
                        <span className="text-[10px] text-rose-400 font-bold" title="تظليل مزدوج يلغي السؤال!">⚠️</span>
                      )}
                    </div>

                    {/* 4 Bubble Circles (أ، ب، ج، د) */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      {(['A', 'B', 'C', 'D'] as const).map(opt => {
                        const isShaded = shadedOptions.includes(opt);

                        return (
                          <motion.label
                            key={opt}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBubble(qItem.index, opt);
                            }}
                            animate={{ scale: isShaded ? 1.12 : 1 }}
                            whileTap={{ scale: 0.88 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors border cursor-pointer relative ${
                              isShaded 
                                ? activeTool === 'pen'
                                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_12px_rgba(79,70,229,0.8)] font-black'
                                  : 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.8)] font-black'
                                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                            }`}
                            title={`تظليل الدائرة (${getArabicOption(opt)})`}
                          >
                            <input
                              type="radio"
                              name={`bubble-q-${qItem.index}`}
                              value={opt}
                              checked={isShaded}
                              onChange={() => {}}
                              className="sr-only"
                            />
                            <span>{getArabicOption(opt)}</span>
                          </motion.label>
                        );
                      })}
                    </div>

                    {/* Clear button for this question */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearQuestionBubbles(qItem.index);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="مسح كافة تظليلات السؤال"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Instant Correction Action Bar */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-xl">
              <div className="text-xs text-slate-300 font-semibold flex items-center gap-2">
                <span>التمثيل الرقمي:</span>
                <span className="font-mono text-amber-300 font-extrabold bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  {Object.keys(bubbleAnswers).filter(k => (bubbleAnswers[Number(k)] || []).length > 0).length} / {questions.length} سؤال مظلل
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('هل تريد مسح جميع إجابات ورقة البابل شيت وإعادة ضبط الدرجة إلى الصفر؟')) {
                      handleResetAll();
                    }
                  }}
                  className="reset-all-btn px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                  title="مسح جميع الاختيارات وتصفير الدرجة"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>مسح الكل (Reset All)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('هل تريد إنهاء تظليل ورقة البابل شيت وبدء تصحيح الاختبار وحساب النتيجة فورياً؟')) {
                      handleStartScanning();
                    }
                  }}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-l from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all transform active:scale-95"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-300" />
                  <span>تصحيح الاختبار وحساب النتيجة فوراً 📑</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
