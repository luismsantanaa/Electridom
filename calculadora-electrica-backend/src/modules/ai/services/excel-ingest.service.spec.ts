import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ExcelIngestService } from './excel-ingest.service';
import * as fs from 'fs';

// Mock XLSX
jest.mock('xlsx', () => ({
  readFile: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
  },
}));

describe('ExcelIngestService', () => {
  let service: ExcelIngestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelIngestService],
    }).compile();

    service = module.get<ExcelIngestService>(ExcelIngestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processExcelFile', () => {
    const mockFilePath = './test-file.xlsx';

    it('should handle file read errors', async () => {
      const mockXLSX = require('xlsx');
      mockXLSX.readFile.mockImplementation(() => {
        throw new Error('File not found');
      });

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

      const result = await service.processExcelFile(mockFilePath);

      expect(result.success).toBe(false);
      expect(result.message).toContain(
        'Error procesando archivo: File not found',
      );
    });

    it('should clean up temp file on error', async () => {
      const mockXLSX = require('xlsx');
      mockXLSX.readFile.mockImplementation(() => {
        throw new Error('File not found');
      });

      const unlinkSpy = jest
        .spyOn(fs, 'unlinkSync')
        .mockImplementation(() => {});
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      await service.processExcelFile(mockFilePath);

      expect(unlinkSpy).toHaveBeenCalledWith(mockFilePath);
    });
  });
});
