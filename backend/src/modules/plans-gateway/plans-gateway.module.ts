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
        timeout: 30000,
        maxRedirects: 0,
      }),
    }),
  ],
  controllers: [PlansGatewayController],
  providers: [PlansGatewayService],
  exports: [PlansGatewayService],
})
export class PlansGatewayModule {}
