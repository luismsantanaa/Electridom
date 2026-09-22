// Sprint 21: Unifilar Advanced Export API

import apiClient from './client';
import type {
  UnifilarAdvancedExport,
  ValidationResult,
  PhaseBalance,
  PageSize,
  Orientation,
} from '../types/unifilar.types';

const BASE_URL = '/export/unifilar/advanced';

/**
 * Exporta el diagrama unifilar avanzado en formato JSON
 */
export async function getUnifilarAdvanced(
  projectId: number,
  options?: {
    pageSize?: PageSize;
    orientation?: Orientation;
    includeMetadata?: boolean;
    includeSymbols?: boolean;
  }
): Promise<UnifilarAdvancedExport> {
  const params = new URLSearchParams();
  if (options?.pageSize) params.set('pageSize', options.pageSize);
  if (options?.orientation) params.set('orientation', options.orientation);
  if (options?.includeMetadata !== undefined) params.set('includeMetadata', String(options.includeMetadata));
  if (options?.includeSymbols !== undefined) params.set('includeSymbols', String(options.includeSymbols));

  const queryString = params.toString();
  const url = `${BASE_URL}/${projectId}${queryString ? `?${queryString}` : ''}`;

  const { data } = await apiClient.get<UnifilarAdvancedExport>(url);
  return data;
}

/**
 * Descarga el diagrama unifilar avanzado como PDF
 */
export async function downloadUnifilarPDF(
  projectId: number,
  options?: {
    pageSize?: PageSize;
    orientation?: Orientation;
  }
): Promise<Blob> {
  const params = new URLSearchParams();
  params.set('format', 'pdf');
  if (options?.pageSize) params.set('pageSize', options.pageSize);
  if (options?.orientation) params.set('orientation', options.orientation);

  const { data } = await apiClient.get(`${BASE_URL}/${projectId}?${params.toString()}`, {
    responseType: 'blob',
  });

  return data;
}

/**
 * Descarga el diagrama unifilar avanzado como JSON
 */
export async function downloadUnifilarJSON(
  projectId: number
): Promise<Blob> {
  const { data } = await apiClient.get(`${BASE_URL}/${projectId}?format=json`, {
    responseType: 'blob',
  });

  return data;
}

/**
 * Valida el diagrama unifilar avanzado
 */
export async function validateUnifilar(
  projectId: number
): Promise<ValidationResult> {
  const { data } = await apiClient.get<ValidationResult>(`${BASE_URL}/${projectId}/validate`);
  return data;
}

/**
 * Obtiene el balance de fases del proyecto
 */
export async function getPhaseBalance(
  projectId: number
): Promise<PhaseBalance> {
  const { data } = await apiClient.get<PhaseBalance>(`${BASE_URL}/${projectId}/phase-balance`);
  return data;
}

/**
 * Helper para descargar archivo desde Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
