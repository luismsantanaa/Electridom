import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TiposInstalacionesService } from './tipos-instalaciones.service';
import { CreateTipoInstalacionDto } from './dtos/create-tipo-instalacion.dto';
import { UpdateTipoInstalacionDto } from './dtos/update-tipo-instalacion.dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { Paginate } from '../../common/decorators/paginate.decorator';
import { PaginateQuery } from 'nestjs-paginate';
import { BaseSpecification } from '../../common/specifications/base.specification';
import { ActivoSpecification } from './specifications/activo.specification';
import { NombreSpecification } from './specifications/nombre.specification';
import { TipoInstalacion } from './entities/tipo-instalacion.entity';

@Controller('tipos-instalaciones')
@UseGuards(JwtAuthGuard)
export class TiposInstalacionesController {
  constructor(
    private readonly tiposInstalacionesService: TiposInstalacionesService,
  ) {}

  @Post()
  create(
    @Body() createTipoInstalacionDto: CreateTipoInstalacionDto,
    @CurrentUser('username') usuario: string,
  ) {
    return this.tiposInstalacionesService.create(
      createTipoInstalacionDto,
      usuario,
    );
  }

  @Get()
  findAll(
    @Paginate() query: PaginateQuery,
    @Query('nombre') nombre?: string,
    @Query('activo') activo?: boolean,
  ) {
    let specification: BaseSpecification<TipoInstalacion> =
      new ActivoSpecification(activo ?? true);

    if (nombre) {
      specification = specification.and(new NombreSpecification(nombre));
    }

    return this.tiposInstalacionesService.findAll(query, specification);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tiposInstalacionesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTipoInstalacionDto: UpdateTipoInstalacionDto,
    @CurrentUser('username') usuario: string,
  ) {
    return this.tiposInstalacionesService.update(
      id,
      updateTipoInstalacionDto,
      usuario,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('username') usuario: string) {
    return this.tiposInstalacionesService.remove(id, usuario);
  }
}
