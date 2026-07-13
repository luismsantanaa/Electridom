import { useMutation } from '@tanstack/react-query';
import { calcApi } from '@shared/api/calc.api';
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
} from '@shared/types/calc.types';

export function useRoomsCalc() {
  return useMutation<RoomsResponse, Error, RoomsRequest>({
    mutationFn: calcApi.rooms,
  });
}

export function useDemandCalc() {
  return useMutation<DemandResponse, Error, DemandRequest>({
    mutationFn: calcApi.demand,
  });
}

export function useCircuitsCalc() {
  return useMutation<CircuitsResponse, Error, CircuitsRequest>({
    mutationFn: calcApi.circuits,
  });
}

export function useFeederCalc() {
  return useMutation<FeederResponse, Error, FeederRequest>({
    mutationFn: calcApi.feeder,
  });
}

export function useGroundingCalc() {
  return useMutation<GroundingResponse, Error, GroundingRequest>({
    mutationFn: calcApi.grounding,
  });
}
