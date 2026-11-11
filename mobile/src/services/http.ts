export class ApiError extends Error {
  constructor(message: string, public status = 0) { super(message); }
}
export const gatewayUrl = (process.env.EXPO_PUBLIC_GATEWAY_URL || '').trim().replace(/\/$/, '');
export function endpoint(path: string) {
  if (gatewayUrl && !/^https?:\/\//i.test(gatewayUrl)) throw new ApiError('La dirección del servidor no es válida.');
  return gatewayUrl + path;
}
export function message(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo completar la solicitud.';
}
export async function request(path: string, options: RequestInit = {}, timeout = 30000) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  let expired = false;
  const timer = setTimeout(() => { expired = true; controller.abort(); }, timeout);
  try {
    const response = await fetch(endpoint(path), { ...options, signal: controller.signal });
    let data;
    try { data = await response.json(); } catch { throw new ApiError('El servidor devolvió una respuesta no válida.', response.status); }
    if (!response.ok) {
      const detail = typeof data.detail === 'string' ? data.detail : typeof data.error === 'string' ? data.error : response.status === 413 ? 'La imagen supera el tamaño permitido.' : response.status === 415 ? 'El formato de imagen no está admitido.' : response.status === 422 ? 'Revisa los datos de la solicitud.' : 'El servidor no pudo completar la solicitud.';
      throw new ApiError(detail, response.status);
    }
    return { data: data as unknown, url: response.url };
  } catch (error) {
    if (options.signal?.aborted) throw error;
    if (expired) throw new ApiError('El servidor tardó demasiado. Inténtalo de nuevo.', 504);
    if (error instanceof ApiError) throw error;
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión.');
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}
