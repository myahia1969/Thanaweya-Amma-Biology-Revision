import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { biologyFormulas, BiologyFormula } from '../data/biologyFormulas';
import { FormulaDiagram } from './FormulaDiagram';
import {
  FileText,
  Search,
  X,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Sparkles,
  Zap,
  BookOpen,
  CheckCircle2,
  Filter,
  Heart
} from 'lucide-react';

interface FloatingFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedTopicKeyword?: string; // Optional context from current question
}

export function FloatingFormulaModal({
  isOpen,
  onClose,
  suggestedTopicKeyword = ''
}: FloatingFormulaModalProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'favorites' | 'movement' | 'genetics' | 'immunology'>('all');
  const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null);
  const [showDiagrams, setShowDiagrams] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Favorites state persisted in localStorage
  const [favoritedFormulaIds, setFavoritedFormulaIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('biology_favorited_formulas');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Re-sync favorites whenever modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('biology_favorited_formulas');
        if (saved) setFavoritedFormulaIds(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoritedFormulaIds(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      try {
        localStorage.setItem('biology_favorited_formulas', JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  // Sync auto-suggested keyword when opened
  useEffect(() => {
    if (suggestedTopicKeyword && isOpen) {
      setSearchQuery(suggestedTopicKeyword);
    }
  }, [suggestedTopicKeyword, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter formulas
  const filteredFormulas = biologyFormulas.filter(formula => {
    const matchesCategory =
      activeCategory === 'all'
        ? true
        : activeCategory === 'favorites'
        ? favoritedFormulaIds.includes(formula.id)
        : formula.category === activeCategory;

    const matchesQuery =
      formula.arabicTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formula.expression.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formula.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formula.constantOrRatio.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesQuery;
  });

  const selectedFormula = biologyFormulas.find(f => f.id === selectedFormulaId) || filteredFormulas[0] || biologyFormulas[0];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:justify-end p-2 sm:p-4 pointer-events-none" dir="rtl">
        
        {/* Semi-transparent backdrop for dimming without blocking view completely */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs pointer-events-auto"
        />

        {/* Floating Mini Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`pointer-events-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col w-full max-w-xl overflow-hidden relative z-10 font-sans text-right ${
            isMinimized ? 'h-auto max-h-24' : 'h-[85vh] sm:h-[75vh] max-h-[680px]'
          }`}
        >
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 p-3.5 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>التنقل السريع - مرجع القوانين</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    أثناء الاختبار ⚡
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">استعرض القانون والرسومات دون فقدان التقدم</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Toggle Diagrams Visibility */}
              <button
                onClick={() => setShowDiagrams(!showDiagrams)}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  showDiagrams
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title={showDiagrams ? "إخفاء الرسومات" : "عرض الرسومات التوضيحية"}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">{showDiagrams ? 'الرسومات مفعلة' : 'بدون رسم'}</span>
              </button>

              {/* Minimize / Maximize Button */}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750 cursor-pointer"
                title={isMinimized ? "تكبير" : "تصغير النافذة"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                title="إغلاق والعودة للاختبار (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex flex-col flex-1 overflow-hidden p-3 space-y-3">
              {/* Search Bar & Categories */}
              <div className="space-y-2 shrink-0">
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن قانون أو اسم العضلة/الخلايا/DNA..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute left-2.5 top-2.5 text-slate-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Categories Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap cursor-pointer transition-all ${
                      activeCategory === 'all'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    الكل ({biologyFormulas.length})
                  </button>
                  <button
                    onClick={() => setActiveCategory('favorites')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 ${
                      activeCategory === 'favorites'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-950 text-rose-400 border border-rose-500/30 hover:bg-slate-900'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${favoritedFormulaIds.length > 0 ? 'fill-current text-rose-300' : ''}`} />
                    <span>❤️ المفضلة ({favoritedFormulaIds.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveCategory('movement')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap cursor-pointer transition-all ${
                      activeCategory === 'movement'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    الدعامة والحركة ({biologyFormulas.filter(f => f.category === 'movement').length})
                  </button>
                  <button
                    onClick={() => setActiveCategory('genetics')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap cursor-pointer transition-all ${
                      activeCategory === 'genetics'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    البيولوجيا الجزيئية ({biologyFormulas.filter(f => f.category === 'genetics').length})
                  </button>
                  <button
                    onClick={() => setActiveCategory('immunology')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap cursor-pointer transition-all ${
                      activeCategory === 'immunology'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    المناعة ({biologyFormulas.filter(f => f.category === 'immunology').length})
                  </button>
                </div>
              </div>

              {/* Main Content Area: Horizontal or List Split */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {filteredFormulas.length === 0 ? (
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs space-y-2">
                    {activeCategory === 'favorites' ? (
                      <>
                        <Heart className="w-6 h-6 text-rose-400 mx-auto" />
                        <p className="font-bold text-slate-300">لا توجد قوانين مفضلة بعد</p>
                        <p className="text-[11px] text-slate-400">انقر على أيقونة القلب ❤️ بجوار عنوان أي قانون لإضافته لقائمة المفضلة.</p>
                      </>
                    ) : (
                      <p>🔍 لا توجد قوانين مطابقة لبحثك. جرب كلمات أخرى مثل "ساركومير" أو "تائية" أو "تشارجاف".</p>
                    )}
                  </div>
                ) : (
                  filteredFormulas.map(formula => {
                    const isSelected = selectedFormula?.id === formula.id;
                    const isFav = favoritedFormulaIds.includes(formula.id);

                    return (
                      <div
                        key={formula.id}
                        onClick={() => setSelectedFormulaId(formula.id)}
                        className={`rounded-xl border p-3.5 space-y-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-950 border-emerald-500/60 shadow-lg shadow-emerald-500/5'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                        }`}
                      >
                        {/* Header & Category Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`inline-block text-[9px] px-2 py-0.5 rounded font-black mb-1 ${
                              formula.category === 'movement'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : formula.category === 'genetics'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}>
                              {formula.category === 'movement' ? 'الدعامة والحركة' : formula.category === 'genetics' ? 'البيولوجيا الجزيئية' : 'المناعة'}
                            </span>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white">{formula.arabicTitle}</h4>
                              <button
                                onClick={(e) => toggleFavorite(formula.id, e)}
                                className={`p-1 rounded transition-all cursor-pointer ${
                                  isFav ? 'text-rose-400 hover:text-rose-300' : 'text-slate-500 hover:text-rose-400'
                                }`}
                                title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                              </button>
                            </div>
                          </div>

                          <span className="text-[10px] text-slate-500 font-mono dir-ltr">{formula.title}</span>
                        </div>

                        {/* Expression Formula Box */}
                        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-lg p-3 text-center">
                          <span className="block text-[9px] text-emerald-400 font-bold mb-0.5">الصيغة الرياضية المباشرة:</span>
                          <span className="text-xs sm:text-sm font-extrabold text-white leading-relaxed font-mono tracking-wide">
                            {formula.expression}
                          </span>
                        </div>

                        {/* Constant/Ratio & Brief Tip */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg">
                            <span className="text-[9px] text-slate-400 font-bold block">النسبة / الثابت:</span>
                            <span className="font-bold text-amber-300">{formula.constantOrRatio}</span>
                          </div>
                          <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg">
                            <span className="text-[9px] text-slate-400 font-bold block">ملاحظة سريعة:</span>
                            <span className="text-slate-300 text-[10px] leading-tight block line-clamp-2">{formula.explanation}</span>
                          </div>
                        </div>

                        {/* Visual SVG Diagram (If enabled) */}
                        {showDiagrams && (
                          <FormulaDiagram formulaId={formula.id} category={formula.category} />
                        )}

                        {/* Example Question Accordion */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-[11px] space-y-1">
                          <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            مثال تطبيقي سريع:
                          </span>
                          <p className="text-slate-300 text-[11px]">{formula.exampleQuestion}</p>
                          <div className="bg-slate-950 p-2 rounded text-emerald-400 font-mono text-[10px] border border-slate-850 mt-1">
                            💡 الحل: {formula.exampleAnswer}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Footer Bar */}
          <div className="bg-slate-950 border-t border-slate-800 p-2.5 text-center text-[10px] text-slate-400 flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>اضغط (Esc) أو زر الإغلاق للعودة لمتابعة حل الأسئلة مباشرة</span>
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer transition-all"
            >
              متابعة الاختبار 🚀
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
