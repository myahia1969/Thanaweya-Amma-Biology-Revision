export interface ConceptQA {
  question: string;
  answer: string;
  type?: 'reasoning' | 'comparison' | 'calculation' | 'conceptual';
}

export interface KeyConcept {
  id: string;
  title: string;
  arabicTitle: string;
  details: string; // HTML or Markdown format
  keyPoints: string[];
  questionsAndAnswers?: ConceptQA[];
}

export interface Storyboard {
  graphicIdea: string;
  elements: string[];
  colors: string[];
  layoutDescription: string;
}

export interface ComparisonRow {
  aspect: string;
  entityA: string;
  entityB: string;
}

export interface ComparisonTable {
  title: string;
  headerA: string;
  headerB: string;
  rows: ComparisonRow[];
}

export interface PathwayStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface VisualTool {
  id: string;
  title: string;
  diagramType: 'sarcomere' | 'feedback_loop' | 'defense_lines' | 'dna_replication' | 'osmosis';
  asciiArt?: string;
  imageUrl?: string;
  storyboard: Storyboard;
  comparison?: ComparisonTable;
  pathwaySteps?: PathwayStep[];
}

export interface Misconception {
  termA: string;
  termB: string;
  difference: string;
  examFocus: string;
}

export interface GraphDataPoint {
  label: string;
  valueA: number;
  valueB?: number;
  description?: string;
}

export interface InteractiveGraph {
  title: string;
  yAxisLabel: string;
  xAxisLabel: string;
  curveALabel: string;
  curveBLabel?: string;
  points: GraphDataPoint[];
  interpretation: string;
}

export interface ExamTrick {
  id: string;
  title: string;
  crossChapterLink: string; // الربط بين الفصول
  coreConcept: string;
  misconceptions: Misconception[];
  interactiveGraph?: InteractiveGraph;
}

export interface MCQQuestion {
  id: string;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: {
    correct: string;
    incorrectA?: string;
    incorrectB?: string;
    incorrectC?: string;
    incorrectD?: string;
  };
  complexity: 'high' | 'medium' | 'easy';
  sourceYear?: string; // e.g. "دور أول 2023" or "تجريبي 2024"
}

export interface LectureData {
  id: number;
  title: string;
  arabicTitle: string;
  subtitle: string;
  topicsCovered: string[];
  concepts: KeyConcept[];
  visualTools: VisualTool[];
  tricks: ExamTrick[];
  questionBank: MCQQuestion[];
}

export type ConceptCategory = 'core' | 'concept' | 'trick' | 'mechanism' | 'structure';

export interface ConceptMapNode {
  id: string;
  label: string;
  category: ConceptCategory;
  lectureId: number;
  description: string;
  examNote?: string;
  keyPoints?: string[];
}

export interface ConceptMapLink {
  source: string;
  target: string;
  relation: string; // e.g. "يحفز", "يتكون من", "يرتبط بـ", "ينظم"
}

export interface LectureConceptMap {
  lectureId: number;
  nodes: ConceptMapNode[];
  links: ConceptMapLink[];
}

export interface MistakeItem {
  id: string;
  question: MCQQuestion;
  wrongAnswerChosen: string;
  lectureId: number;
  lectureTitle: string;
  timestamp: string;
  attemptCount: number;
  mastered: boolean;
}
