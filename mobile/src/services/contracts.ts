import type { Asset } from '@/types/domain';

export interface RemoteMedia {
  id: string;
  width: number;
  height: number;
  fileUrl: string;
}
export interface VisualSelection {
  media_id: string;
  box?: [number, number, number, number];
  points?: { x: number; y: number; label: 0 | 1 }[];
  candidate_limit: number;
  k: number;
}
export interface VisualResult {
  assets: Asset[];
  mask: string;
  crop: string;
  compared: number;
  available: number;
  seconds: number;
  warnings: string[];
}
