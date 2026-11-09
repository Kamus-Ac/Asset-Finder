Asset Finder
Plataforma web y móvil para encontrar modelos 3D en distintas páginas a partir de una referencia visual y colocarlos, cuando su archivo esté disponible, en una escena web.
Flujo objetivo
Foto o archivo → selección del objeto → máscara SAM → obtención de candidatos externos → comparación visual DINO → resultados con enlaces a su origen → elección y escena web.

La app captura fotos/video; la web recibe archivos. El video se resolverá inicialmente mediante un fotograma si el plazo lo permite. La reconstrucción con SAM 3D Objects es un objetivo condicionado a pruebas de hardware, no una función operativa confirmada.
Estado
- SAM 2.1 Tiny probado en CPU con una silla.
- Backend con /health y búsqueda textual de candidatos en Sketchfab, confirmada por Manuel.
- Conector subido a feature/backend, commit 0d299da; comprobar si ya está integrado en main.
- Frontend del ZIP revisado: plantilla React/Vite.
- Móvil, ranking DINO integrado, escena, Tailscale y despliegue GPU: no confirmados.

API para web y app — incremento de referencias de imagen
------------------------------------------------------
Ejecutar desde la raíz con el entorno de backend activo:

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
python -m unittest backend.test_media -v
```

Contrato disponible en `/docs` y `/openapi.json`. También se conserva el arranque
desde `backend/` con `uvicorn main:app`.

| Método y ruta | Comportamiento implementado |
| --- | --- |
| `GET /health` | Salud básica de la API; no acredita disponibilidad de IA. |
| `GET /catalog/search?q=chair` | Candidatos textuales de Sketchfab; sin ranking visual. |
| `POST /media` | Imagen en multipart, campo `file`; devuelve referencia con estado 201. |
| `GET /media/{media_id}` | Recupera la referencia y sus dimensiones. |
| `GET /media/{media_id}/file` | Entrega la imagen PNG normalizada. |

```bash
curl -F 'file=@/ruta/foto.jpg' http://localhost:8000/media
```

Ejemplo de esquema de respuesta (el ID real lo genera el servidor):

```json
{
  "media_id": "b410db28-e90d-4f41-985b-8d866fcda44e",
  "type": "image",
  "width": 1200,
  "height": 900,
  "content_type": "image/png",
  "file_url": "/media/b410db28-e90d-4f41-985b-8d866fcda44e/file"
}
```

Ambos clientes deben mostrar el archivo de `file_url` y usar sus dimensiones
para convertir la selección a píxeles de esa imagen. La orientación EXIF se
aplica antes de calcular dimensiones; se guarda RGB sin metadatos originales.
La URL es relativa a la base de la API, no al origen del frontend.

Se admiten JPEG, PNG y WebP estáticos de hasta 10 MiB y 20 megapíxeles.
Se verifica el contenido, sin confiar en la extensión o MIME enviados.
Errores: 413 para límites, 415 para contenido inválido o no admitido,
422 para campos ausentes o UUID inválido y 404 para referencia desconocida.
Los errores de validación usan el formato `detail` de FastAPI.

Los archivos persisten en `data/media/` (ignorado por Git). Se puede cambiar
con `ASSET_FINDER_MEDIA_DIR`. Esta entrega no incluye usuarios, borrado,
cuotas acumuladas ni limpieza automática: usar únicamente en las pruebas
privadas del equipo. El despliegue web entre orígenes requiere un proxy del
mismo origen o acordar la lista CORS con Ángel.

Secuencia propuesta para los siguientes contratos, pendiente de coordinación
con Brandon, Luis y Ángel antes de integrar sus clientes:

| Ruta propuesta (todavía no implementada) | Dependencia / contrato por cerrar |
| --- | --- |
| `POST /segmentations` | `media_id` y rectángulo `box_xyxy` en píxeles normalizados; interfaz SAM de Brandon. |
| `GET /tasks/{id}` | Persistencia y trabajador; estados `queued`, `running`, `completed`, `failed`. |
| `POST /searches` | Selección segmentada, candidatos externos y ranking DINO real. |
| `GET /assets/{id}` | Detalle del candidato; archivo disponible separado del enlace externo. |
| `/projects` y `PUT /projects/{id}/scene` | Alcance compartido, acceso y persistencia por acordar. |

Video y reconstrucción quedan pendientes. No se crean tareas ficticias ni se
declara que una subida ejecute SAM o DINO.

Exportación de candidatos para Brandon (modo Manuel)
---------------------------------------------------
Desde la raíz, sin arrancar la API:

```bash
backend/.venv/bin/python -m backend.export_candidates --query chair --output data/candidatos.json --check-links 3
backend/.venv/bin/python -m unittest backend.test_export_candidates -v
```

La CLI reutiliza el conector existente. Exporta `query` y `results` con hasta
10 candidatos en el orden de Sketchfab. Conserva `asset_id`, `name`,
`thumbnail_url` y `source_url`; no exporta puntuaciones de similitud.
Omite IDs duplicados y entradas sin nombre o URLs HTTP(S) válidas, informando
el motivo en terminal. El archivo generado está ignorado por Git y es el que
se comparte con Brandon como entrada del ranking.

`--check-links 3` comprueba mediante GET las miniaturas y páginas de los primeros
tres candidatos, siguiendo redirecciones y con timeout de 20 segundos por
solicitud. No descarga las imágenes completas ni prueba su decodificación;
eso corresponde al consumidor del ranking. Salida 0: exportación y muestra
sin errores HTTP; 1: fallo de consulta o exportación; 2: JSON escrito pero
falló algún enlace de muestra. Con `--check-links 0` se omite la comprobación.
Una consulta fallida o sin candidatos válidos no reemplaza una exportación
anterior: revisar siempre la salida del comando para evitar usar datos viejos.

Prueba observada el 9 de noviembre de 2026: `chair` produjo 10 candidatos
reales con IDs únicos. Las tres miniaturas respondieron HTTP 200; las páginas
de origen respondieron 200, 200 y 202. El 202 confirma respuesta HTTP, pero no
garantiza que la página del modelo se haya servido completamente. No se
ejecutó SAM, DINO ni ranking en esta prueba. La consulta real requirió acceso
de red fuera del sandbox. Las tres pruebas locales de exportación pasaron
con datos simulados (filtrado, escritura, respuesta vacía y fallo de fuente).
