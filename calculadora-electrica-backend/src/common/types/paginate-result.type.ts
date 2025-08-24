import { PaginationMeta } from '../dtos/paginated-result.dto';

export interface PaginateResult<T> {
  data: T[];
  meta: PaginationMeta;
  links: {
    first?: string;
    previous?: string;
    current: string;
    next?: string;
    last?: string;
  };
}
