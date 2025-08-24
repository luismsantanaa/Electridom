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
import { TiposAmbientesService } from './tipos-ambientes.service';
import { CreateTipoAmbienteDto } from './dtos/create-tipo-ambiente.dto';
import { UpdateTipoAmbienteDto } from './dtos/update-tipo-ambiente.dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Paginate } from '../../common/decorators/paginate.decorator';
import { PaginateQuery } from 'nestjs-paginate';
import { BaseSpecification } from '../../common/specifications/base.specification';
import { ActivoSpecification } from './specifications/activo.specification';
import { NombreSpecification } from './specifications/nombre.specification';
import { TipoAmbiente } from './entities/tipo-ambiente.entity';

@Controller('tipos-ambientes')
@UseGuards(JwtAuthGuard)
export class TiposAmbientesController {
  constructor(private readonly tiposAmbientesService: TiposAmbientesService) {}

  @Post()
  create(
    @Body() createTipoAmbienteDto: CreateTipoAmbienteDto,
    @CurrentUser() user: User,
  ) {
    return this.tiposAmbientesService.create(
      createTipoAmbienteDto,
      user.username,
    );
  }

  @Get()
  findAll(
    @Paginate() query: PaginateQuery,
    @Query('nombre') nombre?: string,
    @Query('activo') activo?: boolean,
  ) {
    let specification: BaseSpecification<TipoAmbiente> =
      new ActivoSpecification(activo ?? true);

    if (nombre) {
      specification = specification.and(new NombreSpecification(nombre));
    }

    return this.tiposAmbientesService.findAll(query, specification);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tiposAmbientesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTipoAmbienteDto: UpdateTipoAmbienteDto,
    @CurrentUser() user: User,
  ) {
    return this.tiposAmbientesService.update(
      id,
      updateTipoAmbienteDto,
      user.username,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tiposAmbientesService.remove(id, user.username);
  }
}
