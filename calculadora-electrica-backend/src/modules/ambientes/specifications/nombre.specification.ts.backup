import { BaseSpecification } from '../../../common/specifications/base.specification';
import { Ambiente } from '../entities/ambiente.entity';
import { SelectQueryBuilder } from 'typeorm';

export class NombreSpecification extends BaseSpecification<Ambiente> {
  constructor(private readonly nombre: string) {
    super();
  }

  isSatisfiedBy(entity: Ambiente): boolean {
    return entity.nombre.toLowerCase().includes(this.nombre.toLowerCase());
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<Ambiente>,
  ): SelectQueryBuilder<Ambiente> {
    return queryBuilder.andWhere('ambiente.nombre ILIKE :nombre', {
      nombre: `%${this.nombre}%`,
    });
  }
}
