import { boundedBody, checkOrigin, failure, GatewayError, relay, upstream } from '@/server/upstream';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.split('/api/backend')[1];
    if (path === '/health') return relay(await upstream('backend', '/health'));
    if (path === '/catalog/search') {
      const q = url.searchParams.get('q')?.trim() || '';
      if (!q || q.length > 100) throw new GatewayError(422, 'Escribe entre 1 y 100 caracteres.');
      return relay(await upstream('backend', '/catalog/search?q=' + encodeURIComponent(q)));
    }
    if (/^\/media\/[0-9a-f-]{36}(\/file)?$/i.test(path)) return relay(await upstream('backend', path));
    throw new GatewayError(404, 'Ruta no disponible.');
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (new URL(request.url).pathname.split('/api/backend')[1] !== '/media') throw new GatewayError(404, 'Ruta no disponible.');
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.startsWith('multipart/form-data;')) throw new GatewayError(415, 'Selecciona una imagen para enviar.');
    const body = await boundedBody(request.body, 11 * 1024 * 1024);
    return relay(await upstream('backend', '/media', { method: 'POST', headers: { 'Content-Type': contentType }, body: body as BodyInit }, 60000));
  } catch (error) { return failure(error); }
}
