import { SelectQueryBuilder } from 'typeorm';
import { BaseSpecification } from '../../../common/specifications/base.specification';
import { InstallationType } from '../entities/installation-type.entity';

export class ActivoSpecification extends BaseSpecification<InstallationType> {
  constructor(private readonly activo: boolean = true) {
    super();
  }

  isSatisfiedBy(entity: InstallationType): boolean {
    return entity.active === this.activo;
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<InstallationType>,
  ): SelectQueryBuilder<InstallationType> {
    return queryBuilder.andWhere('installationType.active = :active', {
      active: this.activo,
    });
  }
}
