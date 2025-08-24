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
import { Cargas } from './entities/cargas.entity';
import { CreateCargaDto } from './dto/create-carga.dto';
import { UpdateCargaDto } from './dto/update-carga.dto';

@Injectable()
export class CargasService {
  constructor(
    @InjectRepository(Cargas)
    private readonly cargaRepository: Repository<Cargas>,
  ) {}

  async create(createDto: CreateCargaDto, usuario: string): Promise<Cargas> {
    const carga = this.cargaRepository.create({
      nombre: `Carga ${createDto.tipoArtefacto}`, // Generar nombre automático
      potencia: 0, // Valor por defecto
      voltaje: createDto.voltaje,
      tipoArtefacto: { id: createDto.tipoArtefacto },
      usrCreate: usuario,
    });
    return await this.cargaRepository.save(carga);
  }

  async findAll(
    query: PaginateQuery,
    specification?: ISpecification<Cargas>,
  ): Promise<PaginatedResultDto<Cargas>> {
    const queryBuilder = this.cargaRepository
      .createQueryBuilder('carga')
      .leftJoinAndSelect('carga.tipoArtefacto', 'tipoArtefacto');

    if (specification) {
      specification.toQueryBuilder(queryBuilder);
    } else {
      new ActivoSpecification(true).toQueryBuilder(queryBuilder);
    }

    const result = (await paginate<Cargas>(query, queryBuilder, {
      sortableColumns: [
        'id',
        'nombre',
        'potencia',
        'voltaje',
        'active',
        'creationDate',
        'usrCreate',
        'updateDate',
        'usrUpdate',
      ],
      searchableColumns: ['nombre'],
      defaultSortBy: [['nombre', 'ASC']],
      defaultLimit: 10,
      relations: ['tipoArtefacto'],
    })) as { data: Cargas[]; meta: PaginationMeta };

    const totalItems = result.meta.totalItems ?? 0;
    const meta: PaginationMeta = {
      ...result.meta,
      totalItems,
    };

    return PaginatedResultDto.success(result.data, totalItems, meta);
  }

  async findOne(id: string): Promise<Cargas> {
    const carga = await this.cargaRepository.findOne({
      where: { id, active: true },
      relations: ['tipoArtefacto'],
    });
    if (!carga) {
      throw new NotFoundException(`Carga con ID ${id} no encontrada`);
    }
    return carga;
  }

  async update(
    id: string,
    updateDto: UpdateCargaDto,
    usuario: string,
  ): Promise<Cargas> {
    const carga = await this.findOne(id);
    Object.assign(carga, {
      ...updateDto,
      usrUpdate: usuario,
    });
    return await this.cargaRepository.save(carga);
  }

  async remove(id: string, usuario: string): Promise<void> {
    const carga = await this.findOne(id);
    carga.active = false;
    carga.usrUpdate = usuario;
    await this.cargaRepository.save(carga);
  }
}
