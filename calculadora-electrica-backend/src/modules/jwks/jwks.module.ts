import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwksKey } from './entities/jwks-key.entity';
import { JwksKeyRepository } from './repositories/jwks-key.repository';
import { KeyStoreService } from './services/key-store.service';
import { JwtRs256Service } from './services/jwt-rs256.service';
import { JwksController } from './controllers/jwks.controller';
import { JwksAdminController } from './controllers/jwks-admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([JwksKey]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '900s'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwksKeyRepository, KeyStoreService, JwtRs256Service],
  controllers: [JwksController, JwksAdminController],
  exports: [KeyStoreService, JwksKeyRepository, JwtRs256Service],
})
export class JwksModule {}
