import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Environment } from './entities/environment.entity';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { ISpecification } from '../../common/specifications/base.specification';
import { ActivoSpecification } from './specifications/activo.specification';
import {
  PaginatedResultDto,
  PaginationMeta,
} from '../../common/dtos/paginated-result.dto';

@Injectable()
export class EnvironmentService {
  constructor(
    @InjectRepository(Environment)
    private readonly environmentRepository: Repository<Environment>,
  ) {}

  async create(
    createDto: CreateEnvironmentDto,
    user: string,
  ): Promise<Environment> {
    const environment = this.environmentRepository.create({
      name: createDto.name,
      area:
        createDto.area ||
        (createDto.length && createDto.width
          ? createDto.length * createDto.width
          : 0),
      environmentType: { id: createDto.environmentTypeId },
      usrCreate: user,
    });

    return await this.environmentRepository.save(environment);
  }

  async findAll(
    query: PaginateQuery,
    specification?: ISpecification<Environment>,
  ): Promise<PaginatedResultDto<Environment>> {
    const queryBuilder = this.environmentRepository
      .createQueryBuilder('environment')
      .leftJoinAndSelect('environment.environmentType', 'environmentType')
      .leftJoinAndSelect(
        'environmentType.installationType',
        'installationType',
      );

    if (specification) {
      specification.toQueryBuilder(queryBuilder);
    } else {
      new ActivoSpecification(true).toQueryBuilder(queryBuilder);
    }

    const result = (await paginate<Environment>(query, queryBuilder, {
      sortableColumns: [
        'id',
        'name',
        'area',
        'active',
        'creationDate',
        'usrCreate',
        'updateDate',
        'usrUpdate',
      ],
      searchableColumns: ['name'],
      defaultSortBy: [['name', 'ASC']],
      defaultLimit: 10,
      relations: ['environmentType', 'environmentType.installationType'],
    })) as { data: Environment[]; meta: PaginationMeta };

    const totalItems = result.meta.totalItems ?? 0;
    const meta: PaginationMeta = {
      ...result.meta,
      totalItems,
    };

    return PaginatedResultDto.success(result.data, totalItems, meta);
  }

  async findOne(id: string): Promise<Environment> {
    const environment = await this.environmentRepository.findOne({
      where: { id, active: true },
      relations: ['environmentType', 'environmentType.installationType'],
    });
    if (!environment) {
      throw new NotFoundException(`environment con ID ${id} no encontrado`);
    }
    return environment;
  }

  async update(
    id: string,
    updateDto: UpdateEnvironmentDto,
    user: string,
  ): Promise<Environment> {
    const environment = await this.findOne(id);
    Object.assign(environment, {
      ...updateDto,
      usrUpdate: user,
    });
    return await this.environmentRepository.save(environment);
  }

  async remove(id: string, user: string): Promise<void> {
    const environment = await this.findOne(id);
    environment.active = false;
    environment.usrUpdate = user;
    await this.environmentRepository.save(environment);
  }
}
