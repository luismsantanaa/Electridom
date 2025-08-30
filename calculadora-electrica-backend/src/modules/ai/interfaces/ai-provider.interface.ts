import { AiEvaluationDto } from '../dto/ai-evaluation.dto';
import { AiSuggestionDto } from '../dto/ai-suggestion.dto';

export interface AiProvider {
  evaluateProject(projectId: string): Promise<AiEvaluationDto>;
  getSuggestions(projectId: string): Promise<AiSuggestionDto[]>;
  isHealthy(): Promise<boolean>;
  getProviderInfo(): { name: string; model?: string };
}
