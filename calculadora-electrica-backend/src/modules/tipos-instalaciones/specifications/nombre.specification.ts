import { SelectQueryBuilder } from 'typeorm';
import { BaseSpecification } from '../../../common/specifications/base.specification';
import { TipoInstalacion } from '../entities/type-installation.entity';

export class NombreSpecification extends BaseSpecification<TipoInstalacion> {
  constructor(private readonly name: string) {
    super();
  }

  isSatisfiedBy(entity: TipoInstalacion): boolean {
    return entity.name.toLowerCase().includes(this.name.toLowerCase());
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<TipoInstalacion>,
  ): SelectQueryBuilder<TipoInstalacion> {
    return queryBuilder.andWhere(
      'LOWER(tipoInstalacion.name) LIKE LOWER(:name)',
      {
        name: `%${this.name}%`,
      },
    );
  }

  apply(
    query: SelectQueryBuilder<TipoInstalacion>,
  ): SelectQueryBuilder<TipoInstalacion> {
    return query.andWhere('tipo_instalacion.name ILIKE :name', {
      name: `%${this.name}%`,
    });
  }
}

