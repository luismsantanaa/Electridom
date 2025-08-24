import { Injectable, Logger } from '@nestjs/common';
import { CalculationDomainService } from './calculation-domain.service';
import { PreviewRequestDto } from '../dtos/preview.request.dto';
import { PreviewResponseDto } from '../dtos/preview.response.dto';

@Injectable()
export class CalculationAppService {
  private readonly logger = new Logger(CalculationAppService.name);

  constructor(
    private readonly calculationDomainService: CalculationDomainService,
  ) {}

  async preview(request: PreviewRequestDto): Promise<PreviewResponseDto> {
    this.logger.log('Iniciando cálculo de preview', {
      ambientes: request.superficies.length,
      consumos: request.consumos.length,
    });

    const warnings: string[] = [];

    try {
      const result = await this.calculationDomainService.calcularPreview(
        request,
        warnings,
      );

      this.logger.log('Cálculo de preview completado', {
        totalConectadaVA: result.totales.totalConectadaVA,
        demandaEstimadaVA: result.totales.demandaEstimadaVA,
        circuitos: result.propuestaCircuitos.length,
        warnings: warnings.length,
      });

      return result;
    } catch (error) {
      this.logger.error('Error en cálculo de preview', error);
      throw error;
    }
  }
}
