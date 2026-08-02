import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Zap, Layers, Activity, Sparkles, AlertCircle, Brain } from 'lucide-react';

interface FormulaDiagramProps {
  formulaId: string;
  category: 'movement' | 'genetics' | 'immunology';
}

export function FormulaDiagram({ formulaId, category }: FormulaDiagramProps) {
  // Contraction state simulation for Muscle/Sarcomere formulas
  const [isContracted, setIsContracted] = useState<boolean>(false);
  
  // Interactive Label Mode state
  const [labelMode, setLabelMode] = useState<'show' | 'quiz'>('show');
  const [revealedLabels, setRevealedLabels] = useState<Record<string, boolean>>({});

  const toggleLabel = (id: string) => {
    setRevealedLabels(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 1. SARCOMERE & MOVEMENT DIAGRAMS
  if (category === 'movement') {
    if (formulaId === 'z_lines' || formulaId === 'dark_bands_a' || formulaId === 'h_zones' || formulaId === 'complete_i_bands' || formulaId === 'incomplete_i_bands') {
      return (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 font-sans">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>مخطط الساركومير التفاعلي (القطعة العضلية):</span>
            </span>

            <div className="flex items-center gap-2">
              {/* Label Mode Button */}
              <button
                onClick={() => setLabelMode(labelMode === 'show' ? 'quiz' : 'show')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  labelMode === 'quiz'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                <Brain className="w-3 h-3 text-amber-400" />
                <span>{labelMode === 'quiz' ? '🧠 وضع اختباري (Quiz)' : '👁️ التسميات الكاملة'}</span>
              </button>

              {/* Contraction Simulation Toggle Button */}
              <button
                onClick={() => setIsContracted(!isContracted)}
                className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isContracted
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>{isContracted ? 'حالة: انقباض تام (H = 0)' : 'حالة: انبساط (طبيعي)'}</span>
              </button>
            </div>
          </div>

          {/* SVG SARCOMERE VISUALIZER */}
          <div className="relative w-full overflow-hidden bg-slate-900/90 rounded-lg p-3 border border-slate-850">
            <svg viewBox="0 0 500 130" className="w-full h-auto max-h-[160px]">
              {/* Background Bands Shadow */}
              <defs>
                <linearGradient id="aBandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#b45309" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="hZoneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                  <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.15" />
                </linearGradient>
              </defs>

              {/* Dynamic Measurements based on contraction */}
              {/* Normal width: Z1=60, Z2=440. Contracted: Z1=130, Z2=370 */}
              {(() => {
                const z1 = isContracted ? 130 : 60;
                const z2 = isContracted ? 370 : 440;
                const hWidth = isContracted ? 0 : 90;
                const hStart = 250 - hWidth / 2;

                return (
                  <g>
                    {/* Dark A-Band Box */}
                    <rect x="160" y="20" width="180" height="90" fill="url(#aBandGrad)" rx="6" />

                    {/* H-Zone Box */}
                    {!isContracted && (
                      <rect x={hStart} y="20" width={hWidth} height="90" fill="url(#hZoneGrad)" rx="4" />
                    )}

                    {/* Thick Myosin Filaments (Central Dark Lines) */}
                    <line x1="160" y1="45" x2="340" y2="45" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
                    <line x1="160" y1="65" x2="340" y2="65" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
                    <line x1="160" y1="85" x2="340" y2="85" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />

                    {/* Thin Actin Filaments (Left Attached to Z1) */}
                    <line x1={z1} y1="35" x2={z1 + (isContracted ? 120 : 130)} y2="35" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
                    <line x1={z1} y1="55" x2={z1 + (isContracted ? 120 : 130)} y2="55" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
                    <line x1={z1} y1="75" x2={z1 + (isContracted ? 120 : 130)} y2="75" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
                    <line x1={z1} y1="95" x2={z1 + (isContracted ? 120 : 130)} y2="95" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />

                    {/* Thin Actin Filaments (Right Attached to Z2) */}
                    <line x1={z2} y1="35" x2={z2 - (isContracted ? 120 : 130)} y2="35" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
                    <line x1={z2} y1="55" x2={z2 - (isContracted ? 120 : 130)} y2="55" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
                    <line x1={z2} y1="75" x2={z2 - (isContracted ? 120 : 130)} y2="75" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
                    <line x1={z2} y1="95" x2={z2 - (isContracted ? 120 : 130)} y2="95" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />

                    {/* Z-Line Left */}
                    <line x1={z1} y1="15" x2={z1} y2="115" stroke="#ef4444" strokeWidth="4" strokeDasharray="4 2" />
                    <text x={z1} y="10" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">خط Z1</text>

                    {/* Z-Line Right */}
                    <line x1={z2} y1="15" x2={z2} y2="115" stroke="#ef4444" strokeWidth="4" strokeDasharray="4 2" />
                    <text x={z2} y="10" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle">خط Z2</text>

                    {/* Labels */}
                    <text x="250" y="125" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle">
                      المنطقة الداكنة (A) = 1 ثابتة
                    </text>
                    {!isContracted ? (
                      <text x="250" y="70" fill="#fef08a" fontSize="10" fontWeight="bold" textAnchor="middle">
                        شبه مضيئة (H)
                      </text>
                    ) : (
                      <text x="250" y="70" fill="#f87171" fontSize="11" fontWeight="black" textAnchor="middle">
                        H = 0 (تلاشي تماماً!)
                      </text>
                    )}
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-center font-bold">
            <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg">
              <span className="text-red-400 block">خطوط Z</span>
              <span className="text-slate-200 font-mono">القطع + 1</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg">
              <span className="text-amber-400 block">منطقة داكنة A</span>
              <span className="text-slate-200 font-mono">تساوي القطع</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg">
              <span className="text-cyan-400 block">مضيئة غير كاملة</span>
              <span className="text-slate-200 font-mono">دائماً = 2</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg">
              <span className="text-amber-300 block">شبه مضيئة H</span>
              <span className="text-slate-200 font-mono">{isContracted ? 'صفر' : 'تساوي القطع'}</span>
            </div>
          </div>
        </div>
      );
    }

    if (formulaId === 'motor_units_ratio') {
      return (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 font-sans">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>مخطط الوحدة الحركية (Motor Unit Ratio):</span>
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
              نسبة 1 : (5 إلى 100)
            </span>
          </div>

          <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-850 text-center space-y-2">
            <svg viewBox="0 0 400 90" className="w-full h-auto max-h-[110px]">
              {/* Motor Neuron (Axon) */}
              <circle cx="30" cy="45" r="14" fill="#10b981" />
              <text x="30" y="49" fill="#022c22" fontSize="10" fontWeight="extrabold" textAnchor="middle">عصب</text>
              <line x1="44" y1="45" x2="120" y2="45" stroke="#10b981" strokeWidth="4" />

              {/* Branches */}
              <path d="M 120 45 L 180 20 M 120 45 L 180 45 M 120 45 L 180 70" stroke="#10b981" strokeWidth="2.5" strokeDasharray="3 2" />

              {/* Muscle Fibers */}
              <rect x="180" y="10" width="190" height="20" rx="4" fill="#334155" stroke="#f59e0b" strokeWidth="1.5" />
              <rect x="180" y="35" width="190" height="20" rx="4" fill="#334155" stroke="#f59e0b" strokeWidth="1.5" />
              <rect x="180" y="60" width="190" height="20" rx="4" fill="#334155" stroke="#f59e0b" strokeWidth="1.5" />

              <text x="275" y="24" fill="#fef08a" fontSize="9" fontWeight="bold" textAnchor="middle">ليفة عضلية 1</text>
              <text x="275" y="49" fill="#fef08a" fontSize="9" fontWeight="bold" textAnchor="middle">ليفة عضلية 2 ... حتى 100</text>
              <text x="275" y="74" fill="#fef08a" fontSize="9" fontWeight="bold" textAnchor="middle">صفائح نهائية حركية</text>
            </svg>
          </div>
        </div>
      );
    }
  }

  // 2. GENETICS DIAGRAMS
  if (category === 'genetics') {
    if (formulaId === 'chargaff_rule' || formulaId === 'dna_turns') {
      return (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 font-sans">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="font-extrabold text-indigo-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>مخطط اللولب المزدوج وقاعدة تشارجاف (A=T, G≡C):</span>
            </span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
              1 لفة = 20 نيوكليوتيدة
            </span>
          </div>

          <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-850">
            <svg viewBox="0 0 450 110" className="w-full h-auto max-h-[130px]">
              {/* Helical DNA Ribbons */}
              <path d="M 20 20 Q 90 90, 160 20 T 300 20 T 430 20" fill="none" stroke="#6366f1" strokeWidth="3" />
              <path d="M 20 90 Q 90 20, 160 90 T 300 90 T 430 90" fill="none" stroke="#38bdf8" strokeWidth="3" />

              {/* Base Pair Rungs */}
              {/* A=T Double Hydrogen Bond */}
              <line x1="55" y1="43" x2="55" y2="67" stroke="#10b981" strokeWidth="3" />
              <text x="55" y="36" fill="#34d399" fontSize="10" fontWeight="black" textAnchor="middle">A</text>
              <text x="55" y="80" fill="#f59e0b" fontSize="10" fontWeight="black" textAnchor="middle">T</text>
              <text x="55" y="58" fill="#6ee7b7" fontSize="8" fontWeight="bold" textAnchor="middle">=</text>

              {/* G=C Triple Hydrogen Bond */}
              <line x1="125" y1="43" x2="125" y2="67" stroke="#8b5cf6" strokeWidth="3" />
              <text x="125" y="36" fill="#c084fc" fontSize="10" fontWeight="black" textAnchor="middle">G</text>
              <text x="125" y="80" fill="#38bdf8" fontSize="10" fontWeight="black" textAnchor="middle">C</text>
              <text x="125" y="58" fill="#e9d5ff" fontSize="8" fontWeight="bold" textAnchor="middle">≡</text>

              {/* A=T */}
              <line x1="230" y1="43" x2="230" y2="67" stroke="#10b981" strokeWidth="3" />
              <text x="230" y="36" fill="#34d399" fontSize="10" fontWeight="black" textAnchor="middle">A</text>
              <text x="230" y="80" fill="#f59e0b" fontSize="10" fontWeight="black" textAnchor="middle">T</text>

              {/* G=C */}
              <line x1="300" y1="43" x2="300" y2="67" stroke="#8b5cf6" strokeWidth="3" />
              <text x="300" y="36" fill="#c084fc" fontSize="10" fontWeight="black" textAnchor="middle">G</text>
              <text x="300" y="80" fill="#38bdf8" fontSize="10" fontWeight="black" textAnchor="middle">C</text>

              <text x="375" y="58" fill="#a5b4fc" fontSize="10" fontWeight="bold" textAnchor="middle">
                اللفة = 10 أزواج (20)
              </text>
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-center">
            <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-emerald-300">
              رابطتان هيدروجينيتان: A = T
            </div>
            <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-indigo-300">
              ثلاث روابط هيدروجينية: G ≡ C
            </div>
          </div>
        </div>
      );
    }

    if (formulaId === 'mrna_codons' || formulaId === 'amino_acids_protein' || formulaId === 'peptide_bonds_water') {
      return (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 font-sans">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="font-extrabold text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>مخطط كودونات mRNA وسلسلة البروتين (-H₂O):</span>
            </span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
              الأحماض = الكودونات - 1
            </span>
          </div>

          <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-850">
            <svg viewBox="0 0 450 90" className="w-full h-auto max-h-[110px]">
              {/* mRNA Strand */}
              <rect x="20" y="55" width="410" height="18" rx="4" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
              <text x="35" y="68" fill="#a5b4fc" fontSize="9" fontWeight="bold">5' AUG</text>
              <text x="140" y="68" fill="#a5b4fc" fontSize="9" fontWeight="bold">Codon 2</text>
              <text x="255" y="68" fill="#a5b4fc" fontSize="9" fontWeight="bold">Codon N</text>
              <text x="375" y="68" fill="#f43f5e" fontSize="9" fontWeight="black">Stop (UAA) 3'</text>

              {/* Amino Acid Chain Above */}
              <circle cx="50" cy="22" r="12" fill="#10b981" />
              <text x="50" y="25" fill="#022c22" fontSize="9" fontWeight="black" textAnchor="middle">Met</text>

              <line x1="62" y1="22" x2="138" y2="22" stroke="#f59e0b" strokeWidth="3" />
              <text x="100" y="15" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle">- H₂O</text>

              <circle cx="150" cy="22" r="12" fill="#3b82f6" />
              <text x="150" y="25" fill="#1e3a8a" fontSize="9" fontWeight="black" textAnchor="middle">AA2</text>

              <line x1="162" y1="22" x2="258" y2="22" stroke="#f59e0b" strokeWidth="3" />
              <text x="210" y="15" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle">- H₂O</text>

              <circle cx="270" cy="22" r="12" fill="#8b5cf6" />
              <text x="270" y="25" fill="#2e1065" fontSize="9" fontWeight="black" textAnchor="middle">AAn</text>

              {/* X mark over Stop Codon (no amino acid) */}
              <line x1="380" y1="12" x2="400" y2="32" stroke="#ef4444" strokeWidth="3" />
              <line x1="400" y1="12" x2="380" y2="32" stroke="#ef4444" strokeWidth="3" />
              <text x="390" y="42" fill="#f87171" fontSize="8" fontWeight="bold" textAnchor="middle">لا يترجم</text>
            </svg>
          </div>
        </div>
      );
    }
  }

  // 3. IMMUNOLOGY DIAGRAMS
  if (category === 'immunology') {
    if (formulaId === 'wbc_lymphocytes' || formulaId === 'lymphocytes_t_cells' || formulaId === 'lymphocytes_b_cells' || formulaId === 'lymphocytes_nk_cells') {
      return (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 font-sans">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="font-extrabold text-cyan-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>توزيع خلايا الدم البيضاء والليمفاوية:</span>
            </span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
              الليمفاوية = 25% متوسط
            </span>
          </div>

          <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-850 space-y-3">
            {/* Visual Bar Spectrum */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-300">
                <span>إجمالي خلايا الدم البيضاء WBC (100%)</span>
                <span className="text-cyan-400">الليمفاوية (20% - 30%)</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 flex">
                <div className="w-3/4 bg-slate-700 text-[9px] text-slate-300 font-bold flex items-center justify-center">
                  أخرى (75%)
                </div>
                <div className="w-1/4 bg-gradient-to-r from-cyan-500 to-blue-600 text-[9px] text-slate-950 font-black flex items-center justify-center">
                  ليمفاوية (25%)
                </div>
              </div>
            </div>

            {/* Sub-breakdown of Lymphocytes */}
            <div className="space-y-1.5 border-t border-slate-800 pt-2">
              <span className="text-[11px] font-bold text-slate-400 block">تقسيم الخلايا الليمفاوية داخل الـ 25%:</span>
              <div className="w-full bg-slate-950 rounded-full h-3.5 overflow-hidden border border-slate-800 flex text-[9px] font-black text-slate-950 text-center">
                <div className="w-[80%] bg-indigo-400 flex items-center justify-center">
                  تائية T (80%)
                </div>
                <div className="w-[12.5%] bg-amber-400 flex items-center justify-center">
                  بائية B
                </div>
                <div className="w-[7.5%] bg-rose-400 flex items-center justify-center">
                  NK
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-center">
            <div className="bg-indigo-950/60 border border-indigo-500/30 p-1.5 rounded-lg text-indigo-300">
              تائية T: 80% (ثابتة)
            </div>
            <div className="bg-amber-950/60 border border-amber-500/30 p-1.5 rounded-lg text-amber-300">
              بائية B: 10% - 15% (12.5%)
            </div>
            <div className="bg-rose-950/60 border border-rose-500/30 p-1.5 rounded-lg text-rose-300">
              قاتلة NK: 5% - 10% (7.5%)
            </div>
          </div>
        </div>
      );
    }

    if (formulaId === 'antibody_binding_sites_igm' || formulaId === 'standard_antibody_binding_sites') {
      return (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 font-sans">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="font-extrabold text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>مواقع ارتباط الأجسام المضادة (IgM vs IgG):</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Standard Y-shape Antibody (2 sites) */}
            <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-850 text-center space-y-1">
              <span className="text-[11px] font-extrabold text-cyan-300 block">الجسم المضاد العادي (IgG, IgA, IgD, IgE)</span>
              <svg viewBox="0 0 120 80" className="w-24 h-auto mx-auto">
                <path d="M 30 15 L 60 45 L 90 15 M 60 45 L 60 75" stroke="#38bdf8" strokeWidth="5" fill="none" strokeLinecap="round" />
                <circle cx="30" cy="15" r="6" fill="#ef4444" />
                <circle cx="90" cy="15" r="6" fill="#ef4444" />
              </svg>
              <span className="text-[10px] font-black text-rose-400 block bg-rose-500/10 rounded py-0.5 border border-rose-500/20">
                موقعان للارتباط (2 sites)
              </span>
            </div>

            {/* Pentameric IgM (10 sites) */}
            <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-850 text-center space-y-1">
              <span className="text-[11px] font-extrabold text-amber-300 block">المركب الخماسي IgM</span>
              <svg viewBox="0 0 120 80" className="w-24 h-auto mx-auto">
                {/* 5-pointed Star Shape representation */}
                <circle cx="60" cy="40" r="16" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                {Array.from({ length: 5 }, (_, i) => {
                  const angle = (i * 72 - 90) * (Math.PI / 180);
                  const x1 = 60 + Math.cos(angle) * 16;
                  const y1 = 40 + Math.sin(angle) * 16;
                  const x2 = 60 + Math.cos(angle) * 34;
                  const y2 = 40 + Math.sin(angle) * 34;
                  return (
                    <g key={i}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth="3" />
                      <circle cx={x2} cy={y2} r="4" fill="#ef4444" />
                    </g>
                  );
                })}
              </svg>
              <span className="text-[10px] font-black text-amber-300 block bg-amber-500/10 rounded py-0.5 border border-amber-500/20">
                10 مواقع ارتباط بالأنتیجين!
              </span>
            </div>
          </div>
        </div>
      );
    }
  }

  return null;
}
