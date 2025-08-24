import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Delete,
  Param,
  UnauthorizedException,
  Request,
  Ip,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { RefreshTokenDto } from '../dtos/refresh.dto';
import { User } from '../../users/entities/user.entity';

type UserResponse = Pick<
  User,
  | 'id'
  | 'username'
  | 'email'
  | 'nombre'
  | 'apellido'
  | 'role'
  | 'estado'
  | 'telefono'
  | 'empresa'
  | 'cedula'
  | 'ultimoAcceso'
  | 'creationDate'
  | 'updateDate'
>;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 300, limit: 3 } }) // 3 intentos por 5 minutos
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de registro inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'El correo electrónico ya está registrado',
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiados intentos de registro',
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Ip() ip: string,
  ): Promise<UserResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Throttle({ default: { ttl: 300, limit: 5 } }) // 5 intentos por 5 minutos
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiados intentos de inicio de sesión',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const traceId = req.headers['x-trace-id'] || 'unknown';

    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
      ip,
      userAgent,
      traceId,
    );
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    
    const result = await this.authService.login(user, ip, userAgent);
    
    // Configurar cookie HttpOnly si está habilitado
    const cookieEnabled = process.env.REFRESH_COOKIE_ENABLED === 'true';
    if (cookieEnabled) {
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      });
    }
    
    return result;
  }

  @Post('refresh')
  @Throttle({ default: { ttl: 300, limit: 10 } }) // 10 intentos por 5 minutos
  @ApiOperation({ summary: 'Renovar tokens de acceso' })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido o expirado',
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiados intentos de renovación',
  })
  async refresh(
    @Body() refreshDto: RefreshTokenDto,
    @Ip() ip: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    const result = await this.authService.refresh(refreshDto.refreshToken, ip, userAgent);
    
    // Configurar cookie HttpOnly si está habilitado
    const cookieEnabled = process.env.REFRESH_COOKIE_ENABLED === 'true';
    if (cookieEnabled) {
      res.cookie('refresh_token', result.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      });
    }
    
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({
    status: 204,
    description: 'Sesión cerrada exitosamente',
  })
  async logout(
    @Body() refreshDto: RefreshTokenDto,
    @Ip() ip: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    await this.authService.logout(refreshDto.refreshToken, ip, userAgent);
    
    // Limpiar cookie si está habilitado
    const cookieEnabled = process.env.REFRESH_COOKIE_ENABLED === 'true';
    if (cookieEnabled) {
      res.clearCookie('refresh_token');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener sesiones activas del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Sesiones obtenidas exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async getSessions(@Request() req: { user: UserResponse }) {
    return this.authService.getUserSessions(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revocar una sesión específica' })
  @ApiResponse({
    status: 204,
    description: 'Sesión revocada exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 404,
    description: 'Sesión no encontrada',
  })
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @Request() req: { user: UserResponse },
  ) {
    await this.authService.revokeSession(sessionId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario obtenido exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  getProfile(@Request() req: { user: UserResponse }): UserResponse {
    return req.user;
  }
}
