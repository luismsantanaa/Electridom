import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ambiente } from './entities/ambiente.entity';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';
import { UpdateAmbienteDto } from './dto/update-ambiente.dto';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { ISpecification } from '../../common/specifications/base.specification';
import { ActivoSpecification } from './specifications/activo.specification';
import {
  PaginatedResultDto,
  PaginationMeta,
} from '../../common/dtos/paginated-result.dto';

@Injectable()
export class AmbienteService {
  constructor(
    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
  ) {}

  async create(createDto: CreateAmbienteDto, usuario: string): Promise<Ambiente> {
    const ambiente = this.ambienteRepository.create({
      nombre: createDto.nombre,
      area: createDto.area || (createDto.largo && createDto.ancho ? createDto.largo * createDto.ancho : 0),
      tipoAmbiente: { id: createDto.tipoAmbienteId },
      usrCreate: usuario,
    });

    return await this.ambienteRepository.save(ambiente);
  }

  async findAll(
    query: PaginateQuery,
    specification?: ISpecification<Ambiente>,
  ): Promise<PaginatedResultDto<Ambiente>> {
    const queryBuilder = this.ambienteRepository
      .createQueryBuilder('ambiente')
      .leftJoinAndSelect('ambiente.tipoAmbiente', 'tipoAmbiente')
      .leftJoinAndSelect('tipoAmbiente.tipoInstalacion', 'tipoInstalacion');

    if (specification) {
      specification.toQueryBuilder(queryBuilder);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      new ActivoSpecification(true).toQueryBuilder(queryBuilder);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const result = (await paginate<Ambiente>(query, queryBuilder, {
      sortableColumns: [
        'id',
        'nombre',
        'area',
        'active',
        'creationDate',
        'usrCreate',
        'updateDate',
        'usrUpdate',
      ],
      searchableColumns: ['nombre'],
      defaultSortBy: [['nombre', 'ASC']],
      defaultLimit: 10,
      relations: ['tipoAmbiente', 'tipoAmbiente.tipoInstalacion'],
    })) as { data: Ambiente[]; meta: PaginationMeta };

    const totalItems = result.meta.totalItems ?? 0;
    const meta: PaginationMeta = {
      ...result.meta,
      totalItems,
    };

    return PaginatedResultDto.success(result.data, totalItems, meta);
  }

  async findOne(id: string): Promise<Ambiente> {
    const ambiente = await this.ambienteRepository.findOne({
      where: { id, active: true },
      relations: ['tipoAmbiente', 'tipoAmbiente.tipoInstalacion'],
    });
    if (!ambiente) {
      throw new NotFoundException(`Ambiente con ID ${id} no encontrado`);
    }
    return ambiente;
  }

  async update(
    id: string,
    updateDto: UpdateAmbienteDto,
    usuario: string,
  ): Promise<Ambiente> {
    const ambiente = await this.findOne(id);
    Object.assign(ambiente, {
      ...updateDto,
      actualizadoPor: usuario,
    });
    return await this.ambienteRepository.save(ambiente);
  }

  async remove(id: string, usuario: string): Promise<void> {
    const ambiente = await this.findOne(id);
    ambiente.active = false;
    ambiente.usrUpdate = usuario;
    await this.ambienteRepository.save(ambiente);
  }
}
