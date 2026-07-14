import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

interface ApiResponse {
  message: string;
  version: string;
  timestamp: string;
  environment: string;
  features: string[];
}

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API status message', () => {
      const result = appController.getHello();
      const expectedResponse: ApiResponse = {
        message:
          'Calculadora Eléctrica RD - API funcionando correctamente! 🚀⚡',
        version: '1.0.0',
        timestamp: expect.any(String) as unknown as string,
        environment: 'test',
        features: [
          'Gestión de projects eléctricos',
          'Cálculos de potencia y circuits',
          'Selección de conductors',
          'Lista de materiales y costos',
          'Generación de reportes PDF/Excel',
        ],
      };

      expect(JSON.parse(result)).toEqual(expectedResponse);
    });
  });
});
