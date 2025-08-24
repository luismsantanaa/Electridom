export interface PaginationMeta {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  sortBy: [string, 'ASC' | 'DESC'][];
  searchBy: string[];
  search: string;
  select: string[];
  filter?: Record<string, any>;
}

export class PaginatedResultDto<T> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  meta: PaginationMeta;

  constructor(
    success: boolean,
    message: string,
    data: T[],
    total: number,
    meta: PaginationMeta,
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.total = total;
    this.meta = meta;
  }

  static success<T>(
    data: T[],
    total: number,
    meta: PaginationMeta,
    message: string = 'Operación exitosa',
  ): PaginatedResultDto<T> {
    return new PaginatedResultDto<T>(true, message, data, total, meta);
  }
}
