import { BaseSpecification } from '../../../common/specifications/base.specification';
import { Cargas } from '../entities/cargas.entity';
import { SelectQueryBuilder } from 'typeorm';

export class NombreSpecification extends BaseSpecification<Cargas> {
  constructor(private readonly nombre: string) {
    super();
  }

  isSatisfiedBy(entity: Cargas): boolean {
    return entity.tipoArtefacto.nombre
      .toLowerCase()
      .includes(this.nombre.toLowerCase());
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<Cargas>,
  ): SelectQueryBuilder<Cargas> {
    return queryBuilder.andWhere('tipoArtefacto.nombre ILIKE :nombre', {
      nombre: `%${this.nombre}%`,
    });
  }
}
