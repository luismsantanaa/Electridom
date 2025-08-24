import { Injectable } from '@nestjs/common';

@Injectable()
export class CalculosService {
  calcularSimultaneidadPorCircuito(
    load: number,
    coeficienteCarga: number,
    coeficienteSimultaneidad: number,
  ): number {
    const subTotalWatts = load * coeficienteCarga;
    const subTotalWattsSimultaneidad = subTotalWatts * coeficienteSimultaneidad;

    return subTotalWattsSimultaneidad;
  }
}

