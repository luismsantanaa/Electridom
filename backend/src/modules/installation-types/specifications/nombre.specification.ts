import { SelectQueryBuilder } from 'typeorm';
import { BaseSpecification } from '../../../common/specifications/base.specification';
import { InstallationType } from '../entities/installation-type.entity';

export class NombreSpecification extends BaseSpecification<InstallationType> {
  constructor(private readonly name: string) {
    super();
  }

  isSatisfiedBy(entity: InstallationType): boolean {
    return entity.name.toLowerCase().includes(this.name.toLowerCase());
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<InstallationType>,
  ): SelectQueryBuilder<InstallationType> {
    return queryBuilder.andWhere(
      'LOWER(installationType.name) LIKE LOWER(:name)',
      {
        name: `%${this.name}%`,
      },
    );
  }

  apply(
    query: SelectQueryBuilder<InstallationType>,
  ): SelectQueryBuilder<InstallationType> {
    return query.andWhere('installation_type.name ILIKE :name', {
      name: `%${this.name}%`,
    });
  }
}
