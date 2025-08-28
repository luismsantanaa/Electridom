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
import { Load } from './entities/load.entity';
import { CreateLoadDto } from './dto/create-load.dto';
import { UpdateLoadDto } from './dto/update-load.dto';

@Injectable()
export class LoadsService {
  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
  ) {}

  async create(createDto: CreateLoadDto, user: string): Promise<Load> {
    const load = this.loadRepository.create({
      name: `load ${createDto.artifactType}`, // Generar name automático
      power: 0, // value por defecto
      voltage: createDto.voltage,
      artifactType: { id: createDto.artifactType },
      usrCreate: user,
    });
    return await this.loadRepository.save(load);
  }

  async findAll(
    query: PaginateQuery,
    specification?: ISpecification<Load>,
  ): Promise<PaginatedResultDto<Load>> {
    const queryBuilder = this.loadRepository
      .createQueryBuilder('load')
      .leftJoinAndSelect('load.artifactType', 'artifactType');

    if (specification) {
      specification.toQueryBuilder(queryBuilder);
    } else {
      new ActivoSpecification(true).toQueryBuilder(queryBuilder);
    }

    const result = (await paginate<Load>(query, queryBuilder, {
      sortableColumns: [
        'id',
        'name',
        'power',
        'voltage',
        'active',
        'creationDate',
        'usrCreate',
        'updateDate',
        'usrUpdate',
      ],
      searchableColumns: ['name'],
      defaultSortBy: [['name', 'ASC']],
      defaultLimit: 10,
      relations: ['artifactType'],
    })) as { data: Load[]; meta: PaginationMeta };

    const totalItems = result.meta.totalItems ?? 0;
    const meta: PaginationMeta = {
      ...result.meta,
      totalItems,
    };

    return PaginatedResultDto.success(result.data, totalItems, meta);
  }

  async findOne(id: string): Promise<Load> {
    const load = await this.loadRepository.findOne({
      where: { id, active: true },
      relations: ['artifactType'],
    });
    if (!load) {
      throw new NotFoundException(`Load with ID ${id} not found`);
    }
    return load;
  }

  async update(
    id: string,
    updateDto: UpdateLoadDto,
    user: string,
  ): Promise<Load> {
    const load = await this.findOne(id);
    Object.assign(load, {
      ...updateDto,
      usrUpdate: user,
    });
    return await this.loadRepository.save(load);
  }

  async remove(id: string, user: string): Promise<void> {
    const load = await this.findOne(id);
    load.active = false;
    load.usrUpdate = user;
    await this.loadRepository.save(load);
  }
}
