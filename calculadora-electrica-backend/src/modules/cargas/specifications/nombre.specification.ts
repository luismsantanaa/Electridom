import { BaseSpecification } from '../../../common/specifications/base.specification';
import { loads } from '../entities/loads.entity';
import { SelectQueryBuilder } from 'typeorm';

export class NombreSpecification extends BaseSpecification<loads> {
  constructor(private readonly name: string) {
    super();
  }

  isSatisfiedBy(entity: loads): boolean {
    return entity.tipoArtefacto.name
      .toLowerCase()
      .includes(this.name.toLowerCase());
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<loads>,
  ): SelectQueryBuilder<loads> {
    return queryBuilder.andWhere('tipoArtefacto.name ILIKE :name', {
      name: `%${this.name}%`,
    });
  }
}

