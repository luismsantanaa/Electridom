import { SelectQueryBuilder } from 'typeorm';
import { BaseSpecification } from '../../../common/specifications/base.specification';
import { TipoAmbiente } from '../entities/type-environment.entity';

export class NombreSpecification extends BaseSpecification<TipoAmbiente> {
  constructor(private readonly name: string) {
    super();
  }

  isSatisfiedBy(entity: TipoAmbiente): boolean {
    return entity.name.toLowerCase().includes(this.name.toLowerCase());
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<TipoAmbiente>,
  ): SelectQueryBuilder<TipoAmbiente> {
    return queryBuilder.andWhere(
      'LOWER(tipoAmbiente.name) LIKE LOWER(:name)',
      {
        name: `%${this.name}%`,
      },
    );
  }
}

