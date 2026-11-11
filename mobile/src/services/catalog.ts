import type { Asset } from '@/types/domain';
import type { VisualResult, VisualSelection } from './contracts';
import { ApiError, request } from './http';

export function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
export function httpUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return;
  try { const url = new URL(value); if (['https:', 'http:'].includes(url.protocol) && !url.username && !url.password) return url.href; } catch {}
}
export function parseAssets(value: unknown, previews?: Record<string, unknown>): Asset[] {
  if (!Array.isArray(value)) throw new ApiError('El catálogo devolvió resultados no válidos.', 502);
  const seen = new Set<string>();
  return value.map(item => {
    if (!record(item) || typeof item.asset_id !== 'string' || !item.asset_id.trim()) throw new ApiError('El catálogo devolvió un modelo sin identificador.', 502);
    const modelUrl = item.model_available === true ? httpUrl(item.model_url) : undefined;
    const preview = previews?.[item.asset_id];
    const thumbnailUrl = typeof preview === 'string' && preview.startsWith('data:image/png;base64,') ? preview : httpUrl(item.thumbnail_url);
    return {
      id: item.asset_id,
      name: typeof item.name === 'string' && item.name.trim() ? item.name : 'Modelo sin nombre',
      source: typeof item.source === 'string' ? item.source : 'Fuente externa',
      sourceUrl: httpUrl(item.source_url), thumbnailUrl, modelUrl,
      available: !!modelUrl,
      format: typeof item.format === 'string' ? item.format : modelUrl ? 'Modelo 3D' : 'Enlace externo',
      score: typeof item.similarity_score === 'number' && Number.isFinite(item.similarity_score) && Math.abs(item.similarity_score) <= 1 ? item.similarity_score : null,
      description: 'Consulta los detalles y las condiciones de uso en la página original del modelo.',
      license: typeof item.license === 'string' ? item.license : 'Por confirmar',
    };
  }).filter(asset => { if (seen.has(asset.id)) return false; seen.add(asset.id); return true; });
}
export async function searchCatalog(query: string, signal?: AbortSignal) {
  const q = query.trim();
  if (!q || q.length > 100) throw new ApiError('Escribe entre 1 y 100 caracteres.');
  const { data } = await request('/api/backend/catalog/search?q=' + encodeURIComponent(q), { signal });
  if (!record(data)) throw new ApiError('Respuesta de catálogo no válida.', 502);
  return parseAssets(data.results);
}
export async function checkHealth(signal?: AbortSignal) {
  const { data } = await request('/api/backend/health', { signal }, 15000);
  if (!record(data) || data.status !== 'ok') throw new ApiError('El backend no está listo.', 503);
}
export async function visualCapacity(signal?: AbortSignal) {
  const { data } = await request('/api/visual', { signal }, 15000);
  if (!record(data) || !Number.isInteger(data.available) || (data.available as number) < 1) throw new ApiError('La comparación visual no está disponible.', 503);
  return data.available as number;
}
export async function compareVisual(selection: VisualSelection, signal?: AbortSignal): Promise<VisualResult> {
  const { data } = await request('/api/visual', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(selection), signal }, 190000);
  if (!record(data) || !record(data.comparison) || !record(data.timings) || typeof data.mask !== 'string' || typeof data.crop !== 'string' || !data.mask.startsWith('data:image/png;base64,') || !data.crop.startsWith('data:image/png;base64,') || !Number.isInteger(data.comparison.compared) || !Number.isInteger(data.comparison.available) || typeof data.timings.total_seconds !== 'number' || !Number.isFinite(data.timings.total_seconds)) throw new ApiError('La comparación devolvió una respuesta no válida.', 502);
  return { assets: parseAssets(data.results, record(data.previews) ? data.previews : undefined), mask: data.mask, crop: data.crop, compared: data.comparison.compared as number, available: data.comparison.available as number, seconds: data.timings.total_seconds, warnings: Array.isArray(data.warnings) ? data.warnings.filter((v): v is string => typeof v === 'string') : [] };
}
