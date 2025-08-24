import { SelectQueryBuilder } from 'typeorm';
import { BaseSpecification } from '../../../common/specifications/base.specification';
import { TipoInstalacion } from '../entities/tipo-instalacion.entity';

export class NombreSpecification extends BaseSpecification<TipoInstalacion> {
  constructor(private readonly nombre: string) {
    super();
  }

  isSatisfiedBy(entity: TipoInstalacion): boolean {
    return entity.nombre.toLowerCase().includes(this.nombre.toLowerCase());
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<TipoInstalacion>,
  ): SelectQueryBuilder<TipoInstalacion> {
    return queryBuilder.andWhere(
      'LOWER(tipoInstalacion.nombre) LIKE LOWER(:nombre)',
      {
        nombre: `%${this.nombre}%`,
      },
    );
  }

  apply(
    query: SelectQueryBuilder<TipoInstalacion>,
  ): SelectQueryBuilder<TipoInstalacion> {
    return query.andWhere('tipo_instalacion.nombre ILIKE :nombre', {
      nombre: `%${this.nombre}%`,
    });
  }
}
