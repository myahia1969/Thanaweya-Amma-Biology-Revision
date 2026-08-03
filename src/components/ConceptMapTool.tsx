import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter, 
  Search, 
  Sparkles, 
  BookOpen, 
  ChevronLeft, 
  X, 
  Info, 
  Layers, 
  Zap, 
  Flame,
  Globe,
  Maximize2
} from 'lucide-react';
import { LectureData, ConceptMapNode, ConceptMapLink, ConceptCategory } from '../types';
import { lectureConceptMaps, crossChapterLinks } from '../data/conceptMaps';
import { useLanguage } from '../context/LanguageContext';
import { autoTranslateText } from '../utils/autoTranslator';

interface ConceptMapToolProps {
  allLectures: LectureData[];
  selectedLectureId: number;
  onSelectLecture: (id: number) => void;
  onNavigateToTab?: (lectureId: number, tab: string) => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

interface D3Node extends d3.SimulationNodeDatum, ConceptMapNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
  relation: string;
}

const CATEGORY_COLORS: Record<ConceptCategory, { bg: string; border: string; text: string; label: string; glow: string }> = {
  core: { bg: '#10b981', border: '#34d399', text: '#ecfdf5', label: 'المفهوم المحوري', glow: 'rgba(16, 185, 129, 0.4)' },
  concept: { bg: '#3b82f6', border: '#60a5fa', text: '#eff6ff', label: 'مفهوم رئيسي', glow: 'rgba(59, 130, 246, 0.4)' },
  trick: { bg: '#f59e0b', border: '#fbbf24', text: '#fffbeb', label: 'تريكة امتحان', glow: 'rgba(245, 158, 11, 0.4)' },
  mechanism: { bg: '#14b8a6', border: '#2dd4bf', text: '#f0fdfa', label: 'آلية/عملية فسيولوجية', glow: 'rgba(20, 184, 166, 0.4)' },
  structure: { bg: '#8b5cf6', border: '#a78bfa', text: '#f5f3ff', label: 'تركيب تشريحي', glow: 'rgba(139, 92, 246, 0.4)' }
};

export const ConceptMapTool: React.FC<ConceptMapToolProps> = ({
  allLectures,
  selectedLectureId,
  onSelectLecture,
  onNavigateToTab,
  isModal = false,
  onCloseModal
}) => {
  const { isAr, language } = useLanguage();
  const [activeLectureId, setActiveLectureId] = useState<number>(selectedLectureId);
  const [showGlobalCrossMap, setShowGlobalCrossMap] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<ConceptMapNode | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Sync active lecture if prop changes
  useEffect(() => {
    setActiveLectureId(selectedLectureId);
  }, [selectedLectureId]);

  // Aggregate current active dataset
  const currentGraphData = useMemo(() => {
    let nodes: ConceptMapNode[] = [];
    let links: ConceptMapLink[] = [];

    if (showGlobalCrossMap) {
      // Load all nodes & links across all lectures
      Object.values(lectureConceptMaps).forEach(map => {
        nodes.push(...map.nodes);
        links.push(...map.links);
      });
      links.push(...crossChapterLinks);
    } else {
      const currentMap = lectureConceptMaps[activeLectureId] || lectureConceptMaps[1];
      nodes = [...currentMap.nodes];
      links = [...currentMap.links];
    }

    // Filter by search query if any
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      nodes = nodes.filter(n => 
        n.label.toLowerCase().includes(q) || 
        n.description.toLowerCase().includes(q)
      );
      const nodeIds = new Set(nodes.map(n => n.id));
      links = links.filter(l => 
        nodeIds.has(typeof l.source === 'string' ? l.source : (l.source as any).id) &&
        nodeIds.has(typeof l.target === 'string' ? l.target : (l.target as any).id)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      nodes = nodes.filter(n => n.category === selectedCategory);
      const nodeIds = new Set(nodes.map(n => n.id));
      links = links.filter(l => 
        nodeIds.has(typeof l.source === 'string' ? l.source : (l.source as any).id) &&
        nodeIds.has(typeof l.target === 'string' ? l.target : (l.target as any).id)
      );
    }

    return { nodes, links };
  }, [activeLectureId, showGlobalCrossMap, searchQuery, selectedCategory]);

  // Render D3 Simulation
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 550;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous rendering

    const g = svg.append('g').attr('class', 'main-group');

    // D3 Zoom Setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom as any);

    // Prepare deep clones for D3 simulation mutate
    const nodesData: D3Node[] = currentGraphData.nodes.map(n => ({ ...n }));
    const linksData: D3Link[] = currentGraphData.links.map(l => ({ ...l }));

    // Define Arrow Marker for Directed Links
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#64748b');

    // Simulation forces
    const simulation = d3.forceSimulation<D3Node>(nodesData)
      .force('link', d3.forceLink<D3Node, D3Link>(linksData).id(d => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(55));

    // Draw Links
    const link = g.append('g')
      .selectAll('line')
      .data(linksData)
      .enter()
      .append('line')
      .attr('stroke', '#475569')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrow)');

    // Draw Link Labels (Relationship text)
    const linkLabel = g.append('g')
      .selectAll('text')
      .data(linksData)
      .enter()
      .append('text')
      .text(d => d.relation)
      .attr('font-size', '10px')
      .attr('font-family', 'sans-serif')
      .attr('fill', '#94a3b8')
      .attr('text-anchor', 'middle')
      .attr('dy', -4);

    // Draw Node Groups
    const node = g.append('g')
      .selectAll('.node')
      .data(nodesData)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, D3Node>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any
      );

    // Outer Glow Circles
    node.append('circle')
      .attr('r', d => d.category === 'core' ? 32 : 24)
      .attr('fill', d => CATEGORY_COLORS[d.category]?.bg || '#3b82f6')
      .attr('fill-opacity', 0.15)
      .attr('stroke', d => CATEGORY_COLORS[d.category]?.border || '#60a5fa')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 6);

    // Main Node Circles
    node.append('circle')
      .attr('r', d => d.category === 'core' ? 26 : 20)
      .attr('fill', d => CATEGORY_COLORS[d.category]?.bg || '#3b82f6')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2)
      .attr('box-shadow', '0 0 15px rgba(0,0,0,0.5)');

    // Node Category Badges / Icons (First Letter / Category Icon)
    node.append('text')
      .text(d => d.category === 'trick' ? '⚡' : d.category === 'core' ? '⭐' : d.category === 'mechanism' ? '⚙️' : '🧬')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('font-size', '12px');

    // Node Text Labels below
    node.append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.category === 'core' ? 42 : 36)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'sans-serif')
      .attr('fill', '#f8fafc')
      .attr('stroke', '#020617')
      .attr('stroke-width', 3)
      .attr('paint-order', 'stroke');

    // Node Click Listener
    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
    });

    // Tick simulation update
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as D3Node).x || 0)
        .attr('y1', d => (d.source as D3Node).y || 0)
        .attr('x2', d => (d.target as D3Node).x || 0)
        .attr('y2', d => (d.target as D3Node).y || 0);

      linkLabel
        .attr('x', d => (((d.source as D3Node).x || 0) + ((d.target as D3Node).x || 0)) / 2)
        .attr('y', d => (((d.source as D3Node).y || 0) + ((d.target as D3Node).y || 0)) / 2);

      node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [currentGraphData]);

  // Zoom control helpers
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy as any, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy as any, 0.7);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.transform as any, d3.zoomIdentity);
    }
  };

  const activeLectureInfo = allLectures.find(l => l.id === activeLectureId) || allLectures[0];

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col dir-rtl font-sans relative ${isModal ? 'h-[90vh]' : 'mb-8 h-[680px]'}`}>
      
      {/* Header Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-md">
            <Network className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              خريطة المفاهيم التفاعلية (D3.js)
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                شبكة علاقات فسيولوجية
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              استكشف العلاقات بين المفاهيم، الآليات الفسيولوجية، وتريكات المنهج مرئياً
            </p>
          </div>
        </div>

        {/* Chapter Switcher & Cross-Chapter Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chapter Selector Dropdown */}
          {!showGlobalCrossMap && (
            <select
              value={activeLectureId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setActiveLectureId(id);
                onSelectLecture(id);
              }}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans cursor-pointer"
            >
              {allLectures.map(l => (
                <option key={l.id} value={l.id}>
                  {l.arabicTitle}
                </option>
              ))}
            </select>
          )}

          {/* Cross-Chapter Web Mode Toggle */}
          <button
            onClick={() => setShowGlobalCrossMap(!showGlobalCrossMap)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
              showGlobalCrossMap
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{showGlobalCrossMap ? 'شبكة المنهج الكاملة (عبر الفصول)' : 'ربط الفصول ببعضها'}</span>
          </button>

          {isModal && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Control Toolbar & Search */}
      <div className="p-3 bg-slate-950/70 border-b border-slate-850 flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث عن مفهوم أو تريكة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute left-2.5 top-2 text-slate-500 hover:text-white text-xs">
              ×
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            الكل ({currentGraphData.nodes.length})
          </button>

          {(['core', 'concept', 'trick', 'mechanism', 'structure'] as ConceptCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-white border-slate-600 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: CATEGORY_COLORS[cat].bg }} />
              {CATEGORY_COLORS[cat].label}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          <button onClick={handleZoomIn} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800" title="تكبير">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleZoomOut} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800" title="تصغير">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={handleResetZoom} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800" title="إعادة ضبط">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Stage Container */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-slate-950/90 cursor-grab active:cursor-grabbing">
        <svg ref={svgRef} className="w-full h-full block" />

        {/* Legend Overlay at bottom-left */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3 backdrop-blur-md text-[11px] space-y-1.5 shadow-xl pointer-events-none hidden sm:block">
          <div className="font-bold text-slate-300 mb-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-emerald-400" /> دلالات رموز العقد:
          </div>
          {(['core', 'concept', 'trick', 'mechanism', 'structure'] as ConceptCategory[]).map(cat => (
            <div key={cat} className="flex items-center gap-2 text-slate-400">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat].bg }} />
              <span>{CATEGORY_COLORS[cat].label}</span>
            </div>
          ))}
        </div>

        {/* Selected Node Details Slide-over Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="absolute top-4 right-4 bottom-4 w-80 md:w-96 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md overflow-y-auto space-y-4 font-sans z-20"
            >
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full border"
                  style={{
                    backgroundColor: `${CATEGORY_COLORS[selectedNode.category].bg}20`,
                    borderColor: CATEGORY_COLORS[selectedNode.category].border,
                    color: CATEGORY_COLORS[selectedNode.category].text
                  }}
                >
                  {CATEGORY_COLORS[selectedNode.category].label}
                </span>

                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h4 className="text-base font-bold text-white leading-snug">
                  {selectedNode.label}
                </h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>

              {selectedNode.examNote && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-1 text-xs text-amber-300">
                  <span className="font-bold text-amber-400 flex items-center gap-1 text-[11px]">
                    <Zap className="w-3.5 h-3.5" /> تركيز امتحانات الثانوية:
                  </span>
                  <p className="leading-relaxed">{selectedNode.examNote}</p>
                </div>
              )}

              {selectedNode.keyPoints && selectedNode.keyPoints.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> نقاط أساسية للتذكر:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedNode.keyPoints.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-850">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Navigation Link to Lecture */}
              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    onSelectLecture(selectedNode.lectureId);
                    if (onNavigateToTab) onNavigateToTab(selectedNode.lectureId, 'concepts');
                    setSelectedNode(null);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>انتقل لفصل المفاهيم الخاص بالدرس</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
