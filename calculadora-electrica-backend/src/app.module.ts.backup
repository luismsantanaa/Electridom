import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  envConfig,
  jwtConfig,
  databaseConfig,
  securityConfig,
  rateLimitConfig,
  swaggerConfig,
  healthConfig,
  metricsConfig,
  loggerConfig,
} from './config/env.config';
import { validate } from './config/env.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { TiposInstalacionesModule } from './modules/tipos-instalaciones/tipos-instalaciones.module';
import { TiposAmbientesModule } from './modules/tipos-ambientes/tipos-ambientes.module';
import { TiposArtefactosModule } from './modules/tipos-artefactos/tipos-artefactos.module';
import { RulesModule } from './modules/rules/rules.module';
import { CalculosModule } from './modules/calculos/calculos.module';
import { AmbienteModule } from './modules/ambientes/ambiente.module';
import { CargasModule } from './modules/cargas/cargas.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RulesAdminModule } from './modules/rules-admin/rules-admin.module';
import { JwksModule } from './modules/jwks/jwks.module';
import { CommonModule } from './common/common.module';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ErrorInterceptor } from './common/interceptors/error.interceptor';
import { TraceIdInterceptor } from './common/interceptors/trace-id.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ThrottlerGuard } from '@nestjs/throttler';
import { MetricsModule } from './modules/metrics/metrics.module';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        envConfig,
        jwtConfig,
        databaseConfig,
        securityConfig,
        rateLimitConfig,
        swaggerConfig,
        healthConfig,
        metricsConfig,
        loggerConfig,
      ],
      validate,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL', 60),
            limit: config.get('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mariadb',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('env.nodeEnv') === 'development',
        logging: configService.get('env.nodeEnv') === 'development',
      }),
    }),
    UsersModule,
    AuthModule,
    HealthModule,
    TiposInstalacionesModule,
    TiposAmbientesModule,
    TiposArtefactosModule,
    RulesModule,
    CalculosModule,
    AmbienteModule,
    CargasModule,
    ProjectsModule,
    RulesAdminModule,
    JwksModule,
    CommonModule,
    MetricsModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: 'silent',
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TraceIdInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    RequestIdMiddleware,
  ],
})
export class AppModule {}
