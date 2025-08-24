import { SelectQueryBuilder } from 'typeorm';
import { BaseSpecification } from '../../../common/specifications/base.specification';
import { TipoInstalacion } from '../entities/tipo-instalacion.entity';

export class ActivoSpecification extends BaseSpecification<TipoInstalacion> {
  constructor(private readonly activo: boolean = true) {
    super();
  }

  isSatisfiedBy(entity: TipoInstalacion): boolean {
    return entity.active === this.activo;
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<TipoInstalacion>,
  ): SelectQueryBuilder<TipoInstalacion> {
    return queryBuilder.andWhere('tipoInstalacion.activo = :activo', {
      activo: this.activo,
    });
  }
}
