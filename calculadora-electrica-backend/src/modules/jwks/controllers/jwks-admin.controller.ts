import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { KeyStoreService } from '../services/key-store.service';
import { JwksKey } from '../entities/jwks-key.entity';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('JWKS Admin')
@Controller('admin/keys')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class JwksAdminController {
  constructor(private readonly keyStoreService: KeyStoreService) {}

  @Post('rotate')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Rotar claves RSA',
    description: 'Genera un nuevo par de claves RSA y activa la nueva clave',
  })
  @ApiResponse({
    status: 200,
    description: 'Nueva clave RSA generada y activada',
    type: JwksKey,
  })
  async rotateKeys(): Promise<JwksKey> {
    return this.keyStoreService.rotateKeys();
  }
}
