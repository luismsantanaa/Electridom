import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CalculationAppService } from './services/calculation-app.service';
import { PreviewRequestDto } from './dtos/preview.request.dto';
import { PreviewResponseDto } from './dtos/preview.response.dto';

@ApiTags('Electrical Calculations')
@Controller('v1/calculations')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CalculationsController {
  constructor(private readonly calculationAppService: CalculationAppService) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate electrical installation preview',
    description:
      'Calculates total connected load, estimated demand and preliminary circuit proposal for a house',
  })
  @ApiBody({
    type: PreviewRequestDto,
    description: 'House surfaces and consumptions data',
    examples: {
      example1: {
        summary: 'Basic example',
        description: 'House with living room and bedroom',
        value: {
          surfaces: [
            { environment: 'Living Room', areaM2: 18.5 },
            { environment: 'Bedroom 1', areaM2: 12.0 },
          ],
          consumptions: [
            { name: 'TV', environment: 'Living Room', watts: 120 },
            { name: 'Lamp', environment: 'Bedroom 1', watts: 60 },
          ],
          options: { voltageV: 120, singlePhase: true },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Successful calculation',
    type: PreviewResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    schema: {
      type: 'object',
      properties: {
        traceId: { type: 'string' },
        message: { type: 'string' },
        errors: { type: 'array', items: { type: 'string' } },
        timestamp: { type: 'string' },
        path: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 422,
    description: 'Validation error',
    schema: {
      type: 'object',
      properties: {
        traceId: { type: 'string' },
        message: { type: 'string' },
        errors: { type: 'array', items: { type: 'string' } },
        timestamp: { type: 'string' },
        path: { type: 'string' },
      },
    },
  })
  async preview(
    @Body() request: PreviewRequestDto,
  ): Promise<PreviewResponseDto> {
    return this.calculationAppService.preview(request);
  }
}
