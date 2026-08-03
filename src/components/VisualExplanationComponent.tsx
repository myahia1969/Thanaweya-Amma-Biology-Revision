import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { useLanguage } from '../context/LanguageContext';
import { 
  Eye, 
  EyeOff, 
  HelpCircle, 
  Tag, 
  Sparkles, 
  CheckCircle2, 
  Sliders, 
  Info, 
  Layers, 
  RotateCcw, 
  Brain,
  Microscope,
  Flame,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Move,
  Camera,
  Download,
  Check,
  X,
  FileText,
  FileDown,
  Printer,
  GripVertical,
  XCircle,
  Trophy,
  Target,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { VisualTool, InteractiveLabel } from '../types';
import { recordDiagramLabelMistake } from '../utils/mistakeBankUtils';

interface VisualExplanationComponentProps {
  tool: VisualTool;
}

export const VisualExplanationComponent: React.FC<VisualExplanationComponentProps> = ({ tool }) => {
  const { isAr } = useLanguage();

  // Label mode state: 'full' (show all), 'quiz' (masked for active recall), 'dragQuiz' (drag-and-drop labeling), 'hidden' (hide all labels)
  const [labelMode, setLabelMode] = useState<'full' | 'quiz' | 'dragQuiz' | 'hidden'>('full');
  
  // Category filter for organelles / tissues / structures
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Drag-and-drop labeling quiz state
  const [dragAssignments, setDragAssignments] = useState<Record<string, string>>({});
  const [dragSlotStatus, setDragSlotStatus] = useState<Record<string, 'correct' | 'incorrect'>>({});
  const [selectedLabelForDrop, setSelectedLabelForDrop] = useState<string | null>(null);
  const [dragHoveredSlot, setDragHoveredSlot] = useState<string | null>(null);
  const [shuffledBankLabels, setShuffledBankLabels] = useState<InteractiveLabel[]>([]);
  const [failedAttemptsPerSlot, setFailedAttemptsPerSlot] = useState<Record<string, number>>({});
  const [mistakeToast, setMistakeToast] = useState<string | null>(null);
  const [hintedSlotId, setHintedSlotId] = useState<string | null>(null);
  const [hintToast, setHintToast] = useState<string | null>(null);
  
  // Revealed label state map (for Quiz mode active recall)
  const [revealedLabels, setRevealedLabels] = useState<Record<string, boolean>>({});

  // Individual toggled label visibility map
  const [individualToggles, setIndividualToggles] = useState<Record<string, boolean>>({});

  // Currently selected organelle/tissue pin detail modal or card
  const [activePin, setActivePin] = useState<InteractiveLabel | null>(null);

  // Fullscreen view toggle state for maximized biological diagram viewing
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Esc key listener to exit full-screen mode easily
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Diagram screenshot reference & state
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [captureSuccess, setCaptureSuccess] = useState<boolean>(false);

  // PDF Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  // Strict Zoom Constraints to prevent pixelation (MAX_ZOOM) or losing diagram frame (MIN_ZOOM)
  const MIN_ZOOM = 1.0;
  const MAX_ZOOM = 3.5;

  // Zoom and Pan state for microscopic diagram inspection
  const [zoomLevel, setZoomLevel] = useState<number>(MIN_ZOOM);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleCaptureScreenshot = async () => {
    if (!diagramRef.current) return;
    try {
      setIsCapturing(true);
      const dataUrl = await toPng(diagramRef.current, {
        cacheBust: true,
        quality: 0.95,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `${tool.title ? tool.title.replace(/\s+/g, '_') : 'diagram'}_${Math.round(zoomLevel * 100)}percent.png`;
      link.href = dataUrl;
      link.click();

      setCaptureSuccess(true);
      setTimeout(() => setCaptureSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to capture high-resolution diagram screenshot:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!diagramRef.current) return;
    try {
      setIsGeneratingPdf(true);

      const jspdfModule = await import('jspdf');
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default;

      // Temporarily reset zoom to 100% for high quality export if currently zoomed
      const prevZoom = zoomLevel;
      const prevPan = panOffset;
      if (zoomLevel !== 1) {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
        await new Promise(res => setTimeout(res, 120));
      }

      const dataUrl = await toPng(diagramRef.current, {
        cacheBust: true,
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#020617',
      });

      // Restore zoom if user was zooming
      if (prevZoom !== 1) {
        setZoomLevel(prevZoom);
        setPanOffset(prevPan);
      }

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const isLandscape = img.width > img.height;
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Printable PDF Header Banner
      pdf.setFillColor(15, 23, 42); // slate 900 background
      pdf.rect(0, 0, pageWidth, 26, 'F');

      pdf.setTextColor(16, 185, 129); // emerald 400 header accent
      pdf.setFontSize(14);
      const pdfTitle = tool.title || 'Biological Visual Diagram';
      pdf.text(pdfTitle, 12, 12);

      pdf.setTextColor(148, 163, 184); // slate 400 subtitle
      pdf.setFontSize(9);
      pdf.text(`High-Resolution Visual Diagram | Mode: ${labelMode.toUpperCase()} | Category: ${selectedCategory.toUpperCase()}`, 12, 20);

      // Diagram Dimensions Calculation
      const margin = 10;
      const topOffset = 30;
      const availableWidth = pageWidth - (margin * 2);
      const availableHeight = pageHeight - topOffset - 16;

      const imgRatio = img.width / img.height;
      let renderWidth = availableWidth;
      let renderHeight = renderWidth / imgRatio;

      if (renderHeight > availableHeight) {
        renderHeight = availableHeight;
        renderWidth = renderHeight * imgRatio;
      }

      const xPos = (pageWidth - renderWidth) / 2;
      const yPos = topOffset + ((availableHeight - renderHeight) / 2);

      // Draw active diagram and annotations onto PDF
      pdf.addImage(dataUrl, 'PNG', xPos, yPos, renderWidth, renderHeight);

      // Footer branding bar
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, pageHeight - 12, pageWidth, 12, 'F');
      pdf.setTextColor(203, 213, 225);
      pdf.setFontSize(8);
      pdf.text('Biology Thanaweya Amma Platform - Interactive Diagram Export', pageWidth / 2, pageHeight - 5, { align: 'center' });

      const safeTitle = (tool.title || 'Diagram').replace(/\s+/g, '_');
      pdf.save(`${safeTitle}_Visual_Explanation.pdf`);

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export PDF document:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Clamp pan offset within sensible diagram boundaries based on zoom scale
  const clampPan = (x: number, y: number, currentZoom: number) => {
    if (currentZoom <= MIN_ZOOM) return { x: 0, y: 0 };
    // Maximum allowed translation pixel offset relative to zoom ratio
    const maxOffset = (currentZoom - 1) * 220;
    return {
      x: Math.max(-maxOffset, Math.min(maxOffset, x)),
      y: Math.max(-maxOffset, Math.min(maxOffset, y))
    };
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => {
      const next = Math.min(MAX_ZOOM, Math.round((prev + 0.25) * 100) / 100);
      setPanOffset(p => clampPan(p.x, p.y, next));
      return next;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const next = Math.max(MIN_ZOOM, Math.round((prev - 0.25) * 100) / 100);
      if (next === MIN_ZOOM) {
        setPanOffset({ x: 0, y: 0 });
      } else {
        setPanOffset(p => clampPan(p.x, p.y, next));
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(MIN_ZOOM);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Scroll zoom feature with strict boundary enforcement
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoomLevel(prev => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((prev + delta) * 100) / 100));
      if (next === MIN_ZOOM) {
        setPanOffset({ x: 0, y: 0 });
      } else {
        setPanOffset(p => clampPan(p.x, p.y, next));
      }
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > MIN_ZOOM) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > MIN_ZOOM) {
      const rawX = e.clientX - dragStart.x;
      const rawY = e.clientY - dragStart.y;
      setPanOffset(clampPan(rawX, rawY, zoomLevel));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && zoomLevel > MIN_ZOOM) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1 && zoomLevel > MIN_ZOOM) {
      const rawX = e.touches[0].clientX - dragStart.x;
      const rawY = e.touches[0].clientY - dragStart.y;
      setPanOffset(clampPan(rawX, rawY, zoomLevel));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Generate fallback organelle & tissue labels if tool doesn't have explicit organelleTissueLabels
  const organelleLabels: InteractiveLabel[] = tool.organelleTissueLabels || [
    {
      id: `${tool.id}-lbl-1`,
      name: tool.storyboard.elements[0] ? tool.storyboard.elements[0].split(' ')[0] + ' ' + (tool.storyboard.elements[0].split(' ')[1] || '') : 'العضية الخلوية الرئيسة',
      type: 'organelle',
      arabicType: 'عضية خلوية',
      xPercent: 30,
      yPercent: 40,
      description: tool.storyboard.elements[0] || 'عضية حيوية تلعب دوراً مركزياً في الوظيفة الخلوية.'
    },
    {
      id: `${tool.id}-lbl-2`,
      name: tool.storyboard.elements[1] ? tool.storyboard.elements[1].split(' ')[0] + ' ' + (tool.storyboard.elements[1].split(' ')[1] || '') : 'النسيج الداعم',
      type: 'tissue',
      arabicType: 'نسيج حيوي',
      xPercent: 65,
      yPercent: 30,
      description: tool.storyboard.elements[1] || 'نسيج متخصص يوفر الدعامة والحماية للخلايا المجاورة.'
    },
    {
      id: `${tool.id}-lbl-3`,
      name: tool.storyboard.elements[2] ? tool.storyboard.elements[2].split(' ')[0] + ' ' + (tool.storyboard.elements[2].split(' ')[1] || '') : 'التركيب الهيكلي',
      type: 'structure',
      arabicType: 'تركيب تشريحي',
      xPercent: 50,
      yPercent: 70,
      description: tool.storyboard.elements[2] || 'تركيب محوري يحدد الهيكل البنائي والآلية العملية.'
    }
  ];

  // Filter labels based on category
  const filteredLabels = organelleLabels.filter(lbl => {
    if (selectedCategory === 'all') return true;
    return lbl.type === selectedCategory;
  });

  // Shuffle label pool whenever dragQuiz mode is active
  useEffect(() => {
    if (labelMode === 'dragQuiz') {
      const shuffled = [...organelleLabels].sort(() => Math.random() - 0.5);
      setShuffledBankLabels(shuffled);
    }
  }, [labelMode, tool.id]);

  const handleLabelDrop = (labelId: string, slotId: string) => {
    const isCorrect = labelId === slotId;
    
    // Remove labelId from any previous slot if already placed
    const updatedAssignments = { ...dragAssignments };
    Object.keys(updatedAssignments).forEach(key => {
      if (updatedAssignments[key] === labelId) {
        delete updatedAssignments[key];
      }
    });

    updatedAssignments[slotId] = labelId;
    setDragAssignments(updatedAssignments);

    setDragSlotStatus(prev => ({
      ...prev,
      [slotId]: isCorrect ? 'correct' : 'incorrect'
    }));

    if (!isCorrect) {
      const currentCount = failedAttemptsPerSlot[slotId] || 0;
      const newCount = currentCount + 1;
      setFailedAttemptsPerSlot(prev => ({ ...prev, [slotId]: newCount }));

      const targetSlotLbl = organelleLabels.find(l => l.id === slotId);
      const placedLbl = organelleLabels.find(l => l.id === labelId);

      const targetPartName = targetSlotLbl?.name || slotId;
      const wrongLabelPlacedName = placedLbl?.name || labelId;

      recordDiagramLabelMistake(
        tool.title || 'رسم توضيحي',
        targetPartName,
        slotId,
        wrongLabelPlacedName,
        targetSlotLbl?.description || 'تسمية بصرية على المخطط',
        1,
        'الشروحات البصرية - التسميات والتوضيحات'
      );

      const msg = isAr 
        ? `⚠️ محاولة خاطئة! تم حفظ الخطأ لـ "${targetPartName}" في بنك الأخطاء (إجمالي المحاولات الخاطئة: ${newCount})`
        : `⚠️ Failed attempt recorded for "${targetPartName}" in Mistake Bank (Total failed attempts: ${newCount})`;
      setMistakeToast(msg);
      setTimeout(() => setMistakeToast(null), 4000);
    }

    if (selectedLabelForDrop === labelId) {
      setSelectedLabelForDrop(null);
    }
  };

  const handleRemoveAssignment = (slotId: string) => {
    setDragAssignments(prev => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
    setDragSlotStatus(prev => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  };

  const handleResetDragQuiz = () => {
    setDragAssignments({});
    setDragSlotStatus({});
    setSelectedLabelForDrop(null);
    setHintedSlotId(null);
    setHintToast(null);
    const shuffled = [...organelleLabels].sort(() => Math.random() - 0.5);
    setShuffledBankLabels(shuffled);
  };

  const handleShowHint = () => {
    const unplacedSlots = organelleLabels.filter(lbl => dragSlotStatus[lbl.id] !== 'correct');
    
    if (unplacedSlots.length === 0) {
      const msg = isAr ? '✨ اكتمل الاختبار بنجاح! جميع التسميات صحيحة.' : '✨ Quiz complete! All labels are correctly placed.';
      setHintToast(msg);
      setTimeout(() => setHintToast(null), 3000);
      return;
    }

    let slotToHint: InteractiveLabel | undefined;
    if (selectedLabelForDrop) {
      slotToHint = unplacedSlots.find(l => l.id === selectedLabelForDrop);
    }

    if (!slotToHint) {
      slotToHint = unplacedSlots[Math.floor(Math.random() * unplacedSlots.length)];
    }

    if (slotToHint) {
      setHintedSlotId(slotToHint.id);
      const msg = isAr 
        ? `💡 تلميح: تم تسليط الضوء المؤقت على موضع "${slotToHint.name}"!`
        : `💡 Hint: Temporarily highlighting target zone for "${slotToHint.name}"!`;
      setHintToast(msg);

      setTimeout(() => {
        setHintedSlotId(null);
        setHintToast(null);
      }, 3500);
    }
  };

  const correctDragCount = Object.values(dragSlotStatus).filter(status => status === 'correct').length;
  const totalDragCount = organelleLabels.length;
  const isDragQuizComplete = totalDragCount > 0 && correctDragCount === totalDragCount;
  const unplacedLabels = shuffledBankLabels.filter(lbl => !Object.values(dragAssignments).includes(lbl.id));
  const totalFailedCount = (Object.values(failedAttemptsPerSlot) as number[]).reduce((a, b) => a + b, 0);

  // Toggle individual label in Quiz mode or toggle list
  const handleToggleReveal = (id: string) => {
    setRevealedLabels(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleIndividual = (id: string) => {
    setIndividualToggles(prev => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id]
    }));
  };

  const revealAllLabels = () => {
    const allRevealed: Record<string, boolean> = {};
    organelleLabels.forEach(lbl => {
      allRevealed[lbl.id] = true;
    });
    setRevealedLabels(allRevealed);
  };

  const resetAllLabels = () => {
    setRevealedLabels({});
  };

  // Calculate quiz progress
  const revealedCount = organelleLabels.filter(lbl => revealedLabels[lbl.id]).length;
  const totalCount = organelleLabels.length;

  return (
    <div 
      id="visual-explanation-container" 
      className={
        isFullscreen
          ? "fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl p-4 md:p-6 overflow-y-auto space-y-6 flex flex-col transition-all duration-300 animate-fadeIn"
          : "bg-slate-900/40 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl backdrop-blur-sm space-y-6"
      }
    >
      {/* Fullscreen Banner Notification when Fullscreen mode is active */}
      {isFullscreen && (
        <div className="bg-indigo-950/90 border border-indigo-500/50 rounded-xl p-3 flex items-center justify-between text-xs text-indigo-200 shadow-2xl shrink-0">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="font-bold">وضع الشاشة الكاملة نشِط — عرض مجهري مكبر للمخطط البايولوجي والتسميات</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">(اضغط Esc للخروج)</span>
            <button
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1.5 shadow-md border border-amber-300"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>إغلاق ملء الشاشة</span>
            </button>
          </div>
        </div>
      )}

      {/* Visual Component Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1 font-mono">
              <Microscope className="w-3 h-3 text-emerald-400" />
              تسميات الأنسجة والعضيات التفاعلية
            </span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white mt-1.5 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400 shrink-0" />
            {tool.title}
          </h3>
          <p className="text-xs text-slate-400 mt-1">النمذجة البصرية الشاملة مع وضع التسميات التفاعلي وتكبير الفحص المجهري.</p>
        </div>

        {/* Global Label Mode & Fullscreen Toggle Buttons */}
        <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex items-center gap-1 flex-wrap self-start md:self-auto">
          <button
            onClick={() => setLabelMode('full')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              labelMode === 'full'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>عرض التسميات</span>
          </button>

          <button
            onClick={() => setLabelMode('quiz')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              labelMode === 'quiz'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>{isAr ? 'وضع كشف الاختبار' : 'Active Recall Quiz'}</span>
          </button>

          <button
            onClick={() => setLabelMode('dragQuiz')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              labelMode === 'dragQuiz'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>{isAr ? 'اختبار السحب والإفلات' : 'Drag & Drop Quiz'}</span>
          </button>

          <button
            onClick={() => setLabelMode('hidden')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              labelMode === 'hidden'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>إخفاء التسميات</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            title={isAr ? "تحميل التوضيح البصري كملف PDF عالي الجودة للطباعة" : "Download active diagram and annotations as printable PDF"}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              pdfSuccess
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}
          >
            {pdfSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{isAr ? 'تم حفظ PDF!' : 'PDF Saved!'}</span>
              </>
            ) : isGeneratingPdf ? (
              <>
                <FileText className="w-3.5 h-3.5 animate-bounce text-rose-400" />
                <span>{isAr ? 'جاري إنشاء PDF...' : 'Generating PDF...'}</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-rose-400" />
                <span>{isAr ? 'تحميل PDF' : 'Download PDF'}</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              isFullscreen
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md font-black'
                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20 hover:text-white'
            }`}
            title={isFullscreen ? "تصغير الشاشة إلى الوضع العادي" : "عرض الرسمة والمخطط بملء الشاشة الكاملة (Fullscreen)"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />}
            <span>{isFullscreen ? 'تصغير الشاشة' : 'ملء الشاشة'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Label Mode Control Panel & Category Filters */}
      <div className="bg-slate-950/70 border border-slate-850 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Label Category Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-bold ml-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              تصفية العضيات/الأنسجة:
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                selectedCategory === 'all'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              الكل ({organelleLabels.length})
            </button>
            <button
              onClick={() => setSelectedCategory('organelle')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                selectedCategory === 'organelle'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              🔬 العضيات الخلوية
            </button>
            <button
              onClick={() => setSelectedCategory('tissue')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                selectedCategory === 'tissue'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              🌱 الأنسجة الحيوانية والنباتية
            </button>
            <button
              onClick={() => setSelectedCategory('structure')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                selectedCategory === 'structure'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              ⚙️ التراكيب والجسور
            </button>
          </div>

          {/* Quiz Mode Progress & Quick Actions */}
          {labelMode === 'quiz' && (
            <div className="flex items-center justify-between sm:justify-end gap-3 font-mono">
              <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 font-bold">
                تم كشف {revealedCount} من {totalCount} تسميات
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={revealAllLabels}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
                >
                  كشف الكل
                </button>
                <button
                  onClick={resetAllLabels}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  إعادة تعيين
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drag & Drop Quiz Control Box */}
        {labelMode === 'dragQuiz' && (
          <div className="labeling-quiz-container pt-3 border-t border-slate-800 space-y-3">
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3.5 space-y-3 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                    <Move className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      {isAr ? 'اختبار السحب والإفلات للتسميات' : 'Drag & Drop Labeling Quiz'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {isAr ? 'اسحب التسميات من البنك وضعها على الموضع الصحيح بالرسمة. يتم حفظ المحاولات الخاطئة في "بنك الأخطاء" تلقائياً.' : 'Drag labels onto diagram targets. Failed attempts are automatically saved to the Mistake Bank.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? `النتيجة: ${correctDragCount} / ${totalDragCount}` : `Score: ${correctDragCount} / ${totalDragCount}`}</span>
                  </div>

                  {totalFailedCount > 0 && (
                    <div className="bg-rose-950/60 border border-rose-500/40 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-rose-300 flex items-center gap-1.5 shadow-md">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      <span>{isAr ? `أخطاء بالبنك: ${totalFailedCount}` : `Banked Errors: ${totalFailedCount}`}</span>
                    </div>
                  )}

                  <button
                    onClick={handleShowHint}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                      hintedSlotId 
                        ? 'bg-amber-400 text-slate-950 border-amber-300 ring-4 ring-amber-400/40 animate-pulse font-black' 
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border-amber-500/40'
                    }`}
                    title={isAr ? "إظهار تلميح بؤري للموضع الصحيح" : "Show temporary zone hint"}
                  >
                    <HelpCircle className={`w-3.5 h-3.5 ${hintedSlotId ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span>{isAr ? 'تلميح' : 'Hint'}</span>
                  </button>

                  <button
                    onClick={handleResetDragQuiz}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isAr ? 'إعادة التعيين' : 'Reset Quiz'}</span>
                  </button>
                </div>
              </div>

              {/* Toast Notification for Record in Mistake Bank & Hint Messages */}
              <AnimatePresence>
                {mistakeToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-rose-950/90 border border-rose-500/50 rounded-xl p-2.5 text-rose-200 text-xs font-bold flex items-center justify-between shadow-xl"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{mistakeToast}</span>
                    </div>
                  </motion.div>
                )}
                {hintToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-amber-950/90 border border-amber-500/60 rounded-xl p-2.5 text-amber-200 text-xs font-bold flex items-center justify-between shadow-xl"
                  >
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                      <span>{hintToast}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Completion Celebration Notification */}
              {isDragQuizComplete && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-emerald-950/90 border-2 border-emerald-500/60 rounded-xl p-3 flex items-center justify-between text-emerald-200 text-xs shadow-2xl"
                >
                  <div className="flex items-center gap-2 font-bold">
                    <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span>{isAr ? '🎉 إنجاز رائع! أتممت تعيين جميع التسميات على المخطط بنجاح 100%!' : '🎉 Excellent! All labels correctly placed on the diagram!'}</span>
                  </div>
                  <button
                    onClick={handleResetDragQuiz}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                  >
                    {isAr ? 'إعادة الاختبار' : 'Retry Quiz'}
                  </button>
                </motion.div>
              )}

              {/* Draggable Label Pool */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <GripVertical className="w-4 h-4 text-cyan-400" />
                  {isAr ? 'بنك التسميات المتاحة للسحب (انقر أو اسحب بالتسمية):' : 'Available Labels Pool (Drag or Click to Select):'}
                </span>

                {unplacedLabels.length === 0 ? (
                  <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-center font-mono">
                    {isAr ? '✨ تم وضع جميع التسميات! تفقّد مواضعك بالرسمة أسفله.' : '✨ All labels placed! Check your placements on the diagram below.'}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {unplacedLabels.map(lbl => {
                      const isSelected = selectedLabelForDrop === lbl.id;
                      return (
                        <div
                          key={lbl.id}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', lbl.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onClick={() => setSelectedLabelForDrop(isSelected ? null : lbl.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-grab active:cursor-grabbing border flex items-center gap-2 shadow-md ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-300 ring-4 ring-amber-500/30 scale-105 shadow-xl font-black'
                              : 'bg-slate-950 hover:bg-slate-900 text-white border-slate-750 hover:border-cyan-400/60'
                          }`}
                        >
                          <GripVertical className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-slate-400'}`} />
                          <span>{lbl.name}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-900 text-slate-400'
                          }`}>
                            {lbl.arabicType}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Interactive Label Matrix Grid for Students */}
        {labelMode !== 'hidden' && labelMode !== 'dragQuiz' && (
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 mb-2 block">
              تسميات العضيات والأنسجة في هذه الرسمة (انقر على التسمية للتحكم أو الكشف):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredLabels.map((lbl) => {
                const isToggledOff = individualToggles[lbl.id] === false;
                const isRevealed = revealedLabels[lbl.id];

                return (
                  <div
                    key={lbl.id}
                    onClick={() => {
                      if (labelMode === 'quiz') {
                        handleToggleReveal(lbl.id);
                      } else {
                        handleToggleIndividual(lbl.id);
                      }
                      setActivePin(lbl);
                    }}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isToggledOff && labelMode === 'full'
                        ? 'bg-slate-900/40 border-slate-800 opacity-50'
                        : labelMode === 'quiz' && !isRevealed
                        ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/60'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        lbl.type === 'organelle' ? 'bg-cyan-400' :
                        lbl.type === 'tissue' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`} />
                      
                      <div className="truncate">
                        <span className="text-xs font-bold text-white block truncate">
                          {labelMode === 'quiz' && !isRevealed ? (
                            <span className="text-amber-300 font-mono text-[11px]">❓ [انقر لكشف التسمية]</span>
                          ) : (
                            lbl.name
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {lbl.arabicType}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {labelMode === 'quiz' ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isRevealed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {isRevealed ? 'مكشوف' : 'مخفي'}
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleIndividual(lbl.id);
                          }}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                        >
                          {isToggledOff ? <EyeOff className="w-3.5 h-3.5 text-rose-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Interactive 3D Medical Illustration Image with Label Pins & Zoom Feature */}
      {tool.imageUrl && (
        <div ref={diagramRef} className="space-y-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              المجسم ثلاثي الأبعاد مع التسميات التفاعلية وفحص التكبير المجهري:
            </h4>
            <span className="text-[11px] text-slate-400">استخدم عجلة الماوس أو الأزرار للتكبير (Zoom) والغراب (Drag)</span>
          </div>

          {/* Zoom Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/90 p-2.5 rounded-t-xl border-x border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 font-mono text-[11px]">
                <ZoomIn className="w-4 h-4 text-emerald-400" />
                تكبير الفحص المجهري (Cellular Zoom):
              </span>
              <span className="bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-mono border border-emerald-500/20 font-bold">
                {Math.round(zoomLevel * 100)}%
              </span>
              {zoomLevel > 1 && (
                <span className="text-[10px] text-amber-400 font-mono animate-pulse flex items-center gap-1">
                  <Move className="w-3 h-3" />
                  (اسحب للتحريك)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                  zoomLevel === 1 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                100% عادي
              </button>
              <button
                onClick={() => setZoomLevel(1.5)}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                  zoomLevel === 1.5 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                150% دقيق
              </button>
              <button
                onClick={() => setZoomLevel(2.5)}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                  zoomLevel === 2.5 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                250% مجهري
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                title="تصغير Zoom Out"
                className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3.5}
                title="تكبير Zoom In"
                className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleResetZoom}
                title="إعادة ضبط التكبير إلى 100% (Reset Zoom)"
                className="px-2.5 py-1 rounded text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition-all cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>إعادة ضبط (Reset)</span>
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <button
                onClick={handleCaptureScreenshot}
                disabled={isCapturing}
                title="التقاط صورة عالية الدقة للمخطط والتسميات الحالية (Capture High-Res Screenshot)"
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  captureSuccess
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {captureSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تم حفظ اللقطة!</span>
                  </>
                ) : isCapturing ? (
                  <>
                    <Camera className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>جاري الالتقاط...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>التقاط صورة (PNG)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                title="تحميل الرسمة والمخطط والتسميات كملف PDF عالي الجودة للطباعة"
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  pdfSuccess
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                {pdfSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تم حفظ PDF!' : 'PDF Saved!'}</span>
                  </>
                ) : isGeneratingPdf ? (
                  <>
                    <FileText className="w-3.5 h-3.5 animate-bounce text-rose-400" />
                    <span>{isAr ? 'جاري الإنشاء...' : 'Exporting...'}</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5 text-rose-400" />
                    <span>{isAr ? 'تحميل PDF' : 'Download PDF'}</span>
                  </>
                )}
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <button
                onClick={() => setIsFullscreen(prev => !prev)}
                title={isFullscreen ? 'الخروج من الشاشة الكاملة' : 'ملء الشاشة لفتح العرض المجهري (Fullscreen View)'}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isFullscreen
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                    : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>تصغير الشاشة</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ملء الشاشة</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div 
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`relative rounded-b-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl select-none ${
              zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            }`}
            style={{ touchAction: zoomLevel > 1 ? 'none' : 'auto' }}
          >
            {/* Corner Magnification Zoom Level Indicator Badge & Floating Reset Button */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
              <div className="bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold px-2.5 py-1 rounded-lg shadow-xl flex items-center gap-1.5 pointer-events-none">
                <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>{Math.round(zoomLevel * 100)}%</span>
              </div>

              {zoomLevel > 1 && (
                <button
                  onClick={handleResetZoom}
                  title="إعادة الرسمة إلى المركز والتكبير الاصلي 100%"
                  className="bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] px-2.5 py-1 rounded-lg shadow-xl backdrop-blur-md transition-all cursor-pointer flex items-center gap-1 border border-emerald-300 animate-pulse"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة ضبط الزوم</span>
                </button>
              )}
            </div>

            <div
              className="relative w-full transition-transform duration-100 ease-out origin-center"
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`
              }}
            >
              <img 
                src={tool.imageUrl} 
                alt={tool.title} 
                referrerPolicy="no-referrer"
                className={`w-full transition-all duration-200 filter brightness-95 ${
                  isFullscreen 
                    ? 'max-h-[calc(100vh-280px)] min-h-[400px] object-contain rounded-xl' 
                    : 'max-h-[440px] object-cover rounded-b-xl'
                }`}
              />

              {/* Drag & Drop Quiz Target Drop Slots Overlay */}
              {labelMode === 'dragQuiz' && organelleLabels.map((slotLbl, idx) => {
                const placedLabelId = dragAssignments[slotLbl.id];
                const placedLabel = organelleLabels.find(l => l.id === placedLabelId);
                const status = dragSlotStatus[slotLbl.id];
                const isHovered = dragHoveredSlot === slotLbl.id;
                const isSelectedTarget = selectedLabelForDrop !== null && !placedLabelId;
                const isHinted = hintedSlotId === slotLbl.id;

                return (
                  <div
                    key={slotLbl.id}
                    style={{ top: `${slotLbl.yPercent}%`, left: `${slotLbl.xPercent}%` }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                      isHinted ? 'z-40 scale-125' : 'z-20'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragHoveredSlot(slotLbl.id);
                    }}
                    onDragLeave={() => setDragHoveredSlot(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragHoveredSlot(null);
                      const droppedId = e.dataTransfer.getData('text/plain');
                      if (droppedId) {
                        handleLabelDrop(droppedId, slotLbl.id);
                      }
                    }}
                    onClick={() => {
                      if (selectedLabelForDrop) {
                        handleLabelDrop(selectedLabelForDrop, slotLbl.id);
                      }
                    }}
                  >
                    {placedLabel ? (
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-2xl border backdrop-blur-md transition-all ${
                          isHinted
                            ? 'bg-amber-400 text-slate-950 border-amber-300 ring-8 ring-amber-400/70 shadow-[0_0_30px_rgba(251,191,36,0.9)] animate-pulse font-black'
                            : status === 'correct'
                              ? 'bg-emerald-950/95 text-emerald-300 border-emerald-400 ring-2 ring-emerald-500/40'
                              : 'bg-rose-950/95 text-rose-300 border-rose-400 ring-2 ring-rose-500/40'
                        }`}
                      >
                        {status === 'correct' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>{placedLabel.name}</span>
                        {failedAttemptsPerSlot[slotLbl.id] > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 text-[10px] font-mono border border-rose-500/50 flex items-center gap-0.5" title={isAr ? `أخطاء مسجلة: ${failedAttemptsPerSlot[slotLbl.id]}` : `Recorded errors: ${failedAttemptsPerSlot[slotLbl.id]}`}>
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-300" />
                            <span>{failedAttemptsPerSlot[slotLbl.id]}</span>
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAssignment(slotLbl.id);
                          }}
                          title={isAr ? "إلغاء الموضع لإعادة المحاولة" : "Remove placement to retry"}
                          className="p-0.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white mr-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-xl ${
                          isHinted
                            ? 'bg-amber-400 text-slate-950 border-amber-300 scale-125 ring-8 ring-amber-400/60 shadow-[0_0_35px_rgba(251,191,36,0.95)] animate-bounce font-black'
                            : isHovered || isSelectedTarget
                              ? 'bg-amber-500/30 border-amber-400 text-amber-200 scale-110 ring-4 ring-amber-500/30 animate-pulse border-dashed'
                              : 'bg-slate-950/90 border-cyan-400/60 text-cyan-300 hover:border-amber-400 hover:text-amber-300 border-dashed'
                        }`}
                      >
                        <Target className={`w-4 h-4 shrink-0 ${isHinted ? 'text-slate-950 animate-spin' : 'text-amber-400'}`} />
                        <span>{isAr ? `موضع #${idx + 1}` : `Target #${idx + 1}`}</span>
                        {failedAttemptsPerSlot[slotLbl.id] > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/50 text-[10px] font-mono flex items-center gap-0.5" title={isAr ? `أخطاء مسجلة: ${failedAttemptsPerSlot[slotLbl.id]}` : `Recorded errors: ${failedAttemptsPerSlot[slotLbl.id]}`}>
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-300" />
                            <span>{failedAttemptsPerSlot[slotLbl.id]}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Interactive Floating Label Pins overlay */}
              {labelMode !== 'hidden' && labelMode !== 'dragQuiz' && filteredLabels.map((lbl) => {
                const isToggledOff = individualToggles[lbl.id] === false;
                if (isToggledOff && labelMode === 'full') return null;

                const isRevealed = revealedLabels[lbl.id];

                return (
                  <div
                    key={lbl.id}
                    style={{ top: `${lbl.yPercent}%`, left: `${lbl.xPercent}%` }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  >
                    <button
                      onClick={() => {
                        if (labelMode === 'quiz') handleToggleReveal(lbl.id);
                        setActivePin(lbl);
                      }}
                      className={`group/pin relative flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-lg backdrop-blur-md border ${
                        labelMode === 'quiz' && !isRevealed
                          ? 'bg-amber-500/80 text-slate-950 border-amber-300 animate-bounce'
                          : lbl.type === 'organelle'
                          ? 'bg-cyan-950/90 text-cyan-200 border-cyan-500/50 hover:bg-cyan-900'
                          : lbl.type === 'tissue'
                          ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50 hover:bg-emerald-900'
                          : 'bg-amber-950/90 text-amber-200 border-amber-500/50 hover:bg-amber-900'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                      
                      {labelMode === 'quiz' && !isRevealed ? (
                        <span className="font-mono flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" />
                          <span>عضية/نسيج ?</span>
                        </span>
                      ) : (
                        <span>{lbl.name}</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Overlay Info Banner */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-4 flex items-center justify-between text-xs text-slate-300 pointer-events-none">
              <span className="font-medium">تفاعلية كاملة: قم بالتكبير (Scroll/Zoom) واسحب للفحص المجهري العضوي</span>
              <span className="bg-slate-900/80 px-2 py-1 rounded text-[10px] text-emerald-400 font-mono border border-slate-800">
                مستوى التكبير: {Math.round(zoomLevel * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Active Pin Detailed Concept Card */}
      <AnimatePresence>
        {activePin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-2 relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                تفاصيل العضية/النسيج المفضل: {activePin.arabicType}
              </span>
              <button
                onClick={() => setActivePin(null)}
                className="text-slate-500 hover:text-white text-xs font-bold"
              >
                إغلاق ✕
              </button>
            </div>
            <h5 className="text-base font-bold text-white flex items-center gap-2">
              {activePin.name}
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              {activePin.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ASCII Art Schematic with Label Highlights if present */}
      {tool.asciiArt && labelMode !== 'hidden' && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 block font-mono">
            التخطيط الرمزي البرمجي (ASCII Visual Schematic):
          </span>
          <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-850" dir="ltr">
            <pre>{tool.asciiArt}</pre>
          </div>
        </div>
      )}

      {/* Graphic Storyboard Elements */}
      <div className="bg-slate-950/40 border border-emerald-950/20 rounded-lg p-5">
        <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5 font-sans">
          <Info className="w-4 h-4 text-emerald-400" />
          لوحة التوضيح ومكونات الرسمة (Storyboard Graphic):
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="space-y-2">
            <p><strong>الفكرة الرسومية:</strong> {tool.storyboard.graphicIdea}</p>
            <p><strong>الألوان المحددة:</strong> {tool.storyboard.colors.join(' ، ')}</p>
          </div>
          <div className="space-y-2">
            <p><strong>عناصر اللوحة والأنسجة:</strong></p>
            <ul className="list-disc pr-4 space-y-1">
              {tool.storyboard.elements.map((el, idx) => (
                <li key={idx} className={labelMode === 'quiz' ? 'opacity-95' : ''}>
                  {el}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-3 border-t border-slate-800/80 pt-2 italic">
          * تخطيط المشهد: {tool.storyboard.layoutDescription}
        </p>
      </div>

      {/* Display Pathway Steps if available */}
      {tool.pathwaySteps && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white">خطوات وتتابع المسار الحيوي (Biological Pathway):</h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {tool.pathwaySteps.map((step) => (
              <div key={step.stepNumber} className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg">
                <div className="text-emerald-400 font-bold text-xs mb-1 font-mono">الخطوة {step.stepNumber}</div>
                <h5 className="font-bold text-white text-xs mb-1">{step.title}</h5>
                <p className="text-[10px] text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Table if present */}
      {tool.comparison && (
        <div className="border border-slate-800 rounded-lg overflow-hidden">
          <div className="bg-slate-950/50 p-3 border-b border-slate-850 font-bold text-sm text-slate-200 flex items-center justify-between">
            <span>{tool.comparison.title}</span>
            <span className="text-xs text-emerald-400 font-mono">مقارنة علمية دقيقة</span>
          </div>
          <table className="w-full text-xs text-right text-slate-300">
            <thead className="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">وجه المقارنة (Aspect)</th>
                <th className="p-3">{tool.comparison.headerA}</th>
                <th className="p-3">{tool.comparison.headerB}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {tool.comparison.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-white border-l border-slate-850">{row.aspect}</td>
                  <td className="p-3 border-l border-slate-850">{row.entityA}</td>
                  <td className="p-3">{row.entityB}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
