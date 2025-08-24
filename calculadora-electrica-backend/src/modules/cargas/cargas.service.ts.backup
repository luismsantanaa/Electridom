import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { ISpecification } from '../../common/specifications/base.specification';
import { ActivoSpecification } from './specifications/activo.specification';
import {
  PaginatedResultDto,
  PaginationMeta,
} from '../../common/dtos/paginated-result.dto';
import { loads } from './entities/loads.entity';
import { CreateCargaDto } from './dto/create-load.dto';
import { UpdateCargaDto } from './dto/update-load.dto';

@Injectable()
export class CargasService {
  constructor(
    @InjectRepository(loads)
    private readonly cargaRepository: Repository<loads>,
  ) {}

  async create(createDto: CreateCargaDto, user: string): Promise<loads> {
    const load = this.cargaRepository.create({
      name: `load ${createDto.tipoArtefacto}`, // Generar name automático
      potencia: 0, // value por defecto
      voltaje: createDto.voltaje,
      tipoArtefacto: { id: createDto.tipoArtefacto },
      usrCreate: user,
    });
    return await this.cargaRepository.save(load);
  }

  async findAll(
    query: PaginateQuery,
    specification?: ISpecification<loads>,
  ): Promise<PaginatedResultDto<loads>> {
    const queryBuilder = this.cargaRepository
      .createQueryBuilder('load')
      .leftJoinAndSelect('load.tipoArtefacto', 'tipoArtefacto');

    if (specification) {
      specification.toQueryBuilder(queryBuilder);
    } else {
      new ActivoSpecification(true).toQueryBuilder(queryBuilder);
    }

    const result = (await paginate<loads>(query, queryBuilder, {
      sortableColumns: [
        'id',
        'name',
        'potencia',
        'voltaje',
        'active',
        'creationDate',
        'usrCreate',
        'updateDate',
        'usrUpdate',
      ],
      searchableColumns: ['name'],
      defaultSortBy: [['name', 'ASC']],
      defaultLimit: 10,
      relations: ['tipoArtefacto'],
    })) as { data: loads[]; meta: PaginationMeta };

    const totalItems = result.meta.totalItems ?? 0;
    const meta: PaginationMeta = {
      ...result.meta,
      totalItems,
    };

    return PaginatedResultDto.success(result.data, totalItems, meta);
  }

  async findOne(id: string): Promise<loads> {
    const load = await this.cargaRepository.findOne({
      where: { id, active: true },
      relations: ['tipoArtefacto'],
    });
    if (!load) {
      throw new NotFoundException(`load con ID ${id} no encontrada`);
    }
    return load;
  }

  async update(
    id: string,
    updateDto: UpdateCargaDto,
    user: string,
  ): Promise<loads> {
    const load = await this.findOne(id);
    Object.assign(load, {
      ...updateDto,
      usrUpdate: user,
    });
    return await this.cargaRepository.save(load);
  }

  async remove(id: string, user: string): Promise<void> {
    const load = await this.findOne(id);
    load.active = false;
    load.usrUpdate = user;
    await this.cargaRepository.save(load);
  }
}

