// Server-only adapter. Never import this module from components or client services.
export class GatewayError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function target(service: 'backend' | 'visual') {
  const value = service === 'backend' ? process.env.ASSET_FINDER_API_TARGET || 'http://127.0.0.1:8000' : process.env.ASSET_FINDER_AI_TARGET || 'http://127.0.0.1:8765';
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new GatewayError(503, 'La dirección del servicio no es válida.');
  return url.href.replace(/\/$/, '');
}
export async function boundedBody(stream: ReadableStream<Uint8Array> | null, limit: number) {
  if (!stream) throw new GatewayError(422, 'La solicitud está vacía.');
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) { await reader.cancel(); throw new GatewayError(413, 'La imagen o solicitud supera el límite permitido.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const data = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; }
  return data;
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) throw new GatewayError(403, 'Origen no permitido.');
}
export async function upstream(service: 'backend' | 'visual', path: string, init?: RequestInit, timeout = 30000) {
  try {
    return await fetch(target(service) + path, { ...init, redirect: 'error', signal: AbortSignal.timeout(timeout) });
  } catch (error) {
    if (error instanceof GatewayError) throw error;
    throw new GatewayError(503, service === 'backend' ? 'No se pudo conectar con el backend. Revisa que esté encendido.' : 'La comparación visual no está disponible. Revisa el servicio de IA.');
  }
}
export function relay(response: Response) {
  return new Response(response.body, { status: response.status, headers: { 'Content-Type': response.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
export function failure(error: unknown) {
  return Response.json({ detail: error instanceof GatewayError ? error.message : 'No se pudo completar la solicitud.' }, { status: error instanceof GatewayError ? error.status : 500, headers: { 'Cache-Control': 'no-store' } });
}
