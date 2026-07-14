import { IsInt, IsArray, IsString, IsIn, Min, Max } from 'class-validator';

export class AlertDto {
  @IsString()
  code: string;

  @IsIn(['info', 'warn', 'error'])
  severity: 'info' | 'warn' | 'error';

  @IsString()
  message: string;
}

export class AiEvaluationDto {
  @IsInt()
  @Min(0)
  @Max(100)
  score: number;

  @IsArray()
  alerts: AlertDto[];

  @IsArray()
  @IsString({ each: true })
  hints: string[];
}
