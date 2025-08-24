import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AmbienteService } from './ambiente.service';
import { Ambiente } from './entities/ambiente.entity';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';
import { UpdateAmbienteDto } from './dto/update-ambiente.dto';
import { NotFoundException } from '@nestjs/common';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { ActivoSpecification } from './specifications/activo.specification';
import { tipoSuperficieEnum } from '../../common/dtos/enums';

jest.mock('nestjs-paginate', () => ({
  paginate: jest.fn(),
}));

describe('AmbienteService', () => {
  let service: AmbienteService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AmbienteService,
        {
          provide: getRepositoryToken(Ambiente),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AmbienteService>(AmbienteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new ambiente', async () => {
      const createDto: CreateAmbienteDto = {
        nombre: 'Test Ambiente',
        tipoAmbienteId: '1',
        tipoSuperficie: tipoSuperficieEnum.RECTANGULAR,
        proyectoId: '1',
      };
      const usuario = 'testUser';
      const expectedAmbiente = {
        ...createDto,
        id: '1',
        activo: true,
        creadoPor: usuario,
      };

      mockRepository.create.mockReturnValue(expectedAmbiente);
      mockRepository.save.mockResolvedValue(expectedAmbiente);

      const result = await service.create(createDto, usuario);

      expect(result).toEqual(expectedAmbiente);
      expect(mockRepository.create).toHaveBeenCalledWith({
        nombre: createDto.nombre,
        area: 0, // calculado como largo * ancho o 0 si no se proporciona
        tipoAmbiente: { id: createDto.tipoAmbienteId },
        usrCreate: usuario,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedAmbiente);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/ambientes',
      };
      const mockData = [
        {
          id: '1',
          nombre: 'Test Ambiente',
          activo: true,
        },
      ];
      const mockMeta = {
        itemsPerPage: 10,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        sortBy: [['nombre', 'ASC']],
        searchBy: ['nombre'],
        search: '',
        select: [],
      };

      const mockPaginateResult = {
        data: mockData,
        meta: mockMeta,
      };

      (paginate as jest.Mock).mockResolvedValue(mockPaginateResult);

      const result = await service.findAll(query);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(1);
      expect(result.meta).toEqual(mockMeta);
    });

    it('should apply specification when provided', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/ambientes',
      };
      const specification = new ActivoSpecification(true);

      const mockData = [
        {
          id: '1',
          nombre: 'Test Ambiente',
          activo: true,
        },
      ];
      const mockMeta = {
        itemsPerPage: 10,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        sortBy: [['nombre', 'ASC']],
        searchBy: ['nombre'],
        search: '',
        select: [],
      };

      const mockPaginateResult = {
        data: mockData,
        meta: mockMeta,
      };

      (paginate as jest.Mock).mockResolvedValue(mockPaginateResult);

      await service.findAll(query, specification);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an ambiente by id', async () => {
      const id = '1';
      const expectedAmbiente = {
        id,
        nombre: 'Test Ambiente',
        activo: true,
      };

      mockRepository.findOne.mockResolvedValue(expectedAmbiente);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedAmbiente);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id, active: true },
        relations: ['tipoAmbiente', 'tipoAmbiente.tipoInstalacion'],
      });
    });

    it('should throw NotFoundException when ambiente not found', async () => {
      const id = '1';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an ambiente', async () => {
      const id = '1';
      const updateDto: UpdateAmbienteDto = {
        nombre: 'Updated Ambiente',
      };
      const usuario = 'testUser';
      const existingAmbiente = {
        id,
        nombre: 'Test Ambiente',
        activo: true,
      };
      const updatedAmbiente = {
        ...existingAmbiente,
        ...updateDto,
        actualizadoPor: usuario,
      };

      mockRepository.findOne.mockResolvedValue(existingAmbiente);
      mockRepository.save.mockResolvedValue(updatedAmbiente);

      const result = await service.update(id, updateDto, usuario);

      expect(result).toEqual(updatedAmbiente);
      expect(mockRepository.save).toHaveBeenCalledWith(updatedAmbiente);
    });
  });

  describe('remove', () => {
    it('should soft delete an ambiente', async () => {
      const id = '1';
      const usuario = 'testUser';
      const existingAmbiente = {
        id,
        nombre: 'Test Ambiente',
        activo: true,
      };
      const deletedAmbiente = {
        ...existingAmbiente,
        activo: false,
        actualizadoPor: usuario,
      };

      mockRepository.findOne.mockResolvedValue(existingAmbiente);
      mockRepository.save.mockResolvedValue(deletedAmbiente);

      await service.remove(id, usuario);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          active: false,
          usrUpdate: usuario,
        }),
      );
    });
  });
});
