import { BaseSpecification } from '../../../common/specifications/base.specification';
import { Environment } from '../entities/environment.entity';
import { SelectQueryBuilder } from 'typeorm';

export class ActivoSpecification extends BaseSpecification<Environment> {
  constructor(private readonly activo: boolean = true) {
    super();
  }

  isSatisfiedBy(entity: Environment): boolean {
    return entity.active === this.activo;
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<Environment>,
  ): SelectQueryBuilder<Environment> {
    return queryBuilder.andWhere('environment.active = :active', {
      active: this.activo,
    });
  }
}
