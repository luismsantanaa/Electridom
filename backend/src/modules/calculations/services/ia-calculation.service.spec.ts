import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  IACalculationService,
  IACalculationRequest,
} from './ia-calculation.service';
import { Circuit } from '../entities/circuit.entity';
import { Protection } from '../entities/protection.entity';
import { BadRequestException, RequestTimeoutException } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('IACalculationService', () => {
  let service: IACalculationService;
  let configService: ConfigService;
  let httpService: HttpService;
  let circuitRepository: Repository<Circuit>;
  let protectionRepository: Repository<Protection>;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: any) => {
      const config = {
        IA_ENDPOINT: 'http://localhost:11434/api/generate',
        IA_API_KEY: 'test-key',
        IA_MODEL: 'electridom-v1',
        IA_TEMPERATURE: 0.2,
        IA_TOP_P: 0.9,
        IA_MAX_TOKENS: 1200,
        IA_TIMEOUT_MS: 20000,
        IA_RETRY_MAX_ATTEMPTS: 2,
        IA_RETRY_BACKOFF_MS: 1500,
      };
      return config[key] || defaultValue;
    }),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockCircuitRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockProtectionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IACalculationService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: getRepositoryToken(Circuit),
          useValue: mockCircuitRepository,
        },
        {
          provide: getRepositoryToken(Protection),
          useValue: mockProtectionRepository,
        },
      ],
    }).compile();

    service = module.get<IACalculationService>(IACalculationService);
    configService = module.get<ConfigService>(ConfigService);
    httpService = module.get<HttpService>(HttpService);
    circuitRepository = module.get<Repository<Circuit>>(
      getRepositoryToken(Circuit),
    );
    protectionRepository = module.get<Repository<Protection>>(
      getRepositoryToken(Protection),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateWithIA', () => {
    const mockRequest: IACalculationRequest = {
      projectId: 123,
      inputs: {
        superficies: [
          { nombre: 'Sala', area_m2: 18 },
          { nombre: 'Cocina', area_m2: 12 },
        ],
        consumos: [
          { equipo: 'Nevera', ambiente: 'Cocina', w: 300 },
          { equipo: 'TV', ambiente: 'Sala', w: 150 },
        ],
      },
    };

    const mockIAResponse = {
      response: JSON.stringify({
        circuits: [
          {
            area: 'Sala',
            loadVA: 1500,
            conductorGauge: '2.0 mm2',
            areaType: 'sala',
            phase: 1,
            voltage: 120,
            currentA: 12.5,
          },
          {
            area: 'Cocina',
            loadVA: 1800,
            conductorGauge: '2.0 mm2',
            areaType: 'cocina',
            phase: 1,
            voltage: 120,
            currentA: 15,
          },
        ],
        protections: [
          {
            circuitId: 1,
            breakerAmp: 20,
            differential: 'NONE',
            breakerType: 'MCB',
          },
          {
            circuitId: 2,
            breakerAmp: 20,
            differential: 'GFCI',
            breakerType: 'MCB',
          },
        ],
        explanations: [
          'Se agruparon cargas residenciales generales en 1800 VA por circuito.',
          'Se aplicó GFCI para la cocina según normativas de seguridad.',
        ],
      }),
    };

    const mockSavedCircuit = {
      id: 1,
      projectId: 123,
      loadVA: 1500,
      conductorGauge: '2.0 mm2',
      areaType: 'sala',
      phase: 1,
      voltage: 120,
      currentA: 12.5,
      notes: 'Generado por IA - Sala',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should calculate with IA successfully', async () => {
      // Arrange
      mockHttpService.post.mockReturnValue(of({ data: mockIAResponse }));
      mockCircuitRepository.create.mockReturnValue(mockSavedCircuit);
      mockCircuitRepository.save.mockResolvedValue(mockSavedCircuit);
      mockProtectionRepository.create.mockReturnValue({});
      mockProtectionRepository.save.mockResolvedValue({});

      // Act
      const result = await service.calculateWithIA(mockRequest);

      // Assert
      expect(result.projectId).toBe(123);
      expect(result.circuits).toHaveLength(2);
      expect(result.protections).toHaveLength(2);
      expect(result.explanations).toHaveLength(2);
      expect(result.metadata.model).toBe('electridom-v1');
      expect(result.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should throw BadRequestException for invalid project ID', async () => {
      // Arrange
      const invalidRequest = { ...mockRequest, projectId: 0 };

      // Act & Assert
      await expect(service.calculateWithIA(invalidRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for missing superficies', async () => {
      // Arrange
      const invalidRequest = {
        ...mockRequest,
        inputs: { ...mockRequest.inputs, superficies: [] },
      };

      // Act & Assert
      await expect(service.calculateWithIA(invalidRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for missing consumos', async () => {
      // Arrange
      const invalidRequest = {
        ...mockRequest,
        inputs: { ...mockRequest.inputs, consumos: [] },
      };

      // Act & Assert
      await expect(service.calculateWithIA(invalidRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for mismatched areas', async () => {
      // Arrange
      const invalidRequest = {
        ...mockRequest,
        inputs: {
          superficies: [{ nombre: 'Sala', area_m2: 18 }],
          consumos: [{ equipo: 'Nevera', ambiente: 'Cocina', w: 300 }],
        },
      };

      // Act & Assert
      await expect(service.calculateWithIA(invalidRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle IA timeout error', async () => {
      // Arrange
      const timeoutError = new Error('ECONNABORTED') as any;
      timeoutError.code = 'ECONNABORTED';
      mockHttpService.post.mockReturnValue(throwError(() => timeoutError));

      // Act & Assert
      await expect(service.calculateWithIA(mockRequest)).rejects.toThrow(
        RequestTimeoutException,
      );
    });

    it('should handle IA communication error', async () => {
      // Arrange
      const communicationError = new Error('Network error');
      mockHttpService.post.mockReturnValue(
        throwError(() => communicationError),
      );

      // Act & Assert
      await expect(service.calculateWithIA(mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getLastIAResult', () => {
    const mockCircuit = {
      id: 1,
      projectId: 123,
      loadVA: 1500,
      conductorGauge: '2.0 mm2',
      areaType: 'sala',
      phase: 1,
      voltage: 120,
      currentA: 12.5,
      notes: 'Generado por IA - Sala',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockProtection = {
      id: 1,
      circuitId: 1,
      breakerAmp: 20,
      breakerType: 'MCB',
      differentialType: 'NONE',
      notes: 'Protección generada por IA para sala',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return last IA result successfully', async () => {
      // Arrange
      mockCircuitRepository.find.mockResolvedValue([mockCircuit]);
      mockProtectionRepository.find.mockResolvedValue([mockProtection]);

      // Act
      const result = await service.getLastIAResult(123);

      // Assert
      expect(result).toBeDefined();
      expect(result?.projectId).toBe(123);
      expect(result?.circuits).toHaveLength(1);
      expect(result?.protections).toHaveLength(1);
    });

    it('should return null when no circuits found', async () => {
      // Arrange
      mockCircuitRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getLastIAResult(123);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getIAConfig', () => {
    it('should return IA configuration', () => {
      // Act
      const config = service.getIAConfig();

      // Assert
      expect(config).toBeDefined();
      expect(config.endpoint).toBe('http://localhost:11434/api/generate');
      expect(config.model).toBe('electridom-v1');
      expect(config.parameters.temperature).toBe(0.2);
      expect(config.parameters.top_p).toBe(0.9);
      expect(config.parameters.max_tokens).toBe(1200);
      expect(config.timeouts_ms.request).toBe(20000);
      expect(config.retry.maxAttempts).toBe(2);
      expect(config.retry.backoffMs).toBe(1500);
    });
  });

  describe('normalizeIAResponse', () => {
    it('should normalize Ollama response format', async () => {
      // Arrange
      const ollamaResponse = {
        response: JSON.stringify({
          circuits: [{ area: 'Test', loadVA: 1000 }],
          protections: [{ circuitId: 1, breakerAmp: 15 }],
          explanations: ['Test explanation'],
        }),
      };

      // Act
      const result = await service['normalizeIAResponse'](ollamaResponse, 123);

      // Assert
      expect(result.circuits).toHaveLength(1);
      expect(result.protections).toHaveLength(1);
      expect(result.explanations).toHaveLength(1);
    });

    it('should normalize OpenAI response format', async () => {
      // Arrange
      const openaiResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                circuits: [{ area: 'Test', loadVA: 1000 }],
                protections: [{ circuitId: 1, breakerAmp: 15 }],
                explanations: ['Test explanation'],
              }),
            },
          },
        ],
      };

      // Act
      const result = await service['normalizeIAResponse'](openaiResponse, 123);

      // Assert
      expect(result.circuits).toHaveLength(1);
      expect(result.protections).toHaveLength(1);
      expect(result.explanations).toHaveLength(1);
    });

    it('should throw error for unrecognized response format', async () => {
      // Arrange
      const invalidResponse = { invalid: 'format' };

      // Act & Assert
      try {
        await service['normalizeIAResponse'](invalidResponse, 123);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('Respuesta de IA inválida o malformada');
      }
    });
  });
});
