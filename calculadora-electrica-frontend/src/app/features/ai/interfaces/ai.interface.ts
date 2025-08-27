export interface AnalyzeRequest {
  input: { [key: string]: unknown };
  output: { [key: string]: unknown };
  question?: string;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'safety' | 'compliance' | 'efficiency' | 'cost';
}

export interface AnalyzeResponse {
  summary: string;
  recommendations: Recommendation[];
  tokensUsed: number;
  responseTime: number;
}

export interface IngestExcelResponse {
  success: boolean;
  data?: { system: { voltage: number; phases: number; frequency: number }; superficies: Array<{ name: string; area: number; type: string }>; consumos: Array<{ name: string; power: number; quantity: number; type: string }> };
  message: string;
  errors?: string[];
  rowsProcessed: number;
  rowsWithErrors: number;
}

export interface QuickQuestion {
  id: string;
  text: string;
  category: 'system' | 'demand' | 'protection' | 'grounding' | 'general';
  icon: string;
}

export interface AiAnalysisState {
  isAnalyzing: boolean;
  analysis: AnalyzeResponse | null;
  error: string | null;
  lastQuestion: string | null;
}
