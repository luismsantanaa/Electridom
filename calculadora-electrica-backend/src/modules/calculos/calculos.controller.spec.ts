import { Test, TestingModule } from '@nestjs/testing';
import { CalculosController } from './calculos.controller';
import { CalculationAppService } from './services/calculation-app.service';

describe('CalculosController', () => {
  let controller: CalculosController;

  const mockCalculationAppService = {
    preview: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalculosController],
      providers: [
        {
          provide: CalculationAppService,
          useValue: mockCalculationAppService,
        },
      ],
    }).compile();

    controller = module.get<CalculosController>(CalculosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
