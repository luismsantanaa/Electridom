import { BaseSpecification } from '../../../common/specifications/base.specification';
import { Ambiente } from '../entities/ambiente.entity';
import { SelectQueryBuilder } from 'typeorm';

export class ActivoSpecification extends BaseSpecification<Ambiente> {
  constructor(private readonly activo: boolean = true) {
    super();
  }

  isSatisfiedBy(entity: Ambiente): boolean {
    return entity.active === this.activo;
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<Ambiente>,
  ): SelectQueryBuilder<Ambiente> {
    return queryBuilder.andWhere('ambiente.activo = :activo', {
      activo: this.activo,
    });
  }
}
