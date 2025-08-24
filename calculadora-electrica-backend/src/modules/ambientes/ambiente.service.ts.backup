import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { environment } from './entities/environment.entity';
import { CreateAmbienteDto } from './dto/create-environment.dto';
import { UpdateAmbienteDto } from './dto/update-environment.dto';
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
    @InjectRepository(environment)
    private readonly ambienteRepository: Repository<environment>,
  ) {}

  async create(createDto: CreateAmbienteDto, user: string): Promise<environment> {
    const environment = this.ambienteRepository.create({
      name: createDto.name,
      area: createDto.area || (createDto.largo && createDto.ancho ? createDto.largo * createDto.ancho : 0),
      tipoAmbiente: { id: createDto.tipoAmbienteId },
      usrCreate: user,
    });

    return await this.ambienteRepository.save(environment);
  }

  async findAll(
    query: PaginateQuery,
    specification?: ISpecification<environment>,
  ): Promise<PaginatedResultDto<environment>> {
    const queryBuilder = this.ambienteRepository
      .createQueryBuilder('environment')
      .leftJoinAndSelect('environment.tipoAmbiente', 'tipoAmbiente')
      .leftJoinAndSelect('tipoAmbiente.tipoInstalacion', 'tipoInstalacion');

    if (specification) {
      specification.toQueryBuilder(queryBuilder);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      new ActivoSpecification(true).toQueryBuilder(queryBuilder);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const result = (await paginate<environment>(query, queryBuilder, {
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
      relations: ['tipoAmbiente', 'tipoAmbiente.tipoInstalacion'],
    })) as { data: environment[]; meta: PaginationMeta };

    const totalItems = result.meta.totalItems ?? 0;
    const meta: PaginationMeta = {
      ...result.meta,
      totalItems,
    };

    return PaginatedResultDto.success(result.data, totalItems, meta);
  }

  async findOne(id: string): Promise<environment> {
    const environment = await this.ambienteRepository.findOne({
      where: { id, active: true },
      relations: ['tipoAmbiente', 'tipoAmbiente.tipoInstalacion'],
    });
    if (!environment) {
      throw new NotFoundException(`environment con ID ${id} no encontrado`);
    }
    return environment;
  }

  async update(
    id: string,
    updateDto: UpdateAmbienteDto,
    user: string,
  ): Promise<environment> {
    const environment = await this.findOne(id);
    Object.assign(environment, {
      ...updateDto,
      actualizadoPor: user,
    });
    return await this.ambienteRepository.save(environment);
  }

  async remove(id: string, user: string): Promise<void> {
    const environment = await this.findOne(id);
    environment.active = false;
    environment.usrUpdate = user;
    await this.ambienteRepository.save(environment);
  }
}

