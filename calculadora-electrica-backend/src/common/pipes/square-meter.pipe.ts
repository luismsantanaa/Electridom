import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class SquareMeterPipe implements PipeTransform {
  transform(value: number): string {
    // Validar que el valor es un número
    if (isNaN(value)) {
      throw new BadRequestException('El valor debe ser un número');
    }

    const number = Number(value);

    // Validar que el número es no negativo
    if (number < 0) {
      throw new BadRequestException('El número debe ser mayor o igual a cero');
    }

    // Retornar el número con el sufijo m²
    return `${number.toFixed(2)} m²`;
  }
}
