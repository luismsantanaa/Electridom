import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestIdMiddleware.name);

  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const requestIdHeader = this.configService.get<string>('logger.requestIdHeader', 'X-Request-Id');
    
    // Obtener requestId del header o generar uno nuevo
    let requestId = req.headers[requestIdHeader.toLowerCase()] as string;
    
    if (!requestId) {
      requestId = uuidv4();
      this.logger.debug(`RequestId generado: ${requestId}`);
    }

    // Agregar requestId al request y response
    req['requestId'] = requestId;
    res.setHeader(requestIdHeader, requestId);

    // Agregar requestId al contexto de logging
    req['logContext'] = { requestId };

    next();
  }
}
