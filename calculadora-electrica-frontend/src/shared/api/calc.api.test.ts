import { describe, it, expect, vi } from 'vitest';
import { calcApi } from './calc.api';

// Mock the API client
vi.mock('./client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import apiClient from './client';

const mockPost = vi.mocked(apiClient.post);

describe('calcApi', () => {
  it('should call rooms endpoint with correct data', async () => {
    const mockResponse = { data: { environments: [], totales: {} } };
    mockPost.mockResolvedValueOnce(mockResponse);

    const requestData = {
      surfaces: [{ name: 'Sala', area_m2: 20 }],
      consumptions: [{ name: 'Luz', environment: 'Sala', power_w: 60 }],
    };

    const result = await calcApi.rooms(requestData);

    expect(mockPost).toHaveBeenCalledWith('/calc/rooms/preview', requestData);
    expect(result).toEqual(mockResponse.data);
  });

  it('should call demand endpoint', async () => {
    const mockResponse = { data: { cargas_diversificadas: [], totales_diversificados: {} } };
    mockPost.mockResolvedValueOnce(mockResponse);

    const requestData = {
      cargas_por_categoria: [{ category: 'Iluminación', carga_va: 500 }],
      totales: { carga_total_va: 500, voltage_v: 120, phases: 1 },
    };

    const result = await calcApi.demand(requestData);

    expect(mockPost).toHaveBeenCalledWith('/calc/demand/preview', requestData);
    expect(result).toEqual(mockResponse.data);
  });

  it('should call circuits endpoint', async () => {
    const mockResponse = { data: { circuitos: [], totales: {} } };
    mockPost.mockResolvedValueOnce(mockResponse);

    const requestData = {
      cargas_diversificadas: [{ category: 'Iluminación', carga_diversificada_va: 400 }],
      system: { voltage_v: 120, phases: 1, system_type: 1 },
    };

    const result = await calcApi.circuits(requestData);

    expect(mockPost).toHaveBeenCalledWith('/calc/circuits/preview', requestData);
    expect(result).toEqual(mockResponse.data);
  });

  it('should call feeder endpoint', async () => {
    const mockResponse = { data: { alimentador: {} } };
    mockPost.mockResolvedValueOnce(mockResponse);

    const requestData = {
      circuitos_ramales: [],
      system: { voltage_v: 120, phases: 1, corriente_total_a: 10, carga_total_va: 1200 },
      parameters: { longitud_alimentador_m: 30 },
    };

    const result = await calcApi.feeder(requestData);

    expect(mockPost).toHaveBeenCalledWith('/calc/feeder/preview', requestData);
    expect(result).toEqual(mockResponse.data);
  });

  it('should call grounding endpoint', async () => {
    const mockResponse = { data: { electrodo: {}, conductor: {} } };
    mockPost.mockResolvedValueOnce(mockResponse);

    const requestData = {
      system: { voltage_v: 120, phases: 1, corriente_total_a: 10, carga_total_va: 1200 },
      feeder: { current_a: 10, section_mm2: 5.5, material: 'Cu', length_m: 30 },
      parameters: { main_breaker_amp: 100 },
    };

    const result = await calcApi.grounding(requestData);

    expect(mockPost).toHaveBeenCalledWith('/calc/grounding/preview', requestData);
    expect(result).toEqual(mockResponse.data);
  });
});
