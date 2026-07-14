import { IsString, IsIn } from 'class-validator';

export class AiSuggestionDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsIn(['optimization', 'safety', 'efficiency', 'compliance'])
  type: 'optimization' | 'safety' | 'efficiency' | 'compliance';

  @IsIn(['low', 'medium', 'high'])
  priority: 'low' | 'medium' | 'high';

  @IsString()
  impact: string;
}
