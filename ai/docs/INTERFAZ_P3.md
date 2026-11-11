# Propuesta de interfaz Python para Manuel — T09

Fecha: 9 de noviembre de 2026. Brandon autorizó usar criterio al no haber acuerdo.
**Implementada y probada en IA; pendiente de confirmación escrita de Manuel.**
Esta propuesta no cambia el contrato HTTP ni acredita integración con backend.

**Orden actualizado el 10 de noviembre:** la implementación inicial se registra
como T09-L; la aceptación de Manuel queda en T09-P, FASE 5. No bloquea desarrollar
recorte/DINO y ranking en CPU. La tabla siguiente describe lo que existe hoy,
no firmas finales ya acordadas. T14/T18/T19 concretarán la entrada de candidatos
externos (metadatos e imágenes suministrados por P3) y actualizarán esta propuesta
antes de pedir aceptación. IA no descargará URLs ni realizará búsquedas web.

## Decisión de P4

Trabajar con imágenes y máscaras en memoria evita acoplar SAM al almacenamiento
de P3. La máscara interna será NumPy bool; `mask_to_png` permitirá entregarla
como bytes PNG sin rutas locales, base64 ni archivos temporales obligatorios.

Importar desde la raíz del proyecto, usando el entorno CPU documentado:

```python
from PIL import Image
from ai.service import ServiceUnavailableError, segment, mask_to_png

image = Image.open("ai/examples/prueba.jpeg").convert("RGB")
image.thumbnail((1024, 1024))  # Solo esta prueba usa estas coordenadas.
mask, score = segment(image, box_xyxy=[222, 355, 430, 562], device="cpu")
png_bytes = mask_to_png(mask)
```

El ejemplo llama SAM real; necesita pesos y dependencias del README. No se debe
añadir `ai/` a `sys.path`: puede ocultar el paquete instalado `sam2`.

## Firmas y tipos

| Operación | Entrada | Salida actual |
| --- | --- | --- |
| `segment(image, box_xyxy=None, points=None, *, device="cpu", checkpoint=None)` | PIL RGB o ndarray uint8 H×W×3; caja xyxy o puntos | Tupla `(mask, score)`: ndarray bool H×W y float bruto de SAM |
| `mask_to_png(mask)` | ndarray bool H×W, dimensiones positivas | `bytes` PNG, modo L; 0 fondo, 255 objeto, mismo tamaño |
| `embed(image, *, mask=None, device="cpu")` | RGB y máscara opcional bool H×W; preparación T11 incluida | ndarray float32 de 384 componentes, finito y normalizado; DINO real CPU probado |
| `search(vector, k=5, *, index)` | Vector y `CandidateIndex` del lote externo; k entero positivo | Lista ordenada de asset_id/view_id/similarity_score, mejor vista por asset |
| `format_results(ranking, *, index)` | Ranking y mismo índice validado | Campos del borrador HTTP, desconocidos None, sin marcador interno model_verified |

Implementación local actualizada el 10 de noviembre. Construir el lote con
`ai.index.build_index(candidates, device="cpu", cache_dir=...)`; candidatos e
imágenes según [CANDIDATOS_P3.md](CANDIDATOS_P3.md). Pasar el índice explícitamente:
no hay colección global implícita. Los embeddings/cachés contienen la identidad
de modelo, pesos y preparación; índices incompatibles se rechazan.
Omitir el índice en `search` produce «servicio no disponible»; no devuelve stubs.

`service.candidates_from_export(payload, images_by_asset, source=...)` adapta el
JSON actual de `/catalog/search`/exportador a las vistas en memoria, conservando
IDs y metadatos. P3 solo debe suministrar las imágenes decodificadas por asset_id.
`service.run_search(image, candidates, ...)` ejecuta el flujo completo y devuelve
`Outcome`: máscara, recorte, lista serializable de resultados, tiempos y avisos.
`Outcome.report()` no contiene arrays y puede convertirse a JSON; PNG mediante
`mask_to_png`. Preparación de tareas/archivos/HTTP sigue en P3.

Las coordenadas son píxeles de **la imagen recibida por `segment`**. No hay
redimensionado ni corrección EXIF implícitos. P3 debe preparar la orientación
y mantener la correspondencia con la selección del cliente antes de llamar IA.
La caja admite `0 <= x1 < x2 <= ancho`, análogo para y. Cada punto tiene
`{"x": número, "y": número, "label": 0 o 1}`: 1 incluye, 0 excluye; los puntos
deben estar dentro de la imagen. Hace falta caja o al menos un punto.

`device` admite `cpu` o `cuda`; CUDA aún no está validada en el servidor.
`checkpoint` opcional es ruta de pesos controlada por el servidor, nunca una ruta
del cliente. Hay caché y exclusión mutua por predictor dentro de cada proceso;
varios procesos siguen cargando copias propias del modelo.

El score no es porcentaje de acierto. `mask_to_png` también permite máscaras
vacías o completas: solo codifica, no decide si una selección es útil.

## Errores y responsabilidades

- Entrada inválida: `ValueError`, con el campo en el mensaje.
- Pesos, dependencias o CUDA ausentes: `ServiceUnavailableError`, subclase de
  `RuntimeError`, con «servicio no disponible». Embedding y búsqueda usan el mismo tipo.
- Otros fallos de ejecución se propagan; no se convierten en resultados exitosos.
  Todavía no se simuló ni validó agotamiento de memoria GPU.

P3 conserva la propiedad de endpoints, autenticación, persistencia del PNG,
`mask_url`, estados de tarea y traducción de excepciones al contrato HTTP.
No serializar ndarray directamente como JSON ni exponer rutas internas mediante
los mensajes de error. No hay fixtures falsos ni cambios en contratos compartidos.

## Aceptación pendiente

- [ ] Manuel confirma imágenes RGB en memoria y tupla máscara bool/score.
- [ ] Manuel confirma bytes PNG para persistencia y los dos tipos de excepción.

Prueba local: `ai/.venv-tests/bin/python -m pytest ai/tests/test_service.py -q`.
Incluye inferencia SAM CPU real si existen entorno y pesos; no llama al backend.
La prueba conjunta y el adaptador HTTP corresponden a P3/T21, previa coordinación.
