import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PlansGatewayController } from './plans-gateway.controller';
import { PlansGatewayService } from './plans-gateway.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get<string>('PLAN_SERVICE_URL', 'http://localhost:8000'),
        timeout: 180_000,
        maxRedirects: 0,
        maxBodyLength: 70 * 1024 * 1024,
        maxContentLength: 70 * 1024 * 1024,
      }),
    }),
  ],
  controllers: [PlansGatewayController],
  providers: [PlansGatewayService],
  exports: [PlansGatewayService],
})
export class PlansGatewayModule {}
