import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArtifactType } from './entities/artifact-type.entity';
import { CreateArtifactTypeDto } from './dtos/create-artifact-type.dto';
import { UpdateArtifactTypeDto } from './dtos/update-artifact-type.dto';
import { PaginateQuery, paginate } from 'nestjs-paginate';

@Injectable()
export class ArtifactTypesService {
  constructor(
    @InjectRepository(ArtifactType)
    private readonly artifactTypeRepository: Repository<ArtifactType>,
  ) {}

  async create(
    createDto: CreateArtifactTypeDto,
    user: string,
  ): Promise<ArtifactType> {
    const artifactType = this.artifactTypeRepository.create({
      ...createDto,
      usrCreate: user,
    });
    return await this.artifactTypeRepository.save(artifactType);
  }

  async findAll(query: PaginateQuery) {
    const queryBuilder = this.artifactTypeRepository
      .createQueryBuilder('artifactType')
      .leftJoinAndSelect('artifactType.environmentType', 'environmentType')
      .leftJoinAndSelect('environmentType.installationType', 'installationType')
      .where('artifactType.active = :active', { active: true });

    return await paginate(query, queryBuilder, {
      sortableColumns: ['id', 'name', 'creationDate'],
      searchableColumns: ['name'],
      defaultSortBy: [['name', 'ASC']],
      defaultLimit: 10,
      relations: ['environmentType', 'environmentType.installationType'],
    });
  }

  async findOne(id: string): Promise<ArtifactType> {
    const artifactType = await this.artifactTypeRepository.findOne({
      where: { id, active: true },
      relations: ['environmentType'],
    });
    if (!artifactType) {
      throw new NotFoundException(`Artifact type with ID ${id} not found`);
    }
    return artifactType;
  }

  async update(
    id: string,
    updateDto: UpdateArtifactTypeDto,
    user: string,
  ): Promise<ArtifactType> {
    const artifactType = await this.findOne(id);
    const updateData = {
      ...updateDto,
      usrUpdate: user,
    };

    if (updateDto.environmentTypeId) {
      updateData['environmentType'] = { id: updateDto.environmentTypeId };
    }

    Object.assign(artifactType, updateData);
    return await this.artifactTypeRepository.save(artifactType);
  }

  async remove(id: string, user: string): Promise<void> {
    const artifactType = await this.findOne(id);
    artifactType.active = false;
    artifactType.usrUpdate = user;
    await this.artifactTypeRepository.save(artifactType);
  }
}
