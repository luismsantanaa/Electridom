export enum NormativeSource {
  RIE = 'RIE',
  NEC = 'NEC',
  REBT = 'REBT'
}

export interface Normative {
  id: string;
  code: string;
  description: string;
  source: NormativeSource;
  lastUpdated: string;
  content: string;
}

export interface NormativeListResponse {
  data: Normative[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NormativeListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  source?: NormativeSource;
}
