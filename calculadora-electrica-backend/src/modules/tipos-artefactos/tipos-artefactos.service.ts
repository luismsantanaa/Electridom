import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoArtefacto } from './entities/tipo-artefacto.entity';
import { CreateTipoArtefactoDto } from './dtos/create-tipo-artefacto.dto';
import { UpdateTipoArtefactoDto } from './dtos/update-tipo-artefacto.dto';
import { PaginateQuery, paginate } from 'nestjs-paginate';

@Injectable()
export class TiposArtefactosService {
  constructor(
    @InjectRepository(TipoArtefacto)
    private readonly tipoArtefactoRepository: Repository<TipoArtefacto>,
  ) {}

  async create(
    createDto: CreateTipoArtefactoDto,
    usuario: string,
  ): Promise<TipoArtefacto> {
    const tipoArtefacto = this.tipoArtefactoRepository.create({
      ...createDto,
      // tipoAmbiente: { id: createDto.tipoAmbiente_Id },
              usrCreate: usuario,
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
      sortableColumns: ['id', 'nombre', 'creationDate'],
      searchableColumns: ['nombre'],
      defaultSortBy: [['nombre', 'ASC']],
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
        `Tipo de artefacto con ID ${id} no encontrado`,
      );
    }
    return tipoArtefacto;
  }

  async update(
    id: string,
    updateDto: UpdateTipoArtefactoDto,
    usuario: string,
  ): Promise<TipoArtefacto> {
    const tipoArtefacto = await this.findOne(id);
    const updateData = {
      ...updateDto,
      usrUpdate: usuario,
    };

    if (updateDto.tipoAmbiente_Id) {
      updateData['tipoAmbiente'] = { id: updateDto.tipoAmbiente_Id };
    }

    Object.assign(tipoArtefacto, updateData);
    return await this.tipoArtefactoRepository.save(tipoArtefacto);
  }

  async remove(id: string, usuario: string): Promise<void> {
    const tipoArtefacto = await this.findOne(id);
    tipoArtefacto.active = false;
    tipoArtefacto.usrUpdate = usuario;
    await this.tipoArtefactoRepository.save(tipoArtefacto);
  }
}
