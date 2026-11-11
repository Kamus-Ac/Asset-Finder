import { boundedBody, checkOrigin, failure, GatewayError, relay, upstream } from '@/server/upstream';

export async function GET() {
  try {
    const response = await upstream('visual', '/sample');
    if (!response.ok) return relay(response);
    const data = await response.json();
    if (!Number.isInteger(data.candidate_count) || data.candidate_count < 1) throw new GatewayError(503, 'El servicio visual no tiene candidatos disponibles.');
    return Response.json({ available: data.candidate_count, mode: 'sample' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const bytes = await boundedBody(request.body, 64 * 1024);
    let data;
    try { data = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new GatewayError(422, 'Selección inválida.'); }
    if (!data || typeof data !== 'object' || typeof data.media_id !== 'string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(data.media_id)) throw new GatewayError(422, 'Referencia inválida.');
    if (!Number.isInteger(data.k) || !Number.isInteger(data.candidate_limit) || data.k < 1 || data.k > data.candidate_limit || data.candidate_limit > 1000) throw new GatewayError(422, 'Revisa las cantidades de candidatos y resultados.');
    const referenceResponse = await upstream('backend', '/media/' + data.media_id);
    if (!referenceResponse.ok) return relay(referenceResponse);
    const reference = await referenceResponse.json();
    const { width, height } = reference;
    const valid = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
    const box = data.box;
    const points = data.points;
    if (box !== undefined && (!Array.isArray(box) || box.length !== 4 || !box.every(valid) || box[0] < 0 || box[1] < 0 || box[2] > width || box[3] > height || box[0] >= box[2] || box[1] >= box[3])) throw new GatewayError(422, 'El área debe estar dentro de la imagen.');
    if (points !== undefined && (!Array.isArray(points) || points.length > 100 || !points.every(p => p && valid(p.x) && valid(p.y) && p.x >= 0 && p.y >= 0 && p.x < width && p.y < height && (p.label === 0 || p.label === 1)))) throw new GatewayError(422, 'Los puntos deben estar dentro de la imagen.');
    if (!box && !points?.length) throw new GatewayError(422, 'Selecciona un área o al menos un punto.');
    const imageResponse = await upstream('backend', '/media/' + data.media_id + '/file');
    if (!imageResponse.ok) return relay(imageResponse);
    const image = await boundedBody(imageResponse.body, 10 * 1024 * 1024);
    const response = await upstream('visual', '/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: 'data:image/png;base64,' + encodeBase64(image), box, points, k: data.k, candidate_limit: data.candidate_limit }) }, 180000);
    return relay(response);
  } catch (error) { return failure(error); }
}

function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
