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
import { CargasService } from './cargas.service';
import { CreateCargaDto } from './dto/create-carga.dto';
import { UpdateCargaDto } from './dto/update-carga.dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Paginate } from '../../common/decorators/paginate.decorator';
import { PaginateQuery } from 'nestjs-paginate';
import { BaseSpecification } from '../../common/specifications/base.specification';
import { ActivoSpecification } from './specifications/activo.specification';
import { NombreSpecification } from './specifications/nombre.specification';
import { Cargas } from './entities/cargas.entity';

@Controller('cargas')
@UseGuards(JwtAuthGuard)
export class CargasController {
  constructor(private readonly cargasService: CargasService) {}

  @Post()
  create(@Body() createCargaDto: CreateCargaDto, @CurrentUser() user: User) {
    return this.cargasService.create(createCargaDto, user.username);
  }

  @Get()
  findAll(
    @Paginate() query: PaginateQuery,
    @Query('nombre') nombre?: string,
    @Query('activo') activo?: boolean,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    let specification: BaseSpecification<Cargas> = new ActivoSpecification(
      activo ?? true,
    );

    if (nombre) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
      specification = specification.and(new NombreSpecification(nombre));
    }

    return this.cargasService.findAll(query, specification);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cargasService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCargaDto: UpdateCargaDto,
    @CurrentUser() user: User,
  ) {
    return this.cargasService.update(id, updateCargaDto, user.username);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.cargasService.remove(id, user.username);
  }
}
