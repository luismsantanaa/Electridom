import { BaseSpecification } from '../../../common/specifications/base.specification';
import { Load } from '../entities/load.entity';
import { SelectQueryBuilder } from 'typeorm';

export class ActivoSpecification extends BaseSpecification<Load> {
  constructor(private readonly activo: boolean = true) {
    super();
  }

  isSatisfiedBy(entity: Load): boolean {
    return entity.active === this.activo;
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<Load>,
  ): SelectQueryBuilder<Load> {
    return queryBuilder.andWhere('load.active = :active', {
      active: this.activo,
    });
  }
}

