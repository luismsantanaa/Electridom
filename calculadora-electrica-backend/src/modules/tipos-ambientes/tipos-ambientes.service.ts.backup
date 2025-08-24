import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoAmbiente } from './entities/type-environment.entity';
import { CreateTipoAmbienteDto } from './dtos/create-type-environment.dto';
import { UpdateTipoAmbienteDto } from './dtos/update-type-environment.dto';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { BaseSpecification } from '../../common/specifications/base.specification';
import { ActivoSpecification } from './specifications/activo.specification';
import {
  PaginatedResultDto,
  PaginationMeta,
} from '../../common/dtos/paginated-result.dto';

@Injectable()
export class TiposAmbientesService {
  constructor(
    @InjectRepository(TipoAmbiente)
    private readonly tipoAmbienteRepository: Repository<TipoAmbiente>,
  ) {}

  async create(
    createDto: CreateTipoAmbienteDto,
    user: string,
  ): Promise<TipoAmbiente> {
    const tipoAmbiente = this.tipoAmbienteRepository.create({
      ...createDto,
      usrCreate: user,
    });
    return await this.tipoAmbienteRepository.save(tipoAmbiente);
  }

  async findAll(
    query: PaginateQuery,
    specification?: BaseSpecification<TipoAmbiente>,
  ): Promise<PaginatedResultDto<TipoAmbiente>> {
    const queryBuilder = this.tipoAmbienteRepository
      .createQueryBuilder('tipoAmbiente')
      .leftJoinAndSelect('tipoAmbiente.tipoInstalacion', 'tipoInstalacion');

    // Aplicar especificaciones si existen
    if (specification) {
      specification.toQueryBuilder(queryBuilder);
    } else {
      // Si no hay especificación, usar la predeterminada
      new ActivoSpecification().toQueryBuilder(queryBuilder);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const result = (await paginate<TipoAmbiente>(query, queryBuilder, {
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
      relations: ['tipoInstalacion'],
    })) as { data: TipoAmbiente[]; meta: PaginationMeta };

    const totalItems = result.meta.totalItems ?? 0;
    const meta: PaginationMeta = {
      ...result.meta,
      totalItems,
    };

    return PaginatedResultDto.success(result.data, totalItems, meta);
  }

  async findOne(id: string): Promise<TipoAmbiente> {
    const tipoAmbiente = await this.tipoAmbienteRepository.findOne({
      where: { id, active: true },
    });
    if (!tipoAmbiente) {
      throw new NotFoundException(
        `type de environment con ID ${id} no encontrado`,
      );
    }
    return tipoAmbiente;
  }

  async update(
    id: string,
    updateDto: UpdateTipoAmbienteDto,
    user: string,
  ): Promise<TipoAmbiente> {
    const tipoAmbiente = await this.findOne(id);
    Object.assign(tipoAmbiente, {
      ...updateDto,
      actualizadoPor: user,
    });
    return await this.tipoAmbienteRepository.save(tipoAmbiente);
  }

  async remove(id: string, user: string): Promise<void> {
    const tipoAmbiente = await this.findOne(id);
    tipoAmbiente.active = false;
    tipoAmbiente.usrUpdate = user;
    await this.tipoAmbienteRepository.save(tipoAmbiente);
  }
}

