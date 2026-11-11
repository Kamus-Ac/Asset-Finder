# Contratos de API — Asset Finder (BORRADOR v0)

**Dueño:** P3. **Cambios:** solo por PR a este archivo + actualizar `docs/mocks/` + avisar al grupo.
**Congelamiento:** día 3. Estos endpoints son propuestas; no afirman que existan todavía.
Base URL: variable de entorno (`API_BASE_URL`); acceso por Tailscale. Campos desconocidos = `null`.

## Endpoints
| Operación | Endpoint | Salida |
| --- | --- | --- |
| Salud | `GET /health` | `{"status":"ok"}` (GPU en `/health/gpu`) |
| Subir referencia | `POST /media` (multipart) | `media_id`, tipo, ancho, alto (ya normalizados) |
| Fotogramas (opcional) | `POST /media/{id}/frames` | tarea o lista de cuadros |
| Segmentar | `POST /segmentations` | `task_id` |
| Consultar tarea | `GET /tasks/{id}` | estado, etapa, resultado o error |
| Buscar por selección | `POST /searches` | `task_id` (decisión: siempre tarea, para unificar clientes) |
| Reconstrucción | `POST /generations` | `503` con `{"error":"service_unavailable"}` mientras no esté validada |
| Asset | `GET /assets/{id}` | metadatos y disponibilidad de archivo |
| Proyectos | `GET/POST /projects`, `POST /projects/{id}/choices` | proyectos y elecciones |
| Escena | `GET/PUT /projects/{id}/scene` | versión y composición |

## Selección (coordenadas en la imagen normalizada)
```json
{
  "media_id": "media_example",
  "frame_id": null,
  "image_width": 1200,
  "image_height": 900,
  "box_xyxy": [100, 80, 1000, 850],
  "points": [{"x": 500, "y": 400, "label": 1}]
}
```
`label: 1` incluye, `label: 0` excluye. Validar: rangos, `x1<x2` y `y1<y2`, orientación, y que el archivo pertenezca al proyecto.

## Resultado de búsqueda
```json
{
  "asset_id": "asset_example",
  "name": "Silla de ejemplo",
  "thumbnail_url": "/files/preview_example.png",
  "similarity_score": 0.82,
  "source": "curated_catalog",
  "source_url": null,
  "license": null,
  "model_available": true,
  "model_url": "/files/model_example.glb",
  "format": "glb"
}
```
Ejemplos de contrato, no datos reales. `similarity_score` es un ranking, no un porcentaje de acierto. Si `model_available` es `false`, los clientes no ofrecen arrastre.

## Tarea
```json
{ "task_id": "task_example", "status": "queued|running|completed|failed", "stage": "segmenting", "result": null, "error": null }
```
Progreso porcentual solo si se puede medir; si no, usar `stage`.

## Escena
```json
{
  "version": 1,
  "up_axis": "Y",
  "instances": [
    {"instance_id": "inst_1", "asset_id": "asset_example",
     "position": [0, 0, 0], "rotation_euler_deg": [0, 0, 0], "scale": [1, 1, 1]}
  ]
}
```
Un asset puede tener varias instancias. No asumir medidas físicas reales.

## Mocks
Guardar una respuesta de ejemplo por endpoint en `docs/mocks/<endpoint>.json`. P1/P2 los usan hasta que P3/P4 entreguen lo real.


## Implementación de búsqueda visual — 11 nov 2026

El contrato ejecutable de `/media`, `/catalog/search`, `/segmentations`,
`/searches`, `/tasks` y artefactos PNG se documenta en
[Integración de búsqueda y móvil](docs/INTEGRACION_BUSQUEDA_MOVIL.md) y en
`/docs` de FastAPI. La propuesta anterior para proyectos/assets/escenas sigue
pendiente. `/generations` responde 503. Búsqueda requiere `q` y selección;
retorna una tarea 202 cuyo resultado contiene ranking DINO y avisos por fuente.
