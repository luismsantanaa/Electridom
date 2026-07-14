import { Test, TestingModule } from '@nestjs/testing';
import { CalculationsController } from './calculations.controller';
import { CalculationAppService } from './services/calculation-app.service';

describe('CalculationsController', () => {
  let controller: CalculationsController;

  const mockCalculationAppService = {
    preview: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalculationsController],
      providers: [
        {
          provide: CalculationAppService,
          useValue: mockCalculationAppService,
        },
      ],
    }).compile();

    controller = module.get<CalculationsController>(CalculationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
