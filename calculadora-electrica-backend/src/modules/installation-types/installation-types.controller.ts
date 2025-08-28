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
import { InstallationTypesService } from './installation-types.service';
import { CreateInstallationTypeDto } from './dtos/create-installation-type.dto';
import { UpdateInstallationTypeDto } from './dtos/update-installation-type.dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { Paginate } from '../../common/decorators/paginate.decorator';
import { PaginateQuery } from 'nestjs-paginate';
import { BaseSpecification } from '../../common/specifications/base.specification';
import { ActivoSpecification } from './specifications/activo.specification';
import { NombreSpecification } from './specifications/nombre.specification';
import { InstallationType } from './entities/installation-type.entity';

@Controller('installation-types')
@UseGuards(JwtAuthGuard)
export class InstallationTypesController {
  constructor(
    private readonly installationTypesService: InstallationTypesService,
  ) {}

  @Post()
  create(
    @Body() createInstallationTypeDto: CreateInstallationTypeDto,
    @CurrentUser('username') user: string,
  ) {
    return this.installationTypesService.create(
      createInstallationTypeDto,
      user,
    );
  }

  @Get()
  findAll(
    @Paginate() query: PaginateQuery,
    @Query('name') name?: string,
    @Query('active') active?: boolean,
  ) {
    let specification: BaseSpecification<InstallationType> =
      new ActivoSpecification(active ?? true);

    if (name) {
      specification = specification.and(new NombreSpecification(name));
    }

    return this.installationTypesService.findAll(query, specification);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.installationTypesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInstallationTypeDto: UpdateInstallationTypeDto,
    @CurrentUser('username') user: string,
  ) {
    return this.installationTypesService.update(
      id,
      updateInstallationTypeDto,
      user,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('username') user: string) {
    return this.installationTypesService.remove(id, user);
  }
}

