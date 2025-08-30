import {
  Controller,
  Get,
  Query,
  UseGuards,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NormativesService } from './normatives.service';
import {
  ListNormativesQueryDto,
  NormativeListResponseDto,
} from './dtos/normative.dto';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('normativas')
@Controller('v1/normatives')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class NormativesController {
  constructor(private readonly normativesService: NormativesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)
  @ApiOperation({
    summary: 'Listar normativas',
    description: 'Lista normativas con paginación y filtros por fuente',
  })
  @ApiQuery({
    name: 'page',
    description: 'Número de página',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    description: 'Tamaño de página',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'q',
    description: 'Término de búsqueda en código o descripción',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'source',
    description: 'Fuente de la normativa (RIE, NEC, REBT)',
    required: false,
    enum: ['RIE', 'NEC', 'REBT'],
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de normativas obtenida exitosamente',
    type: NormativeListResponseDto,
  })
  async listNormatives(
    @Query() query: ListNormativesQueryDto,
  ): Promise<NormativeListResponseDto> {
    return this.normativesService.listNormatives(query);
  }
}
