import { SelectQueryBuilder } from 'typeorm';
import { BaseSpecification } from '../../../common/specifications/base.specification';
import { TipoAmbiente } from '../entities/tipo-ambiente.entity';

export class ActivoSpecification extends BaseSpecification<TipoAmbiente> {
  constructor(private readonly activo: boolean = true) {
    super();
  }

  isSatisfiedBy(entity: TipoAmbiente): boolean {
    return entity.active === this.activo;
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<TipoAmbiente>,
  ): SelectQueryBuilder<TipoAmbiente> {
    return queryBuilder.andWhere('tipoAmbiente.activo = :activo', {
      activo: this.activo,
    });
  }
}
