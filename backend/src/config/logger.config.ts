import { registerAs } from '@nestjs/config';

export const loggerConfig = registerAs('logger', () => ({
  level: process.env.LOG_LEVEL || 'info',
  requestIdHeader: process.env.REQUEST_ID_HEADER || 'X-Request-Id',
  // Configuración de Pino
  pino: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        levelFirst: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    } : undefined,
    // Configuración de archivos
    file: {
      enabled: process.env.LOG_FILE_ENABLED === 'true',
      path: process.env.LOG_FILE_PATH || './logs/app.log',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
      maxFiles: process.env.LOG_FILE_MAX_FILES || '5',
    },
    // Configuración de formato
    formatters: {
      level: (label: string) => ({ level: label }),
      log: (object: any) => object,
    },
    // Configuración de serialización
    serializers: {
      req: (req: any) => ({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
        headers: res.getHeaders(),
      }),
      err: (err: any) => ({
        type: err.type,
        message: err.message,
        stack: err.stack,
        code: err.code,
        statusCode: err.statusCode,
      }),
    },
  },
  // Configuración de rotación
  rotation: {
    enabled: process.env.LOG_ROTATION_ENABLED === 'true',
    interval: process.env.LOG_ROTATION_INTERVAL || '1d',
    maxFiles: process.env.LOG_ROTATION_MAX_FILES || '30',
  },
  // Configuración de alertas
  alerts: {
    enabled: process.env.LOG_ALERTS_ENABLED === 'true',
    errorThreshold: parseInt(process.env.LOG_ERROR_THRESHOLD || '10', 10),
    timeWindow: parseInt(process.env.LOG_ERROR_TIME_WINDOW || '300', 10), // 5 minutos
  },
}));
