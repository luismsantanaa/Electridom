import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TiposArtefactosService } from './tipos-artefactos.service';
import { CreateTipoArtefactoDto } from './dtos/create-tipo-artefacto.dto';
import { UpdateTipoArtefactoDto } from './dtos/update-tipo-artefacto.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Paginate } from '../../common/decorators/paginate.decorator';
import { PaginateQuery } from 'nestjs-paginate';

@Controller('tipos-artefactos')
@UseGuards(JwtAuthGuard)
export class TiposArtefactosController {
  constructor(
    private readonly tiposArtefactosService: TiposArtefactosService,
  ) {}

  @Post()
  create(
    @Body() createTipoArtefactoDto: CreateTipoArtefactoDto,
    @CurrentUser() user: User,
  ) {
    return this.tiposArtefactosService.create(
      createTipoArtefactoDto,
      user.username,
    );
  }

  @Get()
  findAll(@Paginate() query: PaginateQuery) {
    return this.tiposArtefactosService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tiposArtefactosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTipoArtefactoDto: UpdateTipoArtefactoDto,
    @CurrentUser() user: User,
  ) {
    return this.tiposArtefactosService.update(
      id,
      updateTipoArtefactoDto,
      user.username,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tiposArtefactosService.remove(id, user.username);
  }
}
