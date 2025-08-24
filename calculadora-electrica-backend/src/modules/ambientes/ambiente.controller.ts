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
import { AmbienteService } from './ambiente.service';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';
import { UpdateAmbienteDto } from './dto/update-ambiente.dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Paginate } from '../../common/decorators/paginate.decorator';
import { PaginateQuery } from 'nestjs-paginate';
import { BaseSpecification } from '../../common/specifications/base.specification';
import { ActivoSpecification } from './specifications/activo.specification';
import { NombreSpecification } from './specifications/nombre.specification';
import { Ambiente } from './entities/ambiente.entity';

@Controller('ambientes')
@UseGuards(JwtAuthGuard)
export class AmbienteController {
  constructor(private readonly ambienteService: AmbienteService) {}

  @Post()
  create(
    @Body() createAmbienteDto: CreateAmbienteDto,
    @CurrentUser() user: User,
  ) {
    return this.ambienteService.create(createAmbienteDto, user.username);
  }

  @Get()
  findAll(
    @Paginate() query: PaginateQuery,
    @Query('nombre') nombre?: string,
    @Query('activo') activo?: boolean,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    let specification: BaseSpecification<Ambiente> = new ActivoSpecification(
      activo ?? true,
    );

    if (nombre) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
      specification = specification.and(new NombreSpecification(nombre));
    }

    return this.ambienteService.findAll(query, specification);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ambienteService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAmbienteDto: UpdateAmbienteDto,
    @CurrentUser() user: User,
  ) {
    return this.ambienteService.update(id, updateAmbienteDto, user.username);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ambienteService.remove(id, user.username);
  }
}
