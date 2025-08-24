import { BaseSpecification } from '../../../common/specifications/base.specification';
import { environment } from '../entities/environment.entity';
import { SelectQueryBuilder } from 'typeorm';

export class ActivoSpecification extends BaseSpecification<environment> {
  constructor(private readonly activo: boolean = true) {
    super();
  }

  isSatisfiedBy(entity: environment): boolean {
    return entity.active === this.activo;
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<environment>,
  ): SelectQueryBuilder<environment> {
    return queryBuilder.andWhere('environment.activo = :activo', {
      activo: this.activo,
    });
  }
}

