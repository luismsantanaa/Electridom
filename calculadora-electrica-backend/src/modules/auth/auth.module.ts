import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../../common/common.module';
import { JwksModule } from '../jwks/jwks.module';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { LocalStrategy } from '../../common/strategies/local.strategy';
import { SessionService } from './services/session.service';
import { SessionRepository } from './repositories/session.repository';
import { Session } from './entities/session.entity';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    CommonModule,
    JwksModule,
    TypeOrmModule.forFeature([Session]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '900s') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, SessionService, SessionRepository],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
