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
import { EnvironmentTypesService } from './environment-types.service';
import { CreateEnvironmentTypeDto } from './dtos/create-environment-type.dto';
import { UpdateEnvironmentTypeDto } from './dtos/update-environment-type.dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Paginate } from '../../common/decorators/paginate.decorator';
import { PaginateQuery } from 'nestjs-paginate';
import { BaseSpecification } from '../../common/specifications/base.specification';
import { ActivoSpecification } from './specifications/activo.specification';
import { NombreSpecification } from './specifications/nombre.specification';
import { EnvironmentType } from './entities/environment-type.entity';

@Controller('environment-types')
@UseGuards(JwtAuthGuard)
export class EnvironmentTypesController {
  constructor(private readonly environmentTypesService: EnvironmentTypesService) {}

  @Post()
  create(
    @Body() createEnvironmentTypeDto: CreateEnvironmentTypeDto,
    @CurrentUser() user: User,
  ) {
    return this.environmentTypesService.create(
      createEnvironmentTypeDto,
      user.username,
    );
  }

  @Get()
  findAll(
    @Paginate() query: PaginateQuery,
    @Query('name') name?: string,
    @Query('active') active?: boolean,
  ) {
    let specification: BaseSpecification<EnvironmentType> =
      new ActivoSpecification(active ?? true);

    if (name) {
      specification = specification.and(new NombreSpecification(name));
    }

    return this.environmentTypesService.findAll(query, specification);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.environmentTypesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEnvironmentTypeDto: UpdateEnvironmentTypeDto,
    @CurrentUser() user: User,
  ) {
    return this.environmentTypesService.update(
      id,
      updateEnvironmentTypeDto,
      user.username,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.environmentTypesService.remove(id, user.username);
  }
}

