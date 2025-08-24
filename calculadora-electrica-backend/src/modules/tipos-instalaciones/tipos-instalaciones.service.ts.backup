import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoInstalacion } from './entities/type-installation.entity';
import { CreateTipoInstalacionDto } from './dtos/create-type-installation.dto';
import { UpdateTipoInstalacionDto } from './dtos/update-type-installation.dto';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { ISpecification } from '../../common/specifications/base.specification';
import { ActivoSpecification } from './specifications/activo.specification';
import {
  PaginatedResultDto,
  PaginationMeta,
} from '../../common/dtos/paginated-result.dto';

@Injectable()
export class TiposInstalacionesService {
  constructor(
    @InjectRepository(TipoInstalacion)
    private readonly tipoInstalacionRepository: Repository<TipoInstalacion>,
  ) {}

  async create(
    createDto: CreateTipoInstalacionDto,
    user: string,
  ): Promise<TipoInstalacion> {
    const tipoInstalacion = this.tipoInstalacionRepository.create({
      ...createDto,
      usrCreate: user,
    });
    return await this.tipoInstalacionRepository.save(tipoInstalacion);
  }

  async findAll(
    query: PaginateQuery,
    specification?: ISpecification<TipoInstalacion>,
  ): Promise<PaginatedResultDto<TipoInstalacion>> {
    const queryBuilder =
      this.tipoInstalacionRepository.createQueryBuilder('tipoInstalacion');

    // Aplicar especificaciones si existen
    if (specification) {
      specification.toQueryBuilder(queryBuilder);
    } else {
      // Si no hay especificación, usar la predeterminada
      new ActivoSpecification().toQueryBuilder(queryBuilder);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const result = (await paginate<TipoInstalacion>(query, queryBuilder, {
      sortableColumns: ['id', 'name', 'description', 'creationDate'],
      searchableColumns: ['name', 'description'],
      defaultSortBy: [['name', 'ASC']],
      defaultLimit: 10,
    })) as { data: TipoInstalacion[]; meta: PaginationMeta };

    const totalItems = result.meta.totalItems ?? 0;
    const meta: PaginationMeta = {
      ...result.meta,
      totalItems,
    };

    return PaginatedResultDto.success(result.data, totalItems, meta);
  }

  async findOne(id: string): Promise<TipoInstalacion> {
    const tipoInstalacion = await this.tipoInstalacionRepository.findOne({
      where: { id, active: true },
    });
    if (!tipoInstalacion) {
      throw new NotFoundException(
        `type de instalación con ID ${id} no encontrado`,
      );
    }
    return tipoInstalacion;
  }

  async update(
    id: string,
    updateDto: UpdateTipoInstalacionDto,
    user: string,
  ): Promise<TipoInstalacion> {
    const tipoInstalacion = await this.findOne(id);
    Object.assign(tipoInstalacion, {
      ...updateDto,
      usrUpdate: user,
    });
    return await this.tipoInstalacionRepository.save(tipoInstalacion);
  }

  async remove(id: string, user: string): Promise<void> {
    const tipoInstalacion = await this.findOne(id);
    tipoInstalacion.active = false;
    tipoInstalacion.usrUpdate = user;
    await this.tipoInstalacionRepository.save(tipoInstalacion);
  }
}

