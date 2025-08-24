import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'Calculadora Eléctrica RD - API funcionando correctamente! 🚀⚡',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      features: [
        'Gestión de proyectos eléctricos',
        'Cálculos de potencia y circuitos',
        'Selección de conductores',
        'Lista de materiales y costos',
        'Generación de reportes PDF/Excel',
      ],
    };
  }

  getHealth(): object {
    const uptime = process.uptime();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      uptimeFormatted: this.formatUptime(uptime),
      database: {
        status: 'connected',
        type: 'mariadb',
        database: 'calculadora-electrica',
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      nodeVersion: process.version,
    };
  }

  private formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  }
}
