import { Test, TestingModule } from '@nestjs/testing';
import { PromptBuilderHelper } from './prompt-builder.helper';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
jest.mock('path');

describe('PromptBuilderHelper', () => {
  let helper: PromptBuilderHelper;
  let mockFs: jest.Mocked<typeof fs>;
  let mockPath: jest.Mocked<typeof path>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptBuilderHelper],
    }).compile();

    helper = module.get<PromptBuilderHelper>(PromptBuilderHelper);
    mockFs = fs as jest.Mocked<typeof fs>;
    mockPath = path as jest.Mocked<typeof path>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(helper).toBeDefined();
  });

  describe('buildSystemMessages', () => {
    it('should build system messages with prompts', () => {
      const mockSystemPrompt = '# Prompt del Sistema\nEres Eléctridom...';
      const mockGuardrails = '# Guardrails\nRestricciones...';

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync
        .mockReturnValueOnce(mockSystemPrompt)
        .mockReturnValueOnce(mockGuardrails);

      const messages = helper.buildSystemMessages();

      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({
        role: 'system',
        content: mockSystemPrompt,
      });
      expect(messages[1]).toEqual({
        role: 'system',
        content: 'Guardrails y Políticas: # Guardrails\nRestricciones...',
      });
    });

    it('should handle missing prompt files', () => {
      mockFs.existsSync.mockReturnValue(false);

      const messages = helper.buildSystemMessages();

      expect(messages).toHaveLength(0);
    });
  });

  describe('buildUserMessage', () => {
    it('should build user message with context', () => {
      const mockUserExamples = '# Ejemplos\nEjemplo 1...';
      const context = {
        systemPrompt: 'system prompt',
        userExamples: 'user examples',
        guardrails: 'guardrails',
        inputData: { test: 'input' },
        outputData: { test: 'output' },
        userQuestion: 'Test question?',
        sessionId: '123',
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockUserExamples);

      const message = helper.buildUserMessage(context);

      expect(message.role).toBe('user');
      expect(message.content).toContain('Test question?');
      expect(message.content).toContain('"test": "input"');
      expect(message.content).toContain('"test": "output"');
      expect(message.content).toContain('Ejemplo 1...');
    });

    it('should build message without question when not provided', () => {
      const context = {
        systemPrompt: 'system prompt',
        userExamples: 'user examples',
        guardrails: 'guardrails',
        inputData: { test: 'input' },
        outputData: { test: 'output' },
        sessionId: '123',
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('');

      const message = helper.buildUserMessage(context);

      expect(message.content).not.toContain('Pregunta Específica');
    });
  });

  describe('validatePrompts', () => {
    it('should return true when all prompts exist', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('prompt content');

      const isValid = helper.validatePrompts();

      expect(isValid).toBe(true);
    });

    it('should return false when prompts are missing', () => {
      mockFs.existsSync.mockReturnValue(false);

      const isValid = helper.validatePrompts();

      expect(isValid).toBe(false);
    });
  });

  describe('getPromptHash', () => {
    it('should generate consistent hash for same prompts', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('test prompt content');

      const hash1 = helper.getPromptHash();
      const hash2 = helper.getPromptHash();

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(8);
    });

    it('should generate different hashes for different prompts', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync
        .mockReturnValueOnce('prompt 1')
        .mockReturnValueOnce('prompt 2')
        .mockReturnValueOnce('prompt 3');

      const hash1 = helper.getPromptHash();

      mockFs.readFileSync
        .mockReturnValueOnce('different prompt 1')
        .mockReturnValueOnce('different prompt 2')
        .mockReturnValueOnce('different prompt 3');

      const hash2 = helper.getPromptHash();

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('buildAnalysisContext', () => {
    it('should build complete analysis context', () => {
      const inputData = { test: 'input' };
      const outputData = { test: 'output' };
      const userQuestion = 'Test question?';

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('prompt content');

      const context = helper.buildAnalysisContext(
        inputData,
        outputData,
        userQuestion,
      );

      expect(context.inputData).toEqual(inputData);
      expect(context.outputData).toEqual(outputData);
      expect(context.userQuestion).toBe(userQuestion);
      expect(context.sessionId).toBeDefined();
      expect(context.sessionId).toHaveLength(16);
    });

    it('should build context without question', () => {
      const inputData = { test: 'input' };
      const outputData = { test: 'output' };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('prompt content');

      const context = helper.buildAnalysisContext(inputData, outputData);

      expect(context.userQuestion).toBeUndefined();
    });
  });
});
