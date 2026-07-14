export class ResultDto<T> {
  success: boolean;
  message: string;
  data: T;
  total: number;

  constructor(success: boolean, message: string, data: T, total: number = 0) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.total = total;
  }

  static success<T>(
    data: T,
    message: string = 'Operación exitosa',
    total: number = 0,
  ): ResultDto<T> {
    return new ResultDto<T>(true, message, data, total);
  }

  static error<T>(message: string, data: T | null = null): ResultDto<T | null> {
    return new ResultDto<T | null>(false, message, data, 0);
  }
}
