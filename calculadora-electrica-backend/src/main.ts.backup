import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import { seedNormRules } from './database/seeds/norm-rules.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Obtener configuración validada
  const port = configService.get<number>('env.port', 3000);
  const nodeEnv = configService.get<string>('env.nodeEnv', 'development');
  const logLevel = configService.get<string>('env.logLevel', 'info');
  const corsOrigin = configService.get<string>('security.corsOrigin', '*');
  const swaggerTitle = configService.get<string>('swagger.title', 'Calculadora Eléctrica RD API');
  const swaggerDescription = configService.get<string>('swagger.description', 'API para cálculos eléctricos según normativas dominicanas');
  const swaggerVersion = configService.get<string>('swagger.version', '2.0.0');

  // Configurar Helmet para seguridad
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, // Necesario para Swagger
  }));

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS for frontend with improved security
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-trace-id'],
    credentials: true,
    maxAge: 86400, // 24 hours
  });

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Ejecutar seeds solo en desarrollo
  if (nodeEnv === 'development') {
    try {
      const dataSource = app.get(DataSource);
      await seedNormRules(dataSource);
    } catch (error) {
      console.warn('No se pudieron ejecutar los seeds:', error.message);
    }
  }

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerDescription)
    .setVersion(swaggerVersion)
    .addTag(
      'Cálculos Eléctricos',
      'Cálculos de instalaciones eléctricas residenciales',
    )
    .addTag('proyectos', 'Gestión de proyectos eléctricos')
    .addTag('superficies', 'Medición de ambientes y superficies')
    .addTag('potencia', 'Cálculos de potencia demandada')
    .addTag('circuitos', 'Distribución de circuitos eléctricos')
    .addTag('conductores', 'Selección de conductores y cables')
    .addTag('protecciones', 'Protecciones termomagnéticas')
    .addTag('materiales', 'Lista de materiales y costos')
    .addTag('reportes', 'Generación de reportes PDF/Excel')
    .addTag('utilidades', 'Herramientas y cálculos auxiliares')
    .addTag('usuarios', 'Gestión de usuarios y autenticación')
    .addServer('http://localhost:3000')
    .addServer('https://api.calculadoraelectricrd.com')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API Key para endpoints de administración',
      },
      'api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      syntaxHighlight: {
        theme: 'arta',
      },
    },
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #1e3a8a; font-size: 2rem; }
      .swagger-ui .info .description { font-size: 1.1rem; line-height: 1.6; }
      .swagger-ui .scheme-container { background: #f8f9fa; padding: 15px; border-radius: 8px; }
    `,
    customSiteTitle: 'Calculadora Eléctrica RD - API Documentation',
  });

  await app.listen(port);
  console.log(`🚀 Backend server running on http://localhost:${port}`);
  console.log(`📖 Swagger UI available at http://localhost:${port}/api/docs`);
  console.log(`📋 API JSON schema at http://localhost:${port}/api/docs-json`);
  console.log(`⚡ API endpoints at http://localhost:${port}/api`);
  console.log(`💾 Database: MariaDb (${configService.get('database.database')})`);
  console.log(`🔒 Security: Helmet + Rate Limiting + CORS enabled`);
  console.log(`🌍 Environment: ${nodeEnv.toUpperCase()}`);
  console.log(`📝 Log Level: ${logLevel.toUpperCase()}`);
}
bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
