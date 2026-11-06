import type { Asset, JobStatus, Project } from '@/types/domain';
// Contracts only. No HTTP client, device access or mock fallback in production services.
export interface ImagePoint {
  x: number;
  y: number;
  positive: boolean;
}
export interface ObjectSelection {
  referenceId: string;
  points: ImagePoint[];
  box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
export interface SearchService {
  search(selection: ObjectSelection): Promise<Asset[]>;
}
export interface ReconstructionService {
  getStatus(jobId: string): Promise<JobStatus>;
}
export interface ProjectService {
  list(): Promise<Project[]>;
  saveAsset(projectId: string, assetId: string): Promise<void>;
}
export const connection = { configured: false, baseUrl: null } as const;
