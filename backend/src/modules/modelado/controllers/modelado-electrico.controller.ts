import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam,
  ApiBearerAuth 
} from '@nestjs/swagger';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../../auth/guards/roles.guard';
// import { Roles } from '../../auth/decorators/roles.decorator';
// import { UserRole } from '../../auth/enums/user-role.enum';
import { ModeladoElectricoService } from '../services/modelado-electrico.service';
import { 
  GenerarCircuitosDto, 
  ResultadoModeladoDto,
  CreateProyectoDto,
  CreateAmbienteDto,
  CreateCargaDto
} from '../dto';

@ApiTags('Modelado Eléctrico')
@Controller('modelado')
// @UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ModeladoElectricoController {
  constructor(
    private readonly modeladoElectricoService: ModeladoElectricoService,
  ) {}

  @Post('generar-circuitos')
  @HttpCode(HttpStatus.OK)
  // @Roles(UserRole.INGENIERO, UserRole.TECNICO, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Generar circuitos eléctricos',
    description: 'Genera circuitos, protecciones y conductores para un proyecto completo según normativas RIE RD y NEC 2020'
  })
  @ApiResponse({
    status: 200,
    description: 'Circuitos generados exitosamente',
    type: ResultadoModeladoDto
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado'
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Rol insuficiente'
  })
  async generarCircuitos(
    @Body() dto: GenerarCircuitosDto
  ): Promise<ResultadoModeladoDto> {
    return this.modeladoElectricoService.generarCircuitos(dto);
  }

  @Get('proyectos/:id/resultados')
  @HttpCode(HttpStatus.OK)
  // @Roles(UserRole.INGENIERO, UserRole.TECNICO, UserRole.ADMIN, UserRole.CLIENTE)
  @ApiOperation({
    summary: 'Obtener resultados del modelado',
    description: 'Obtiene los circuitos, protecciones y conductores generados para un proyecto'
  })
  @ApiParam({
    name: 'id',
    description: 'ID del proyecto',
    type: 'integer',
    example: 1
  })
  @ApiResponse({
    status: 200,
    description: 'Resultados obtenidos exitosamente',
    type: ResultadoModeladoDto
  })
  @ApiResponse({
    status: 404,
    description: 'Proyecto no encontrado o sin circuitos generados'
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Rol insuficiente'
  })
  async obtenerResultados(
    @Param('id', ParseIntPipe) proyectoId: number
  ): Promise<ResultadoModeladoDto> {
    return this.modeladoElectricoService.obtenerResultados(proyectoId);
  }

  @Post('proyectos')
  @HttpCode(HttpStatus.CREATED)
  // @Roles(UserRole.INGENIERO, UserRole.TECNICO, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Crear proyecto',
    description: 'Crea un nuevo proyecto para modelado eléctrico'
  })
  @ApiResponse({
    status: 201,
    description: 'Proyecto creado exitosamente'
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos'
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Rol insuficiente'
  })
  async crearProyecto(
    @Body() dto: CreateProyectoDto
  ) {
    // TODO: Implementar creación de proyecto
    return { message: 'Proyecto creado exitosamente', data: dto };
  }

  @Post('ambientes')
  @HttpCode(HttpStatus.CREATED)
  // @Roles(UserRole.INGENIERO, UserRole.TECNICO, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Crear ambiente',
    description: 'Crea un nuevo ambiente para un proyecto'
  })
  @ApiResponse({
    status: 201,
    description: 'Ambiente creado exitosamente'
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos'
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Rol insuficiente'
  })
  async crearAmbiente(
    @Body() dto: CreateAmbienteDto
  ) {
    // TODO: Implementar creación de ambiente
    return { message: 'Ambiente creado exitosamente', data: dto };
  }

  @Post('cargas')
  @HttpCode(HttpStatus.CREATED)
  // @Roles(UserRole.INGENIERO, UserRole.TECNICO, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Crear carga',
    description: 'Crea una nueva carga eléctrica para un ambiente'
  })
  @ApiResponse({
    status: 201,
    description: 'Carga creada exitosamente'
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos'
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Rol insuficiente'
  })
  async crearCarga(
    @Body() dto: CreateCargaDto
  ) {
    // TODO: Implementar creación de carga
    return { message: 'Carga creada exitosamente', data: dto };
  }
}
