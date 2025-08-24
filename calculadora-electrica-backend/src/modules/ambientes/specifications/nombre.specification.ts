import { BaseSpecification } from '../../../common/specifications/base.specification';
import { environment } from '../entities/environment.entity';
import { SelectQueryBuilder } from 'typeorm';

export class NombreSpecification extends BaseSpecification<environment> {
  constructor(private readonly name: string) {
    super();
  }

  isSatisfiedBy(entity: environment): boolean {
    return entity.name.toLowerCase().includes(this.name.toLowerCase());
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<environment>,
  ): SelectQueryBuilder<environment> {
    return queryBuilder.andWhere('environment.name ILIKE :name', {
      name: `%${this.name}%`,
    });
  }
}

