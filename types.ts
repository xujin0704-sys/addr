
export interface SegmentWord {
  text: string;
  pos: string; // Part of speech
  entity?: string; // Named Entity
  granularity: 'fine' | 'coarse' | 'mixed';
  confidence: number;
  levelIndex?: number; // The 1-based index in the dictionary
  categoryName?: string; // The shorthand name of the category (e.g., "省", "市")
}

export interface SegmentationResult {
  method: 'Traditional' | 'MGeo';
  words: SegmentWord[];
  fullText: string;
}

export interface MetricScore {
  name: string;
  score: number; // 0-100
  reason: string;
}

export interface EvaluationReport {
  overallScore: number;
  recall: MetricScore;
  precision: MetricScore;
  accuracy: MetricScore;
  consistency: MetricScore;
  pros: string[];
  cons: string[];
  suggestion: string;
}

export interface ComparisonData {
  id: string;
  input: string;
  traditional: SegmentationResult;
  mgeo: SegmentationResult;
  traditionalEval: EvaluationReport;
  mgeoEval: EvaluationReport;
}

export interface BatchSummary {
  traditionalAvgScore: number;
  mgeoAvgScore: number;
  totalItems: number;
  keyInsights: string;
}

export interface BatchComparisonData {
  items: ComparisonData[];
  summary: BatchSummary;
}

export interface EvaluationWeights {
  recall: number;
  precision: number;
  accuracy: number;
  consistency: number;
}

export type GranularityLevel = '18-level' | '24-level' | 'custom';

export interface LevelDefinition {
  id: string; // 层级ID
  name: string; // 层级名称
  alias: string; // 别名
  pos: string; // 词性
  example: string; // 典型示例
  description: string; // 说明
}

export interface ExternalSegmentation {
  text: string;
  traditionalWords?: string[];
  mgeoWords?: string[];
}

export interface ApiEndpointConfig {
  enabled: boolean;
  method: 'GET' | 'POST';
  url: string;
  headers: string; // JSON string
  bodyTemplate: string; // JSON string with {{text}} or {{payload}} placeholder
  responsePath: string; // e.g. "data.results" or "words"
}

export interface AIConfig {
  temperature: number;
  model: 'gemini-3-flash-preview' | 'gemini-3-pro-preview';
  evaluatorType: 'gemini' | 'external';
  evaluatorApi: ApiEndpointConfig;
  weights: EvaluationWeights;
  granularityLevel: GranularityLevel;
  levelDefinitions: Record<GranularityLevel, LevelDefinition[]>;
  traditionalApi: ApiEndpointConfig;
  mgeoApi: ApiEndpointConfig;
}

export enum ComparisonMode {
  BOTH = 'BOTH',
  TRADITIONAL_ONLY = 'TRADITIONAL_ONLY',
  MGEO_ONLY = 'MGEO_ONLY'
}
