import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CargasService } from './cargas.service';
import { Cargas } from './entities/cargas.entity';
import { CreateCargaDto } from './dto/create-carga.dto';
import { UpdateCargaDto } from './dto/update-carga.dto';
import { NotFoundException } from '@nestjs/common';
import { PaginateQuery, paginate } from 'nestjs-paginate';
import { ActivoSpecification } from './specifications/activo.specification';

jest.mock('nestjs-paginate', () => ({
  paginate: jest.fn(),
}));

describe('CargasService', () => {
  let service: CargasService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CargasService,
        {
          provide: getRepositoryToken(Cargas),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CargasService>(CargasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new carga', async () => {
      const createDto: CreateCargaDto = {
        tipoAmbiente: '1',
        tipoArtefacto: '1',
        voltaje: 220,
        horasUso: 8,
        proyectoId: '1',
      };
      const usuario = 'testUser';
      const expectedCarga = {
        ...createDto,
        id: '1',
        activo: true,
        creadoPor: usuario,
      };

      mockRepository.create.mockReturnValue(expectedCarga);
      mockRepository.save.mockResolvedValue(expectedCarga);

      const result = await service.create(createDto, usuario);

      expect(result).toEqual(expectedCarga);
      expect(mockRepository.create).toHaveBeenCalledWith({
        nombre: `Carga ${createDto.tipoArtefacto}`,
        potencia: 0,
        voltaje: createDto.voltaje,
        tipoArtefacto: { id: createDto.tipoArtefacto },
        usrCreate: usuario,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(expectedCarga);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const query: PaginateQuery = {
        page: 1,
        limit: 10,
        path: '/cargas',
      };
      const mockData = [
        {
          id: '1',
          tipoAmbiente: { id: '1', nombre: 'Test Ambiente' },
          tipoArtefacto: { id: '1', nombre: 'Test Artefacto' },
          activo: true,
        },
      ];
      const mockMeta = {
        itemsPerPage: 10,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        sortBy: [['tipoAmbiente', 'ASC']],
        searchBy: ['tipoAmbiente', 'tipoArtefacto'],
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
        path: '/cargas',
      };
      const specification = new ActivoSpecification(true);

      const mockData = [
        {
          id: '1',
          tipoAmbiente: { id: '1', nombre: 'Test Ambiente' },
          tipoArtefacto: { id: '1', nombre: 'Test Artefacto' },
          activo: true,
        },
      ];
      const mockMeta = {
        itemsPerPage: 10,
        totalItems: 1,
        currentPage: 1,
        totalPages: 1,
        sortBy: [['tipoAmbiente', 'ASC']],
        searchBy: ['tipoAmbiente', 'tipoArtefacto'],
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
    it('should return a carga by id', async () => {
      const id = '1';
      const expectedCarga = {
        id,
        tipoAmbiente: { id: '1', nombre: 'Test Ambiente' },
        tipoArtefacto: { id: '1', nombre: 'Test Artefacto' },
        activo: true,
      };

      mockRepository.findOne.mockResolvedValue(expectedCarga);

      const result = await service.findOne(id);

      expect(result).toEqual(expectedCarga);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id, active: true },
        relations: ['tipoArtefacto'],
      });
    });

    it('should throw NotFoundException when carga not found', async () => {
      const id = '1';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a carga', async () => {
      const id = '1';
      const updateDto: UpdateCargaDto = {
        voltaje: 110,
      };
      const usuario = 'testUser';
      const existingCarga = {
        id,
        tipoAmbiente: { id: '1', nombre: 'Test Ambiente' },
        tipoArtefacto: { id: '1', nombre: 'Test Artefacto' },
        activo: true,
      };
      const updatedCarga = {
        ...existingCarga,
        ...updateDto,
        actualizadoPor: usuario,
      };

      mockRepository.findOne.mockResolvedValue(existingCarga);
      mockRepository.save.mockResolvedValue(updatedCarga);

      const result = await service.update(id, updateDto, usuario);

      expect(result).toEqual(updatedCarga);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          usrUpdate: usuario,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a carga', async () => {
      const id = '1';
      const usuario = 'testUser';
      const existingCarga = {
        id,
        tipoAmbiente: { id: '1', nombre: 'Test Ambiente' },
        tipoArtefacto: { id: '1', nombre: 'Test Artefacto' },
        activo: true,
      };
      const deletedCarga = {
        ...existingCarga,
        activo: false,
        actualizadoPor: usuario,
      };

      mockRepository.findOne.mockResolvedValue(existingCarga);
      mockRepository.save.mockResolvedValue(deletedCarga);

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
