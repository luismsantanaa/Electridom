import { BaseSpecification } from '../../../common/specifications/base.specification';
import { loads } from '../entities/loads.entity';
import { SelectQueryBuilder } from 'typeorm';

export class ActivoSpecification extends BaseSpecification<loads> {
  constructor(private readonly activo: boolean = true) {
    super();
  }

  isSatisfiedBy(entity: loads): boolean {
    return entity.active === this.activo;
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<loads>,
  ): SelectQueryBuilder<loads> {
    return queryBuilder.andWhere('load.active = :activo', {
      activo: this.activo,
    });
  }
}

