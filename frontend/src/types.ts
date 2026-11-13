export type Box = [number, number, number, number]
export type Source = 'sketchfab' | 'polyhaven'

export interface Result {
  asset_id: string
  name: string | null
  source: Source
  source_url: string
  thumbnail_url: string
  similarity_score: number
  license: string | null
  author?: string | null
}

export interface Comparison {
  results: Result[]
  mask_url: string
  crop_url: string
  warnings: unknown[]
  comparison: { compared: number; available: number }
  timings: { total_seconds: number }
}

export interface Task {
  task_id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  stage: string
  result: Comparison | null
  error: { message: string } | null
}

export interface SavedModel {
  asset_id: string
  name: string
  source: Source
  source_url: string
  thumbnail_url: string
  similarity_score: number
  license: string | null
  author: string
  savedAt: string
  folder: string
}
