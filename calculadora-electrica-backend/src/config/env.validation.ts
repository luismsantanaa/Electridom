import { plainToClass } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

export enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

export enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
  Verbose = 'verbose',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;

  @IsString()
  DATABASE_HOST: string;

  @IsNumber()
  DATABASE_PORT: number;

  @IsString()
  DATABASE_USERNAME: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  DATABASE_NAME: string;

  @IsEnum(LogLevel)
  @IsOptional()
  LOG_LEVEL?: LogLevel;

  @IsString()
  @IsOptional()
  API_KEY?: string;

  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string;

  @IsString()
  @IsOptional()
  SSL_KEY_PATH?: string;

  @IsString()
  @IsOptional()
  SSL_CERT_PATH?: string;

  @IsNumber()
  @IsOptional()
  RATE_LIMIT_TTL?: number;

  @IsNumber()
  @IsOptional()
  RATE_LIMIT_LIMIT?: number;

  @IsString()
  @IsOptional()
  SWAGGER_TITLE?: string;

  @IsString()
  @IsOptional()
  SWAGGER_DESCRIPTION?: string;

  @IsString()
  @IsOptional()
  SWAGGER_VERSION?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const missingVars = errors.map(error => 
      Object.values(error.constraints || {}).join(', ')
    ).join('; ');
    
    throw new Error(
      `❌ Configuración de entorno inválida:\n${missingVars}\n\n` +
      '💡 Asegúrate de que todas las variables requeridas estén definidas en tu archivo .env'
    );
  }

  return validatedConfig;
}
