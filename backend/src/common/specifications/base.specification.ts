import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

export interface ISpecification<T extends ObjectLiteral> {
  isSatisfiedBy(entity: T): boolean;
  toQueryBuilder(queryBuilder: SelectQueryBuilder<T>): SelectQueryBuilder<T>;
}

export abstract class BaseSpecification<T extends ObjectLiteral>
  implements ISpecification<T>
{
  abstract isSatisfiedBy(entity: T): boolean;
  abstract toQueryBuilder(
    queryBuilder: SelectQueryBuilder<T>,
  ): SelectQueryBuilder<T>;

  and(other: ISpecification<T>): AndSpecification<T> {
    return new AndSpecification(this, other);
  }

  or(other: ISpecification<T>): OrSpecification<T> {
    return new OrSpecification(this, other);
  }

  not(): NotSpecification<T> {
    return new NotSpecification(this);
  }
}

export class AndSpecification<
  T extends ObjectLiteral,
> extends BaseSpecification<T> {
  constructor(
    private readonly left: ISpecification<T>,
    private readonly right: ISpecification<T>,
  ) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return this.left.isSatisfiedBy(entity) && this.right.isSatisfiedBy(entity);
  }

  toQueryBuilder(queryBuilder: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
    return this.right.toQueryBuilder(this.left.toQueryBuilder(queryBuilder));
  }
}

export class OrSpecification<
  T extends ObjectLiteral,
> extends BaseSpecification<T> {
  constructor(
    private readonly left: ISpecification<T>,
    private readonly right: ISpecification<T>,
  ) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return this.left.isSatisfiedBy(entity) || this.right.isSatisfiedBy(entity);
  }

  toQueryBuilder(queryBuilder: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
    const leftQuery = this.left.toQueryBuilder(queryBuilder);
    return this.right.toQueryBuilder(leftQuery);
  }
}

export class NotSpecification<
  T extends ObjectLiteral,
> extends BaseSpecification<T> {
  constructor(private readonly specification: ISpecification<T>) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return !this.specification.isSatisfiedBy(entity);
  }

  toQueryBuilder(queryBuilder: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
    return queryBuilder.andWhere(
      'NOT EXISTS (' +
        this.specification
          .toQueryBuilder(
            queryBuilder.connection.createQueryBuilder().subQuery(),
          )
          .getQuery() +
        ')',
    );
  }
}
