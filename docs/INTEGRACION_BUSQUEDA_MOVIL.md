# Búsqueda visual externa y entrega para móvil

Implementación en `feature/backend`, 11 de noviembre de 2026.
Revisión de móvil: `origin/feat/mobile-setup`, commit `665b6ea`.

## Arranque del flujo web

Desde la raíz, usando el entorno existente con SAM/DINO y sus pesos preparados:

```bash
uv pip install --python ai/.venv-sam2/bin/python -r backend/requirements-http.txt
ai/.venv-sam2/bin/python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

En otra terminal:

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Abrir http://localhost:5173. La página empieza sin imagen. Subir una foto,
dibujar un rectángulo, escribir una descripción (por ejemplo `wooden chair`),
elegir las fuentes y buscar. No requiere `ai.demo` ni el lote de 24 ejemplos.
DINO no genera la descripción: se usa el texto para recuperar candidatos y
el recorte SAM para ordenarlos por similitud de embeddings DINOv2.

El proxy Vite `/api` apunta a FastAPI en 8000; `ASSET_FINDER_API_TARGET` permite
cambiar el destino. Las rutas Python no llevan `/api`: móvil accede mediante
su gateway Expo `/api/backend`; ver los cambios del adaptador más abajo.
En producción servir `/api` con un proxy equivalente: Vite preview no lo configura.

Para entornos nuevos preparar SAM/DINO siguiendo `ai/REPRODUCIR_CPU.md` antes
de instalar la capa HTTP. `backend/.venv` por sí solo no incluye SAM.
La inferencia no instala dependencias ni descarga pesos automáticamente.

## Fuentes y cantidades

- Sketchfab: API pública `/v3/search`, hasta 24 por página; se recorren cursores,
  se eliminan IDs repetidos y se informa si quedan páginas sin recorrer.
- Poly Haven: API pública `/search?t=models` y `/assets?t=models`, con User-Agent
  `AssetFinder/1.0` y crédito visible en la interfaz. Conserva licencia CC0.
- El motor compara todo el lote recuperado. `candidate_limit: null` no impone
  un máximo de candidatos; `candidate_limit: N` recupera hasta N **por fuente**.
  `max_pages` limita las llamadas a Sketchfab (3 por defecto, rango 1–100).
  Poly Haven no pagina este endpoint. No existe una búsqueda infinita ni garantía
  de exhaustividad de todo el catálogo de cada proveedor.
- `k` determina cuántos resultados del ranking se devuelven. Puede ser mayor que
  los candidatos: se devuelven solamente los existentes, sin duplicar.
- Solo se descargan miniaturas HTTPS de los hosts conocidos de ambos proveedores,
  sin redirecciones; hasta 10 MiB/20 megapíxeles por imagen, seis descargas concurrentes.
  Las vistas se reducen a 512 píxeles. Fallos individuales se informan y se omiten.
- Los scores devueltos son cosenos DINO, no el ranking textual del proveedor,
  ni porcentajes de acierto. Se entrega la mejor vista por asset.
- `model_available` permanece false y `model_url` null: se ofrecen enlaces de
  origen, sin prometer descarga GLB ni permisos que no se han comprobado.

APIs oficiales: https://sketchfab.com/developers/data-api/v3,
https://polyhaven.com/our-api y
https://github.com/Poly-Haven/Public-API/blob/master/swagger.yml.

## Endpoints disponibles para web y móvil

| Endpoint | Estado y respuesta |
| --- | --- |
| `GET /health` | 200, estado del proceso; no carga ni certifica los modelos. |
| `POST /media` | 201, multipart `file`; devuelve UUID, dimensiones orientadas y `file_url`. |
| `GET /media/{media_id}` | Metadatos de la referencia guardada. |
| `GET /media/{media_id}/file` | PNG RGB orientado; usarlo como base de la selección. |
| `GET /catalog/search?q=chair&sources=sketchfab&sources=polyhaven&candidate_limit=30&max_pages=2` | Candidatos externos sin score visual; informes por fuente y avisos. Por defecto 10 por fuente. |
| `POST /segmentations` | 202, tarea SAM sin buscar candidatos; selección según abajo, sin campos de búsqueda. |
| `POST /searches` | 202, tarea completa: búsqueda externa, miniaturas, SAM y ranking DINO. |
| `GET /tasks/{task_id}` | Estado, etapa, resultado o error persistidos. |
| `GET /tasks/{task_id}/files/mask.png` | Máscara PNG de tarea completada. |
| `GET /tasks/{task_id}/files/crop.png` | Recorte PNG de búsqueda completada. |
| `POST /generations` | 503 explícito: generación 3D no disponible. |
| `GET /assets/{id}`, `/projects`, `/scene`, video/fotogramas, autenticación | No implementados. No declarar lista la integración completa de móvil. |

## Contrato de una búsqueda

1. Subir el archivo real por multipart `file` a `/media`.
2. Mostrar `file_url`, usar `width` y `height` devueltos y convertir la selección
   de la vista a píxeles de esa imagen, compensando escala, EXIF y letterboxing.
   Se recomienda reducir la referencia a máximo 1024 píxeles antes de subirla,
   como hace la web. La API guarda el tamaño recibido y no redimensiona a escondidas.
3. Enviar:

```json
{
  "media_id": "UUID_DEVUELTO_POR_MEDIA",
  "image_width": 1024,
  "image_height": 768,
  "box_xyxy": [100, 80, 650, 700],
  "points": [],
  "q": "wooden chair",
  "sources": ["sketchfab", "polyhaven"],
  "candidate_limit": null,
  "max_pages": 3,
  "k": 5
}
```

Caja o al menos un punto obligatorio. Puntos: `{"x": 250, "y": 300, "label": 1}`
(1 incluye, 0 excluye). Se validan dimensiones contra el archivo guardado,
coordenadas, fuentes, cantidades y selección vacía antes de encolar.
`/segmentations` usa solo `media_id`, dimensiones, `box_xyxy` y/o `points`.

Respuesta inicial (202):

```json
{"task_id":"UUID","status":"queued","stage":"queued","result":null,"error":null}
```

Consultar `/tasks/UUID` cada 1–2 s. Estados: `queued`, `running`, `completed`,
`failed`; etapas: `queued`, `discovering`, `downloading`, `comparing`,
`segmenting` (solo SAM), `completed`, `failed`.

Al completar búsqueda, `result` incluye `results`, `mask_url`, `crop_url`,
`comparison`, `timings`, `cache`, `model`, `sources`, `warnings`, `query` y dimensiones.
Cada candidato tiene `asset_id`, `name`, `thumbnail_url`, `source`, `source_url`,
`license`, `model_available`, `model_url`, `format` y `similarity_score`.
Las URLs de resultados PNG son relativas a la API.
`warnings` puede contener textos de fuente/descarga y objetos del módulo IA;
no ocultar un resultado parcial ni inventar candidatos para completarlo.
`comparison` distingue recuperados, seleccionados, comparados y devueltos.
`timings.total_seconds` mide IA, no la espera en cola ni la búsqueda/descarga.

Al fallar, `status` es `failed`, `result` null y `error` contiene `code` y `message`.
La consulta del estado responde 200 aunque la tarea haya fallado. Los errores de
validación de la solicitud usan HTTP 422 y `detail`; referencia desconocida 404,
cola llena 429 con Retry-After. Si fallan todas las fuentes la tarea falla con
código 502; si una funciona, se permite ranking parcial con avisos. Sin candidatos
la tarea falla con 422. Sin imágenes/recursos IA, falla con 503.

## Compatibilidad con feat/mobile-setup (Luis)

Se actualizó la referencia remota antes de esta revisión. El commit `665b6ea`
ya implementa cliente HTTP (`services/http.ts`), subida (`services/media.ts`),
búsqueda textual viva (`services/catalog.ts`), reducción a 1024 px y conversión
`contain` → píxeles (`media/geometry.ts`). No usa ya exclusivamente mocks.

**Compatibles sin cambiar móvil:** `/health`, `/catalog/search` y las tres rutas
`/media`. El adaptador Expo `/api/backend` ya las permite. El parseador de assets
acepta score/licencia/formato ausentes y miniatura/enlace de origen, por lo que
puede recibir los candidatos nuevos de ambas fuentes. Sus colecciones siguen
siendo locales a la sesión; no hay endpoints de proyectos remotos.

**La comparación externa todavía requiere cambiar móvil.** Su ruta servidor
`src/app/api/visual+api.ts` hace GET `/sample` y POST `/run` a `ai.demo` en 8765;
no llama al nuevo backend de tareas. `services/catalog.ts::compareVisual` espera
una respuesta síncrona con máscara/recorte base64. La interfaz limita candidatos
a la capacidad de la muestra y no envía descripción `q`.

Cambios concretos pendientes en el área de Luis:

1. Añadir descripción del objeto, fuentes, páginas y candidato opcional a
   `VisualSelection` y `selection/index.tsx`; retirar la capacidad fija de
   `/api/visual`/`/sample`. Se puede conservar la conversión de coordenadas actual.
2. En el gateway Expo, habilitar explícitamente POST `/searches` y
   `/segmentations`, GET `/tasks/{uuid}` y `/tasks/{uuid}/files/{mask,crop}.png`.
   El adaptador actual rechaza esas rutas. Mantener su validación de origen,
   cuerpos y destinos fijos; no convertirlo en proxy abierto.
3. Al crear tarea, enviar dimensiones de `reference.width/height`, `media_id`,
   `box_xyxy` (el móvil hoy lo llama `box`), puntos, `q`, fuentes y cantidades.
   `candidate_limit` puede ser null; `k` no depende de una capacidad prefijada.
4. Sustituir la respuesta síncrona de `compareVisual` por creación 202 y polling
   de la tarea. Admitir `queued/running/completed/failed`, etapas y errores.
   Cancelar espera no cancela una inferencia ya encolada en Python.
5. Reutilizar `parseAssets(result.results)`; convertir `mask_url/crop_url` a URLs
   del gateway Expo o descargarlas allí si se desea conservar el contrato base64.
   El cliente actual exige prefijo base64, por lo que no basta cambiar el target
   de 8765 a 8000. Mostrar avisos y conteos reales, sin prometer búsqueda exhaustiva.
6. Conservar el gateway: `ASSET_FINDER_API_TARGET` es una dirección **del servidor
   Expo** hacia Python. El teléfono accede al origen Expo/túnel y no a su propio
   localhost. Para despliegue separado configurar `EXPO_PUBLIC_GATEWAY_URL`.

No se modificó `mobile/` ni se fusionó su rama. La búsqueda externa funciona en
la web de esta rama; no se acredita que el móvil ya consuma ese ranking.

## Operación y límites actuales

Un solo proceso Uvicorn y un trabajador IA, con capacidad de ocho tareas
entre cola y ejecución. No usar `--workers` > 1: el registro activo es por proceso.
Los informes/PNG se guardan en `data/jobs`, referencias en `data/media`, embeddings
reutilizables en `data/ai-cache`; no se agregan a Git. Cambiar rutas con
`ASSET_FINDER_JOBS_DIR` y `ASSET_FINDER_MEDIA_DIR`.
`ASSET_FINDER_AI_DEVICE` es `cpu` por defecto; `cuda` requiere recursos disponibles.
`ASSET_FINDER_AI_THREADS` controla hilos CPU (2 por defecto).

Tras reinicio se conservan tareas terminadas; las interrumpidas se marcan fallidas
al consultarlas y deben reenviarse. No hay recuperación automática de la cola,
limpieza de archivos, autenticación ni cuotas por usuario: uso privado del equipo.

## Validación observada

- 15 pruebas unittest: subida/EXIF, contratos de fuentes, paginación con más de
  24 IDs, deduplicación, fuentes caídas, rechazo de URLs de miniaturas ajenas y
  redirecciones, validación de selección, tareas, artefactos y reinicio. Inferencia
  simulada en las pruebas HTTP; no confundirlas con mediciones del modelo.
- Prueba real: consulta `chair`, dos candidatos por fuente, cuatro miniaturas
  descargadas y comparadas con SAM/DINO CPU. Ranking descendente, máscaras y
  recorte recuperados por HTTP. Tiempo IA observado ~13 s (no garantía de latencia).
- Paginación real Sketchfab: 30 candidatos únicos con dos páginas.
- Frontend: TypeScript/build y ESLint correctos. No se ha probado en un teléfono
  físico ni se han medido precisión de ranking o rendimiento con miles de modelos.
