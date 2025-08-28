import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnvironmentType } from './entities/environment-type.entity';
import { CreateEnvironmentTypeDto } from './dtos/create-environment-type.dto';
import { UpdateEnvironmentTypeDto } from './dtos/update-environment-type.dto';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { BaseSpecification } from '../../common/specifications/base.specification';
import { ActivoSpecification } from './specifications/activo.specification';
import {
  PaginatedResultDto,
  PaginationMeta,
} from '../../common/dtos/paginated-result.dto';

@Injectable()
export class EnvironmentTypesService {
  constructor(
    @InjectRepository(EnvironmentType)
    private readonly environmentTypeRepository: Repository<EnvironmentType>,
  ) {}

  async create(
    createDto: CreateEnvironmentTypeDto,
    user: string,
  ): Promise<EnvironmentType> {
    const environmentType = this.environmentTypeRepository.create({
      ...createDto,
      usrCreate: user,
    });
    return await this.environmentTypeRepository.save(environmentType);
  }

  async findAll(
    query: PaginateQuery,
    specification?: BaseSpecification<EnvironmentType>,
  ): Promise<PaginatedResultDto<EnvironmentType>> {
    const queryBuilder = this.environmentTypeRepository
      .createQueryBuilder('environmentType')
      .leftJoinAndSelect(
        'environmentType.installationType',
        'installationType',
      );

    // Aplicar especificaciones si existen
    if (specification) {
      specification.toQueryBuilder(queryBuilder);
    } else {
      // Si no hay especificación, usar la predeterminada
      new ActivoSpecification().toQueryBuilder(queryBuilder);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const result = (await paginate<EnvironmentType>(query, queryBuilder, {
      sortableColumns: [
        'id',
        'name',
        'active',
        'creationDate',
        'usrCreate',
        'updateDate',
        'usrUpdate',
      ],
      searchableColumns: ['name'],
      defaultSortBy: [['name', 'ASC']],
      defaultLimit: 10,
      relations: ['installationType'],
    })) as { data: EnvironmentType[]; meta: PaginationMeta };

    const totalItems = result.meta.totalItems ?? 0;
    const meta: PaginationMeta = {
      ...result.meta,
      totalItems,
    };

    return PaginatedResultDto.success(result.data, totalItems, meta);
  }

  async findOne(id: string): Promise<EnvironmentType> {
    const environmentType = await this.environmentTypeRepository.findOne({
      where: { id, active: true },
    });
    if (!environmentType) {
      throw new NotFoundException(`Environment type with ID ${id} not found`);
    }
    return environmentType;
  }

  async update(
    id: string,
    updateDto: UpdateEnvironmentTypeDto,
    user: string,
  ): Promise<EnvironmentType> {
    const environmentType = await this.findOne(id);
    Object.assign(environmentType, {
      ...updateDto,
      usrUpdate: user,
    });
    return await this.environmentTypeRepository.save(environmentType);
  }

  async remove(id: string, user: string): Promise<void> {
    const environmentType = await this.findOne(id);
    environmentType.active = false;
    environmentType.usrUpdate = user;
    await this.environmentTypeRepository.save(environmentType);
  }
}
