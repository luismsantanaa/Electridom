export interface AnalyzeRequest {
  input: any;
  output: any;
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
  data?: any;
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
