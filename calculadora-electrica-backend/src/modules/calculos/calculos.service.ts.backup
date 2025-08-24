import { Injectable } from '@nestjs/common';

@Injectable()
export class CalculosService {
  calcularSimultaneidadPorCircuito(
    carga: number,
    coeficienteCarga: number,
    coeficienteSimultaneidad: number,
  ): number {
    const subTotalWatts = carga * coeficienteCarga;
    const subTotalWattsSimultaneidad = subTotalWatts * coeficienteSimultaneidad;

    return subTotalWattsSimultaneidad;
  }
}
