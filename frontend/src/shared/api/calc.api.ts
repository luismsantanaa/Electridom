import apiClient from './client';
import type {
  RoomsRequest,
  RoomsResponse,
  DemandRequest,
  DemandResponse,
  CircuitsRequest,
  CircuitsResponse,
  FeederRequest,
  FeederResponse,
  GroundingRequest,
  GroundingResponse,
} from '../types/calc.types';

export const calcApi = {
  rooms: async (data: RoomsRequest): Promise<RoomsResponse> => {
    const response = await apiClient.post<RoomsResponse>('/calc/rooms/preview', data);
    return response.data;
  },

  demand: async (data: DemandRequest): Promise<DemandResponse> => {
    const response = await apiClient.post<DemandResponse>('/calc/demand/preview', data);
    return response.data;
  },

  circuits: async (data: CircuitsRequest): Promise<CircuitsResponse> => {
    const response = await apiClient.post<CircuitsResponse>('/calc/circuits/preview', data);
    return response.data;
  },

  feeder: async (data: FeederRequest): Promise<FeederResponse> => {
    const response = await apiClient.post<FeederResponse>('/calc/feeder/preview', data);
    return response.data;
  },

  grounding: async (data: GroundingRequest): Promise<GroundingResponse> => {
    const response = await apiClient.post<GroundingResponse>('/calc/grounding/preview', data);
    return response.data;
  },
};
