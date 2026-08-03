export interface ConceptQA {
  question: string;
  answer: string;
  questionEn?: string;
  answerEn?: string;
  type?: 'reasoning' | 'comparison' | 'calculation' | 'conceptual';
}

export interface KeyConcept {
  id: string;
  title: string;
  arabicTitle: string;
  titleEn?: string;
  details: string; // HTML or Markdown format
  detailsEn?: string;
  keyPoints: string[];
  keyPointsEn?: string[];
  questionsAndAnswers?: ConceptQA[];
}

export interface InteractiveLabel {
  id: string;
  name: string;
  nameEn?: string;
  type: 'organelle' | 'tissue' | 'structure' | 'molecule';
  arabicType: string;
  xPercent: number;
  yPercent: number;
  description: string;
  descriptionEn?: string;
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
  aspectEn?: string;
  entityAEn?: string;
  entityBEn?: string;
}

export interface ComparisonTable {
  title: string;
  headerA: string;
  headerB: string;
  titleEn?: string;
  headerAEn?: string;
  headerBEn?: string;
  rows: ComparisonRow[];
}

export interface PathwayStep {
  stepNumber: number;
  title: string;
  description: string;
  titleEn?: string;
  descriptionEn?: string;
}

export interface VisualTool {
  id: string;
  title: string;
  titleEn?: string;
  diagramType: 'sarcomere' | 'feedback_loop' | 'defense_lines' | 'dna_replication' | 'osmosis';
  asciiArt?: string;
  imageUrl?: string;
  storyboard: Storyboard;
  comparison?: ComparisonTable;
  pathwaySteps?: PathwayStep[];
  organelleTissueLabels?: InteractiveLabel[];
}

export interface Misconception {
  termA: string;
  termB: string;
  difference: string;
  examFocus: string;
  termAEn?: string;
  termBEn?: string;
  differenceEn?: string;
  examFocusEn?: string;
}

export interface GraphDataPoint {
  label: string;
  labelEn?: string;
  valueA: number;
  valueB?: number;
  description?: string;
  descriptionEn?: string;
}

export interface InteractiveGraph {
  title: string;
  titleEn?: string;
  yAxisLabel: string;
  yAxisLabelEn?: string;
  xAxisLabel: string;
  xAxisLabelEn?: string;
  curveALabel: string;
  curveALabelEn?: string;
  curveBLabel?: string;
  curveBLabelEn?: string;
  points: GraphDataPoint[];
  interpretation: string;
  interpretationEn?: string;
}

export interface ExamTrick {
  id: string;
  title: string;
  titleEn?: string;
  crossChapterLink: string; // الربط بين الفصول
  crossChapterLinkEn?: string;
  coreConcept: string;
  coreConceptEn?: string;
  misconceptions: Misconception[];
  interactiveGraph?: InteractiveGraph;
}

export interface MCQQuestion {
  id: string;
  questionText: string;
  questionTextEn?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  optionsEn?: {
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
  explanationEn?: {
    correct: string;
    incorrectA?: string;
    incorrectB?: string;
    incorrectC?: string;
    incorrectD?: string;
  };
  complexity: 'expert' | 'high' | 'medium' | 'easy';
  sourceYear?: string; // e.g. "دور أول 2023" or "تجريبي 2024"
  sourceYearEn?: string;
}

export interface LectureData {
  id: number;
  title: string;
  arabicTitle: string;
  subtitle: string;
  subtitleEn?: string;
  topicsCovered: string[];
  topicsCoveredEn?: string[];
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
