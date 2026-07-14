import { SelectQueryBuilder } from 'typeorm';
import { BaseSpecification } from '../../../common/specifications/base.specification';
import { EnvironmentType } from '../entities/environment-type.entity';

export class NombreSpecification extends BaseSpecification<EnvironmentType> {
  constructor(private readonly name: string) {
    super();
  }

  isSatisfiedBy(entity: EnvironmentType): boolean {
    return entity.name.toLowerCase().includes(this.name.toLowerCase());
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<EnvironmentType>,
  ): SelectQueryBuilder<EnvironmentType> {
    return queryBuilder.andWhere(
      'LOWER(environmentType.name) LIKE LOWER(:name)',
      {
        name: `%${this.name}%`,
      },
    );
  }
}
