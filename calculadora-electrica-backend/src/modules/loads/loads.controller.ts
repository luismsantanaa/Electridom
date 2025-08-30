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
import { LoadsService } from './loads.service';
import { CreateLoadDto } from './dto/create-load.dto';
import { UpdateLoadDto } from './dto/update-load.dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Paginate } from '../../common/decorators/paginate.decorator';
import { PaginateQuery } from 'nestjs-paginate';
import { BaseSpecification } from '../../common/specifications/base.specification';
import { ActivoSpecification } from './specifications/activo.specification';
import { NombreSpecification } from './specifications/nombre.specification';
import { Load } from './entities/load.entity';

@Controller('loads')
@UseGuards(JwtAuthGuard)
export class LoadsController {
  constructor(private readonly loadsService: LoadsService) {}

  @Post()
  create(@Body() createLoadDto: CreateLoadDto, @CurrentUser() user: User) {
    return this.loadsService.create(createLoadDto, user.username);
  }

  @Get()
  findAll(
    @Paginate() query: PaginateQuery,
    @Query('name') name?: string,
    @Query('active') active?: boolean,
  ) {
    let specification: BaseSpecification<Load> = new ActivoSpecification(
      active ?? true,
    );

    if (name) {
      specification = specification.and(new NombreSpecification(name));
    }

    return this.loadsService.findAll(query, specification);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.loadsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLoadDto: UpdateLoadDto,
    @CurrentUser() user: User,
  ) {
    return this.loadsService.update(id, updateLoadDto, user.username);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.loadsService.remove(id, user.username);
  }
}
