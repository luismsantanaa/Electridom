import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class OrdinarNumberPipe implements PipeTransform {
  transform(value: number): string {
    // Validar que el valor es un número
    if (isNaN(value) || !Number.isInteger(Number(value))) {
      throw new BadRequestException('El valor debe ser un número entero');
    }

    const number = Number(value);

    // Validar que el número es positivo
    if (number <= 0) {
      throw new BadRequestException('El número debe ser mayor que cero');
    }

    // Retornar el número con el sufijo ordinal º
    return `${number}º`;
  }
}
