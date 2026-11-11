import type { RemoteMedia } from './contracts';
import { ApiError, request } from './http';
import { record } from './catalog';

export async function uploadMedia(body: FormData, signal?: AbortSignal): Promise<RemoteMedia> {
  const { data, url } = await request('/api/backend/media', { method: 'POST', body, signal }, 60000);
  if (!record(data) || typeof data.media_id !== 'string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(data.media_id) || !Number.isInteger(data.width) || !Number.isInteger(data.height) || (data.width as number) < 1 || (data.height as number) < 1 || data.type !== 'image') throw new ApiError('El servidor devolvió una referencia no válida.', 502);
  return { id: data.media_id, width: data.width as number, height: data.height as number, fileUrl: new URL(data.media_id + '/file', url.replace(/\/$/, '') + '/').href };
}
