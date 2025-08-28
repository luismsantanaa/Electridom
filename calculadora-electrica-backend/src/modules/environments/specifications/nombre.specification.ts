import { BaseSpecification } from '../../../common/specifications/base.specification';
import { Environment } from '../entities/environment.entity';
import { SelectQueryBuilder } from 'typeorm';

export class NombreSpecification extends BaseSpecification<Environment> {
  constructor(private readonly name: string) {
    super();
  }

  isSatisfiedBy(entity: Environment): boolean {
    return entity.name.toLowerCase().includes(this.name.toLowerCase());
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<Environment>,
  ): SelectQueryBuilder<Environment> {
    return queryBuilder.andWhere('environment.name ILIKE :name', {
      name: `%${this.name}%`,
    });
  }
}

