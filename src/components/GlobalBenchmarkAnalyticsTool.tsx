import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  TrendingUp,
  Globe,
  Award,
  AlertTriangle,
  CheckCircle2,
  Zap,
  BookOpen,
  Target,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Layers,
  Activity,
  RefreshCw,
  Cpu,
  ChevronRight,
  Sliders,
  Users
} from 'lucide-react';
import { LectureData } from '../types';

interface GlobalBenchmarkAnalyticsToolProps {
  studentPerformance: Record<number, {
    lectureId: number;
    lectureTitle: string;
    totalAnswered: number;
    correctAnswers: number;
    percentage: number;
    lastAttemptDate: string;
  }>;
  allLectures: LectureData[];
  onSelectLectureForQuiz: (lectureId: number) => void;
  onToast?: (message: string) => void;
}

// Benchmark Baseline Profiles for Comparison (National Thanaweya, Top 1%, Global STEM)
const BENCHMARK_PROFILES = {
  national: {
    id: 'national',
    name: 'متوسط طلاب الجمهورية (مصر)',
    description: 'متوسط نتائج 25,000+ طالب من دفعة 2025/2026 على المنصة',
    icon: Users,
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    scores: {
      1: 72, // الدعم والحركة
      2: 78, // التنسيق الهرموني
      3: 65, // التكاثر في الكائنات الحية
      4: 70, // المناعة في الكائنات الحية
      5: 61, // البيولوجيا الجزيئية DNA
      6: 58  // الأحماض النووية وتخليق البروتين
    } as Record<number, number>
  },
  top_rank: {
    id: 'top_rank',
    name: 'متوسط أوائل الجمهورية (Top 1%)',
    description: 'متوسط أداء الطلاب الحاصلين على 95%+ في الامتحانات التجريبية',
    icon: Award,
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    scores: {
      1: 94,
      2: 96,
      3: 91,
      4: 93,
      5: 89,
      6: 88
    } as Record<number, number>
  },
  global_stem: {
    id: 'global_stem',
    name: 'المعيار الأكاديمي الدولي (Global STEM)',
    description: 'معدل التقييم المعياري العالمي لمستويات الفهم والتفكير النقدي في الأحياء',
    icon: Globe,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    scores: {
      1: 82,
      2: 85,
      3: 79,
      4: 84,
      5: 78,
      6: 76
    } as Record<number, number>
  }
};

// Detailed Knowledge Gap Topics by Chapter
const CHAPTER_GAP_DIAGNOSTICS: Record<number, {
  coreTopics: { name: string; difficulty: 'عالية' | 'متوسطة' | 'أساسية'; avgGapImpact: string }[];
  commonMisconceptions: string[];
  remediationAdvice: string;
}> = {
  1: {
    coreTopics: [
      { name: 'حسابات مناطق القطعة العضلية (H, A, I, Z) أثناء الانقباض والانبساط', difficulty: 'عالية', avgGapImpact: '14%' },
      { name: 'آلية نظرية خيوط الانزلاق (هكسلي) ودور الـ ATP ووسائل الربط المستعرضة', difficulty: 'متوسطة', avgGapImpact: '9%' },
      { name: 'التفرقة بين الحركة الذاتية والسيتوبلازمية والموضعية في النبات', difficulty: 'أساسية', avgGapImpact: '5%' }
    ],
    commonMisconceptions: [
      'الخلط بين طول المنطقة A وثباتها أثناء الانقباض العضلي الكامل.',
      'اعتبار أشرطة المايوسين قصيرة الحجم عند الانقباض بينما يتغير طول المناطق المضيئة I وشبه المضيئة H فقط.'
    ],
    remediationAdvice: 'استخدم حاسبة القطع العضلية التفاعلية بالمنصة واختبر الأسئلة الحسابية في بنك أسئلة الفصل الأول.'
  },
  2: {
    coreTopics: [
      { name: 'التغذية الراجعة السلبية والإيجابية (Negative & Positive Feedback)', difficulty: 'عالية', avgGapImpact: '12%' },
      { name: 'هرمونات البنكرياس (الإنسولين والجلوكاجون) وتوازن سكر الدم', difficulty: 'متوسطة', avgGapImpact: '8%' },
      { name: 'علاقة هرمونات الغدة النخامية بالنشاط الجنسي والتكاثري (FSH & LH)', difficulty: 'عالية', avgGapImpact: '11%' }
    ],
    commonMisconceptions: [
      'الاعتقاد بأن هرمون الـ ADH يؤثر فقط على الكلية ولا يرفع ضغط الدم مباشر عبر الأوعية.',
      'الخلط بين تأثير الكورتيزون والنمو على أيض النشويات والبروتينات.'
    ],
    remediationAdvice: 'راجع المخطط التفاعلي للهرمونات وحل أسئلة الربط الوظيفي بين النخامية والغدد التابعة.'
  },
  3: {
    coreTopics: [
      { name: 'حسابات أيام دوره الطمث وارتفاعات هرمونات Estrogen & Progesterone', difficulty: 'عالية', avgGapImpact: '16%' },
      { name: 'ظاهرة تعاقب الأجيال في دورة حياة الفوجير ونبات السطح الزهري', difficulty: 'عالية', avgGapImpact: '14%' },
      { name: 'الاقتران السلمي والجانبي في طحلب الاسبيروجيرا والشروط البيئية', difficulty: 'متوسطة', avgGapImpact: '10%' }
    ],
    commonMisconceptions: [
      'الاعتقاد بأن الزيجوسبور ناتج من انقسام ميوزي مباشرة بدلاً من اندماج بروتوبلاست خليتين.',
      'خطأ حساب يوم التبويض الفعلي (اليوم 14 من بدء الطمث).'
    ],
    remediationAdvice: 'استخدم محاكي دورة الطمث التفاعلي واقرأ بطاقات استذكار التكاثر العذري والتعاقب.'
  },
  4: {
    coreTopics: [
      { name: 'حسابات أعداد ونسب خلايا الدم البيضاء والليمفاوية (T, B, NK)', difficulty: 'عالية', avgGapImpact: '15%' },
      { name: 'التميين بين الاستجابة المناعية الخلطية (الأجسام المضادة) والخلوية (خلايا TC)', difficulty: 'عالية', avgGapImpact: '13%' },
      { name: 'خط الدفاع الثاني: الاستجابة بالالتهاب والمواد الكيميائية المساعدة (السيتوكينات)', difficulty: 'متوسطة', avgGapImpact: '7%' }
    ],
    commonMisconceptions: [
      'ظن أن الأجسام المضادة تقضي على الفيروسات داخل الخلايا مباشرة بدلاً من ظاهرة التعادل والتجميع.',
      'الخطأ في تحديد دور الخلايا التائية المساعدة TH في تنشيط كلتا المناعتين.'
    ],
    remediationAdvice: 'شاهد فيديو تركيب المتممات واستخدم حاسبة نسب الخلايا الليمفاوية في قسم الأدوات.'
  },
  5: {
    coreTopics: [
      { name: 'مسائل نسبة النيوكليوتيدات وقواعد الشارغاف (A=T, G=C) في جزيء DNA', difficulty: 'عالية', avgGapImpact: '18%' },
      { name: 'إنزيمات تضاعف الـ DNA (اللولب، البلمرة، الربط) وتحديد اتجاهات 5\' إلى 3\'', difficulty: 'عالية', avgGapImpact: '15%' },
      { name: 'التهجين وتتابع النيوكليوتيدات المتكررة وطفرات الجينات والصبغيات', difficulty: 'متوسطة', avgGapImpact: '10%' }
    ],
    commonMisconceptions: [
      'تطبيق قواعد شارغاف (A=T) على شريط مفرد من الـ DNA أو على جزيء RNA مفرد.',
      'الخلط بين عمل إنزيم البلمرة على الشريط القالب 3\'->5\' والشريط القالب 5\'->3\'.'
    ],
    remediationAdvice: 'استخدم حاسبة الوراثة الجزيئية بالمنصة وحل تدريبات أشرطة الـ DNA المتقدمة.'
  },
  6: {
    coreTopics: [
      { name: 'حسابات كودونات الـ mRNA وعدد الأحماض الأمينية وكودون الوقف', difficulty: 'عالية', avgGapImpact: '17%' },
      { name: 'مقارنة تركيب ووظائف أنواع الـ RNA الثلاثة (mRNA, tRNA, rRNA)', difficulty: 'متوسطة', avgGapImpact: '11%' },
      { name: 'مراحل تخليق البروتين (البدء، الاستطالة، إنهاء الترجمة في الريبوسوم)', difficulty: 'عالية', avgGapImpact: '14%' }
    ],
    commonMisconceptions: [
      'نسيان استبعاد كودون الوقف (UAA, UAG, UGA) عند حساب عدد الأحماض الأمينية الناتجة.',
      'اعتبار مضاد الكودون موجوداً على شريط الـ mRNA بدلاً من جزئ الـ tRNA.'
    ],
    remediationAdvice: 'تدرب على أسئلة شفرات الجينات وكودونات الوقف في بنك أسئلة الفصل السادس.'
  }
};

export function GlobalBenchmarkAnalyticsTool({
  studentPerformance,
  allLectures,
  onSelectLectureForQuiz,
  onToast
}: GlobalBenchmarkAnalyticsToolProps) {
  const [selectedBenchmark, setSelectedBenchmark] = useState<'national' | 'top_rank' | 'global_stem'>('national');
  const [activeChapterFilter, setActiveChapterFilter] = useState<number | 'all'>('all');
  const [showOnlyGaps, setShowOnlyGaps] = useState<boolean>(false);

  const currentBenchmark = BENCHMARK_PROFILES[selectedBenchmark];

  // Calculate Overall Comparative Statistics
  const chapterData = allLectures.map(lec => {
    const record = studentPerformance[lec.id];
    const studentPct = record ? record.percentage : 0;
    const benchmarkPct = currentBenchmark.scores[lec.id] || 70;
    const gap = studentPct - benchmarkPct; // positive = ahead, negative = gap
    const isTested = !!record && record.totalAnswered > 0;
    
    // Status
    let status: 'ahead' | 'on_par' | 'minor_gap' | 'critical_gap' | 'untested' = 'untested';
    if (!isTested) {
      status = 'untested';
    } else if (gap >= 5) {
      status = 'ahead';
    } else if (gap >= -5) {
      status = 'on_par';
    } else if (gap >= -15) {
      status = 'minor_gap';
    } else {
      status = 'critical_gap';
    }

    return {
      lecture: lec,
      studentPct,
      benchmarkPct,
      gap,
      isTested,
      status,
      record,
      diagnostics: CHAPTER_GAP_DIAGNOSTICS[lec.id]
    };
  });

  // Aggregates
  const testedChapters = chapterData.filter(c => c.isTested);
  const avgStudentPct = testedChapters.length > 0
    ? Math.round(testedChapters.reduce((acc, c) => acc + c.studentPct, 0) / testedChapters.length)
    : 0;
  const avgBenchmarkPct = Math.round(
    (Object.values(currentBenchmark.scores) as number[]).reduce((a: number, b: number) => a + b, 0) / Object.keys(currentBenchmark.scores).length
  );
  const overallGap = avgStudentPct - avgBenchmarkPct;

  // Calculate Percentile Estimation
  let percentileEst = '—';
  if (testedChapters.length > 0) {
    if (avgStudentPct >= 90) percentileEst = 'أعلى 3% 🏆';
    else if (avgStudentPct >= 80) percentileEst = 'أعلى 10% 🚀';
    else if (avgStudentPct >= 70) percentileEst = 'أعلى 25% 🌟';
    else if (avgStudentPct >= 60) percentileEst = 'أعلى 45% 📈';
    else percentileEst = 'في النصف الأسفل ⚡';
  }

  // Filtered view
  const filteredChapters = chapterData.filter(item => {
    if (activeChapterFilter !== 'all' && item.lecture.id !== activeChapterFilter) return false;
    if (showOnlyGaps && (item.gap >= 0 || !item.isTested)) return false;
    return true;
  });

  // Critical gaps count
  const gapCount = chapterData.filter(c => c.gap < 0 && c.isTested).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header & Baseline Switcher */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                <span>واجهة التحليل المقارن والمعدلات العالمية</span>
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  تحديد الفجوات المعرفية
                </span>
              </h3>
            </div>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-2xl">
              قارن مستواك في بنك الأسئلة مع متوسط أداء طلاب الثانوية العامة بالجمهورية والمعايير العالمية، واكتشف المواضيع الدقيقة التي تحتاج تقوية لكل فصل.
            </p>
          </div>

          {/* Benchmark Baseline Selector Switch */}
          <div className="bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 self-stretch lg:self-auto flex flex-col sm:flex-row gap-1">
            {(Object.keys(BENCHMARK_PROFILES) as Array<keyof typeof BENCHMARK_PROFILES>).map(key => {
              const prof = BENCHMARK_PROFILES[key];
              const IconComp = prof.icon;
              const isSelected = selectedBenchmark === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedBenchmark(key);
                    onToast?.(`📊 تم تغيير خط المقارنة إلى: ${prof.name}`);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black shadow-lg shadow-emerald-500/20 scale-[1.02]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isSelected ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{prof.name.split('(')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Benchmark Badge Description */}
        <div className="mt-4 pt-4 border-t border-slate-850/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">معيار المقارنة النشط:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${currentBenchmark.badgeColor}`}>
              {currentBenchmark.name}
            </span>
            <span className="text-slate-500 hidden md:inline">• {currentBenchmark.description}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-500">معدل المستهدف العام:</span>
            <span className="text-amber-400 font-bold">{avgBenchmarkPct}%</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Student Average */}
        <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex items-center gap-3.5 relative overflow-hidden">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">متوسط تحصيلك الحالي</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">{avgStudentPct}%</span>
              <span className="text-[10px] text-slate-400">({testedChapters.length} فصول اختُبرت)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Benchmark Target */}
        <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex items-center gap-3.5 relative overflow-hidden">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">متوسط المعيار المقارن</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-cyan-300">{avgBenchmarkPct}%</span>
              <span className="text-[10px] text-slate-400">الهدف المرجعي</span>
            </div>
          </div>
        </div>

        {/* Card 3: Gap Index */}
        <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex items-center gap-3.5 relative overflow-hidden">
          <div className={`p-3 rounded-xl border ${
            overallGap >= 0
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {overallGap >= 0 ? <TrendingUp className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">مؤشر الفجوة المعرفية</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono ${overallGap >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {overallGap >= 0 ? `+${overallGap}%` : `${overallGap}%`}
              </span>
              <span className="text-[10px] text-slate-400">
                {overallGap >= 0 ? 'تفوق على المعيار' : `${gapCount} فصول تحتاج دعم`}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Percentile Rank */}
        <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex items-center gap-3.5 relative overflow-hidden">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">الترتيب التقديري بالجمهورية</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-amber-300">{percentileEst}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Comparative Bar Analytics & Chapter Breakdown */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-850 pb-4">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>مقارنة أداء الفصول الستة مع {currentBenchmark.name}</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              كل عمود مزدوج يعرض نسبتك مقارنة بالمتوسط المستهدف. الفجوة السلبية باللون الأحمر تعبر عن نقص تحصيلي محدد.
            </p>
          </div>

          {/* Quick Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setShowOnlyGaps(!showOnlyGaps)}
              className={`px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                showOnlyGaps
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>إظهار الفجوات المعرفية فقط ({gapCount})</span>
            </button>

            <select
              value={activeChapterFilter}
              onChange={(e) => setActiveChapterFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-slate-900 text-slate-200 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">جميع الفصول (6)</option>
              {allLectures.map(l => (
                <option key={l.id} value={l.id}>فصل {l.id}: {l.arabicTitle}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Visual Dual Bars Chart */}
        <div className="space-y-5 pt-2">
          {filteredChapters.map(item => {
            const { lecture, studentPct, benchmarkPct, gap, isTested, status, diagnostics } = item;

            return (
              <motion.div
                key={lecture.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition-all space-y-3"
              >
                {/* Chapter Row Title & Badges */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center border border-emerald-500/20">
                      {lecture.id}
                    </span>
                    <div>
                      <h5 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{lecture.arabicTitle}</span>
                      </h5>
                      <span className="text-[10px] text-slate-400">{lecture.subtitle}</span>
                    </div>
                  </div>

                  {/* Status & Gap Tag */}
                  <div className="flex items-center gap-2 font-mono text-xs">
                    {isTested ? (
                      <>
                        <span className="text-slate-400">أداؤك: <strong className="text-emerald-400 font-bold">{studentPct}%</strong></span>
                        <span className="text-slate-600">vs</span>
                        <span className="text-slate-400">الهدف: <strong className="text-cyan-400 font-bold">{benchmarkPct}%</strong></span>

                        {gap >= 0 ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>+{gap}% تفوق</span>
                          </span>
                        ) : (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            <span>فجوة {gap}%</span>
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                        لم يختبر بعد
                      </span>
                    )}

                    <button
                      onClick={() => onSelectLectureForQuiz(lecture.id)}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1 cursor-pointer transition-all mr-2"
                    >
                      <span>حل الأسئلة</span>
                      <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  </div>
                </div>

                {/* Dual Progress Bars */}
                <div className="space-y-2 pt-1">
                  {/* Student Progress Line */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>أداء الطالب الحالي</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-400">{studentPct}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          studentPct >= 80
                            ? 'bg-gradient-to-l from-emerald-500 to-teal-400'
                            : studentPct >= 50
                            ? 'bg-gradient-to-l from-amber-500 to-yellow-400'
                            : studentPct > 0
                            ? 'bg-gradient-to-l from-rose-500 to-orange-500'
                            : 'bg-slate-800'
                        }`}
                        style={{ width: `${studentPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Benchmark Progress Line */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        <span>المستهدف ({currentBenchmark.name})</span>
                      </span>
                      <span className="font-mono font-bold text-cyan-400">{benchmarkPct}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-l from-cyan-500 to-blue-500 rounded-full transition-all duration-700 opacity-80"
                        style={{ width: `${benchmarkPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Knowledge Gap Diagnostic Details */}
                {diagnostics && (
                  <div className="bg-slate-950/70 border border-slate-850 rounded-xl p-3.5 mt-2 text-xs space-y-3">
                    <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-850 pb-2">
                      <span className="flex items-center gap-1.5 text-amber-300 text-[11px]">
                        <Cpu className="w-3.5 h-3.5 text-amber-400" />
                        <span>تحليل المحاور المعرفية الدقيقة والمفاهيم الشائعة بالفصل:</span>
                      </span>
                      <span className="text-[10px] text-slate-500">منهج وزارة التربية والتعليم 2026</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {diagnostics.coreTopics.map((topic, i) => (
                        <div key={i} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-1">
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[11px] font-bold text-slate-200 leading-tight">{topic.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap ${
                              topic.difficulty === 'عالية'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {topic.difficulty}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                            <span>تأثير الفجوة:</span>
                            <span className="font-mono font-bold text-rose-400">{topic.avgGapImpact}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Common Misconception warning */}
                    <div className="bg-amber-500/5 border-r-2 border-amber-500 p-2 rounded-l-lg text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>أهم الأخطاء الشائعة بين الطلاب:</strong> {diagnostics.commonMisconceptions[0]}
                      </div>
                    </div>

                    {/* Action Recommendation */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1 text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>خطة الترميم الموصى بها: <strong className="text-emerald-300">{diagnostics.remediationAdvice}</strong></span>
                      </span>

                      <button
                        onClick={() => {
                          onSelectLectureForQuiz(lecture.id);
                          onToast?.(`🎯 تم الانتقال إلى بنك أسئلة الفصل ${lecture.id} لترميم الفجوة المعرفية!`);
                        }}
                        className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all self-end sm:self-auto text-[11px]"
                      >
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ابدأ تدريب الفجوة المعرفية الآن</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Global Remediation Strategy & Action Recommendations */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h4 className="text-base font-bold text-white">خطة العمل التنفيذية لسد الفجوات المعرفية وترميم المستويات</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">1</span>
            <h5 className="font-bold text-white text-sm">المراجعة النوعية المركزة</h5>
            <p className="text-slate-400 leading-relaxed">
              ركز أولاً على الفصول ذات الفجوة المعرفية العالية (باللون الأحمر). اقرأ ملخص الدرس وبطاقات الاستذكار الخاصة بالنقاط الشائعة الخطأ.
            </p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs">2</span>
            <h5 className="font-bold text-white text-sm">التدريب المكثف على بنك الأسئلة</h5>
            <p className="text-slate-400 leading-relaxed">
              حل 20 سؤالاً على الأقل في كل فصل تنخفض فيه نسبتك عن {avgBenchmarkPct}%. استخدم حاسبة المسائل الحيوية للتحقق من قوانين الـ DNA والمناعة.
            </p>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">3</span>
            <h5 className="font-bold text-white text-sm">خوض اختبارات المحاكاة الشاملة</h5>
            <p className="text-slate-400 leading-relaxed">
              قم بإنشاء اختبار محاكاة من 50 سؤالاً أو خوض امتحانات الوزارة السابقة لتقييم سرعة الإجابة والتحكم في الوقت تحت وضع التركيز التام.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
