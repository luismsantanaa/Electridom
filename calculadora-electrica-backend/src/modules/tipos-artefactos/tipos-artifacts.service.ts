import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoArtefacto } from './entities/type-artifact.entity';
import { CreateTipoArtefactoDto } from './dtos/create-type-artifact.dto';
import { UpdateTipoArtefactoDto } from './dtos/update-type-artifact.dto';
import { PaginateQuery, paginate } from 'nestjs-paginate';

@Injectable()
export class TiposArtefactosService {
  constructor(
    @InjectRepository(TipoArtefacto)
    private readonly tipoArtefactoRepository: Repository<TipoArtefacto>,
  ) {}

  async create(
    createDto: CreateTipoArtefactoDto,
    user: string,
  ): Promise<TipoArtefacto> {
    const tipoArtefacto = this.tipoArtefactoRepository.create({
      ...createDto,
      // tipoAmbiente: { id: createDto.tipoAmbiente_Id },
              usrCreate: user,
    });
    return await this.tipoArtefactoRepository.save(tipoArtefacto);
  }

  async findAll(query: PaginateQuery) {
    const queryBuilder = this.tipoArtefactoRepository
      .createQueryBuilder('tipoArtefacto')
      .leftJoinAndSelect('tipoArtefacto.tipoAmbiente', 'tipoAmbiente')
      .leftJoinAndSelect('tipoAmbiente.tipoInstalacion', 'tipoInstalacion')
      .where('tipoArtefacto.activo = :activo', { activo: true });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return await paginate(query, queryBuilder, {
      sortableColumns: ['id', 'name', 'creationDate'],
      searchableColumns: ['name'],
      defaultSortBy: [['name', 'ASC']],
      defaultLimit: 10,
      relations: ['tipoAmbiente', 'tipoAmbiente.tipoInstalacion'],
    });
  }

  async findOne(id: string): Promise<TipoArtefacto> {
    const tipoArtefacto = await this.tipoArtefactoRepository.findOne({
      where: { id, active: true },
      relations: ['tipoAmbiente'],
    });
    if (!tipoArtefacto) {
      throw new NotFoundException(
        `type de artefacto con ID ${id} no encontrado`,
      );
    }
    return tipoArtefacto;
  }

  async update(
    id: string,
    updateDto: UpdateTipoArtefactoDto,
    user: string,
  ): Promise<TipoArtefacto> {
    const tipoArtefacto = await this.findOne(id);
    const updateData = {
      ...updateDto,
      usrUpdate: user,
    };

    if (updateDto.tipoAmbiente_Id) {
      updateData['tipoAmbiente'] = { id: updateDto.tipoAmbiente_Id };
    }

    Object.assign(tipoArtefacto, updateData);
    return await this.tipoArtefactoRepository.save(tipoArtefacto);
  }

  async remove(id: string, user: string): Promise<void> {
    const tipoArtefacto = await this.findOne(id);
    tipoArtefacto.active = false;
    tipoArtefacto.usrUpdate = user;
    await this.tipoArtefactoRepository.save(tipoArtefacto);
  }
}

