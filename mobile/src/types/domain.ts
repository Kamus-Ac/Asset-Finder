export type AssetKind = 'chair' | 'table' | 'lamp' | 'sofa' | 'vase' | 'arch';
export interface Asset {
  id: string;
  name: string;
  source: string;
  kind?: AssetKind;
  thumbnailUrl?: string;
  sourceUrl?: string;
  modelUrl?: string;
  format: string;
  available: boolean;
  score: number | null;
  description: string;
  license: string;
}
export interface Project {
  id: string;
  name: string;
  description: string;
  assetIds: string[];
  updated: string;
}
export type JobStatus = 'unavailable' | 'pending' | 'processing' | 'completed' | 'failed';
