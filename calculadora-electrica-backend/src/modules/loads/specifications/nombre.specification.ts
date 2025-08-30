import { BaseSpecification } from '../../../common/specifications/base.specification';
import { Load } from '../entities/load.entity';
import { SelectQueryBuilder } from 'typeorm';

export class NombreSpecification extends BaseSpecification<Load> {
  constructor(private readonly name: string) {
    super();
  }

  isSatisfiedBy(entity: Load): boolean {
    return entity.artifactType.name
      .toLowerCase()
      .includes(this.name.toLowerCase());
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<Load>,
  ): SelectQueryBuilder<Load> {
    return queryBuilder.andWhere('artifactType.name ILIKE :name', {
      name: `%${this.name}%`,
    });
  }
}
