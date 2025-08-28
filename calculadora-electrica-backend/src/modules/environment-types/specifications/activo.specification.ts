import { SelectQueryBuilder } from 'typeorm';
import { BaseSpecification } from '../../../common/specifications/base.specification';
import { EnvironmentType } from '../entities/environment-type.entity';

export class ActivoSpecification extends BaseSpecification<EnvironmentType> {
  constructor(private readonly activo: boolean = true) {
    super();
  }

  isSatisfiedBy(entity: EnvironmentType): boolean {
    return entity.active === this.activo;
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<EnvironmentType>,
  ): SelectQueryBuilder<EnvironmentType> {
    return queryBuilder.andWhere('environmentType.active = :active', {
      active: this.activo,
    });
  }
}
