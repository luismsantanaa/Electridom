import { SelectQueryBuilder } from 'typeorm';
import { BaseSpecification } from '../../../common/specifications/base.specification';
import { TipoAmbiente } from '../entities/tipo-ambiente.entity';

export class NombreSpecification extends BaseSpecification<TipoAmbiente> {
  constructor(private readonly nombre: string) {
    super();
  }

  isSatisfiedBy(entity: TipoAmbiente): boolean {
    return entity.nombre.toLowerCase().includes(this.nombre.toLowerCase());
  }

  toQueryBuilder(
    queryBuilder: SelectQueryBuilder<TipoAmbiente>,
  ): SelectQueryBuilder<TipoAmbiente> {
    return queryBuilder.andWhere(
      'LOWER(tipoAmbiente.nombre) LIKE LOWER(:nombre)',
      {
        nombre: `%${this.nombre}%`,
      },
    );
  }
}
