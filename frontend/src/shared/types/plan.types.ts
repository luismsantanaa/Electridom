export interface Point {
  x: number;
  y: number;
}

export interface DetectedSpace {
  id: string;
  name: string;
  space_type: string | null;
  area_m2: number;
  perimeter_m: number;
  vertices: Point[];
  confidence: number;
  classification_method: string;
  is_verified: boolean;
}

export interface PlanUploadResponse {
  plan_id: string;
  storage_key: string;
  original_filename: string;
  file_type: string;
  processing_status: string;
}

export interface ProcessingStatusResponse {
  plan_id: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  celery_task_id?: string;
  error_message?: string | null;
  spaces_detected?: number | null;
}

export interface PlanResultResponse {
  plan_id: string;
  file_type: string;
  processing_status: string;
  spaces: DetectedSpace[];
  statistics: {
    total_spaces: number;
    total_area_m2: number;
    classified_spaces: number;
    unclassified_spaces: number;
    average_confidence: number;
  };
  metadata?: {
    meters_per_pixel?: number | null;
    image_width_px?: number | null;
    image_height_px?: number | null;
  };
}

export interface PlanListItem {
  id: string;
  project_id: string | null;
  file_type: string;
  original_filename: string;
  processing_status: string;
  space_count: number;
  created_at: string;
}

export interface PlanListResponse {
  items: PlanListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface SpaceUpdateRequest {
  name?: string;
  space_type?: string;
  vertices?: Point[];
  is_verified?: boolean;
}

export const SPACE_TYPE_COLORS: Record<string, string> = {
  bedroom: '#4A90D9',
  dormitorio: '#4A90D9',
  bathroom: '#50C878',
  bano: '#50C878',
  baño: '#50C878',
  kitchen: '#FF6B6B',
  cocina: '#FF6B6B',
  living_room: '#FFD93D',
  sala: '#FFD93D',
  dining_room: '#FFD93D',
  comedor: '#FFD93D',
  hallway: '#95E1D3',
  pasillo: '#95E1D3',
  garage: '#A8A8A8',
  garaje: '#A8A8A8',
  office: '#C3AED6',
  oficina: '#C3AED6',
  laundry: '#F38181',
  lavanderia: '#F38181',
  storage: '#AA96DA',
  almacen: '#AA96DA',
  balcony: '#87CEEB',
  balcon: '#87CEEB',
  balcón: '#87CEEB',
  stairs: '#DDA0DD',
  escaleras: '#DDA0DD',
  otro: '#B0B0B0',
  unknown: '#D3D3D3',
};

export const SPACE_TYPE_LABELS: Record<string, string> = {
  bedroom: 'Dormitorio',
  dormitorio: 'Dormitorio',
  bathroom: 'Baño',
  bano: 'Baño',
  baño: 'Baño',
  kitchen: 'Cocina',
  cocina: 'Cocina',
  living_room: 'Sala',
  sala: 'Sala',
  dining_room: 'Comedor',
  comedor: 'Comedor',
  hallway: 'Pasillo',
  pasillo: 'Pasillo',
  garage: 'Garaje',
  garaje: 'Garaje',
  office: 'Oficina',
  oficina: 'Oficina',
  laundry: 'Lavandería',
  lavanderia: 'Lavandería',
  storage: 'Almacén',
  almacen: 'Almacén',
  balcony: 'Balcón',
  balcon: 'Balcón',
  balcón: 'Balcón',
  stairs: 'Escaleras',
  escaleras: 'Escaleras',
  otro: 'Otro',
  unknown: 'Sin clasificar',
};

