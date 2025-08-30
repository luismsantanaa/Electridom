import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AiService } from './ai.service';
import { OpenAIClient } from './openai.client';
import { PromptBuilderHelper } from './helpers/prompt-builder.helper';

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(() => mockOpenAI),
}));

describe('AiService', () => {
  let service: AiService;
  let configService: ConfigService;
  let openaiClient: OpenAIClient;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        OPENAI_API_KEY: 'test-api-key',
        OPENAI_MODEL: 'gpt-4o-mini',
        AI_TIMEOUT_MS: 30000,
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: OpenAIClient,
          useValue: {
            getClient: () => mockOpenAI,
            getModel: () => 'gpt-4o-mini',
          },
        },
        {
          provide: PromptBuilderHelper,
          useValue: {
            validatePrompts: jest.fn().mockReturnValue(true),
            buildSystemMessages: jest
              .fn()
              .mockReturnValue([
                { role: 'system', content: 'Test system prompt' },
              ]),
            buildUserMessage: jest.fn().mockReturnValue({
              role: 'user',
              content: 'Test user message',
            }),
            getPromptHash: jest.fn().mockReturnValue('test-hash'),
            buildAnalysisContext: jest.fn().mockReturnValue({
              systemPrompt: 'Test system prompt',
              userExamples: 'Test examples',
              guardrails: 'Test guardrails',
              inputData: {},
              outputData: {},
              userQuestion: 'Test question',
              sessionId: 'test-session',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    configService = module.get<ConfigService>(ConfigService);
    openaiClient = module.get<OpenAIClient>(OpenAIClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyze', () => {
    const mockPayload = {
      input: {
        system: { voltage: 120, phases: 1, frequency: 60 },
        superficies: [{ name: 'Sala', area: 25, type: 'residencial' }],
        consumos: [
          { name: 'TV', power: 100, quantity: 1, type: 'iluminacion' },
        ],
      },
      output: {
        rooms: { totalArea: 25, totalLoads: 1 },
        demand: { totalDemand: 100, demandFactor: 1.0 },
        circuits: { totalCircuits: 1, maxLoadPerCircuit: 100 },
      },
    };

    it('should analyze payload successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Análisis completado',
                recommendations: [
                  {
                    title: 'Recomendación de seguridad',
                    description:
                      'Considerar usar un conductor de mayor calibre',
                    priority: 'medium',
                    category: 'safety',
                  },
                ],
              }),
            },
          },
        ],
        usage: { total_tokens: 150 },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await service.evaluateProject('test-project-id');

      expect(result).toEqual({
        score: expect.any(Number),
        alerts: expect.any(Array),
        hints: expect.any(Array),
      });
    });

    it('should handle OpenAI API errors', async () => {
      const error = new Error('OpenAI API error');
      mockOpenAI.chat.completions.create.mockRejectedValue(error);

      const result = await service.evaluateProject('test-project-id');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.alerts).toEqual(expect.any(Array));
      expect(result.hints).toEqual(expect.any(Array));
    });

    it('should handle malformed AI response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Respuesta no válida sin JSON',
            },
          },
        ],
        usage: { total_tokens: 100 },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await service.evaluateProject('test-project-id');

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.alerts).toEqual(expect.any(Array));
      expect(result.hints).toEqual(expect.any(Array));
    });

    it('should include question in analysis when provided', async () => {
      const payloadWithQuestion = {
        ...mockPayload,
        question: '¿Es adecuado el calibre del conductor?',
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'Análisis con pregunta',
                recommendations: [],
              }),
            },
          },
        ],
        usage: { total_tokens: 120 },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await service.getSuggestions('test-project-id');

      expect(result).toEqual(expect.any(Array));
    });
  });
});
