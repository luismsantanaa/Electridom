import { BaseSpecification } from '../../../common/specifications/base.specification';
import { Cargas } from '../entities/cargas.entity';
import { SelectQueryBuilder } from 'typeorm';

export class ActivoSpecification extends BaseSpecification<Cargas> {
  constructor(private readonly activo: boolean = true) {
    super();
  }

  isSatisfiedBy(entity: Cargas): boolean {
    return entity.active === this.activo;
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<Cargas>,
  ): SelectQueryBuilder<Cargas> {
    return queryBuilder.andWhere('carga.active = :activo', {
      activo: this.activo,
    });
  }
}
