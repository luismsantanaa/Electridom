import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstallationType } from './entities/installation-type.entity';
import { CreateInstallationTypeDto } from './dtos/create-installation-type.dto';
import { UpdateInstallationTypeDto } from './dtos/update-installation-type.dto';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { ISpecification } from '../../common/specifications/base.specification';
import { ActivoSpecification } from './specifications/activo.specification';
import {
  PaginatedResultDto,
  PaginationMeta,
} from '../../common/dtos/paginated-result.dto';

@Injectable()
export class InstallationTypesService {
  constructor(
    @InjectRepository(InstallationType)
    private readonly installationTypeRepository: Repository<InstallationType>,
  ) {}

  async create(
    createDto: CreateInstallationTypeDto,
    user: string,
  ): Promise<InstallationType> {
    const installationType = this.installationTypeRepository.create({
      ...createDto,
      usrCreate: user,
    });
    return await this.installationTypeRepository.save(installationType);
  }

  async findAll(
    query: PaginateQuery,
    specification?: ISpecification<InstallationType>,
  ): Promise<PaginatedResultDto<InstallationType>> {
    const queryBuilder =
      this.installationTypeRepository.createQueryBuilder('installationType');

    // Aplicar especificaciones si existen
    if (specification) {
      specification.toQueryBuilder(queryBuilder);
    } else {
      // Si no hay especificación, usar la predeterminada
      new ActivoSpecification().toQueryBuilder(queryBuilder);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const result = (await paginate<InstallationType>(query, queryBuilder, {
      sortableColumns: ['id', 'name', 'description', 'creationDate'],
      searchableColumns: ['name', 'description'],
      defaultSortBy: [['name', 'ASC']],
      defaultLimit: 10,
    })) as { data: InstallationType[]; meta: PaginationMeta };

    const totalItems = result.meta.totalItems ?? 0;
    const meta: PaginationMeta = {
      ...result.meta,
      totalItems,
    };

    return PaginatedResultDto.success(result.data, totalItems, meta);
  }

  async findOne(id: string): Promise<InstallationType> {
    const installationType = await this.installationTypeRepository.findOne({
      where: { id, active: true },
    });
    if (!installationType) {
      throw new NotFoundException(
        `Installation type with ID ${id} not found`,
      );
    }
    return installationType;
  }

  async update(
    id: string,
    updateDto: UpdateInstallationTypeDto,
    user: string,
  ): Promise<InstallationType> {
    const installationType = await this.findOne(id);
    Object.assign(installationType, {
      ...updateDto,
      usrUpdate: user,
    });
    return await this.installationTypeRepository.save(installationType);
  }

  async remove(id: string, user: string): Promise<void> {
    const installationType = await this.findOne(id);
    installationType.active = false;
    installationType.usrUpdate = user;
    await this.installationTypeRepository.save(installationType);
  }
}
