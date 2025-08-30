import { Injectable } from '@nestjs/common';

@Injectable()
export class CalculationsService {
  calculateSimultaneityByCircuit(
    load: number,
    loadCoefficient: number,
    simultaneityCoefficient: number,
  ): number {
    const subTotalWatts = load * loadCoefficient;
    const subTotalWattsSimultaneity = subTotalWatts * simultaneityCoefficient;

    return subTotalWattsSimultaneity;
  }
}
