# Entrega IA para Manuel y Ángel

Estado: **10 de noviembre de 2026**. Módulo CPU real; GPU/API/clientes pendientes.

## Manuel: conectar la API existente

Ya están en main `/health`, `/catalog/search`, `/media` y el exportador JSON.
Se conserva ese trabajo. En el código inspeccionado la búsqueda es textual y
`similarity_score` sigue null: no hay llamada visual SAM/DINO en esos endpoints.

Entrada Python propuesta, sin crear un segundo backend:

```python
from ai.service import candidates_from_export, run_search, mask_to_png, ServiceUnavailableError

candidates = candidates_from_export(
    export_json,                  # JSON actual de /catalog/search o del exportador
    imagenes_rgb_por_asset_id,     # descarga/decodificación gestionada por P3
    source="sketchfab",
)

outcome = run_search(
    image_rgb,
    candidates,  # metadatos + imágenes RGB de sus vistas, suministrados por P3
    box_xyxy=[x1, y1, x2, y2],
    points=None,
    k=5,
    device="cpu",  # cambiar a cuda después de la validación MSI
    cache_dir=ruta_cache_controlada_por_el_servidor,
)
results = outcome.results       # lista serializable con enlaces y cosenos
mask_png = mask_to_png(outcome.mask)
report = outcome.report()       # tiempos, errores de vistas, caché y modelo
```

- Coordenadas sobre la imagen RGB recibida, después de EXIF; no redimensionar
  detrás del cliente sin actualizar la selección. `run_search` no cambia sus unidades.
- Confirmar [CANDIDATOS_P3.md](CANDIDATOS_P3.md): el exportador entrega URLs,
  falta conectar su descarga y decodificación. El módulo de inferencia no hace HTTP.
- Ejecutar fuera del event loop, en el trabajador acordado con una tarea GPU
  a la vez. P3 conserva tareas, archivos, acceso, CORS y conectividad.
- `ValueError` para entrada/índice inválidos; `ServiceUnavailableError` para
  recursos/dispositivo/memoria ausentes. Otros errores no se convierten en éxitos.
- La máscara es ndarray bool; persistir el PNG para HTTP. El índice incluye
  identidad de modelo/preprocesado. No serializar arrays directamente como JSON.
- Confirmar disponibilidad de archivo 3D antes de `model_available=True`;
  el enlace externo no basta. El campo interno `model_verified` no sale al cliente.

Aceptaciones pendientes: T09-P (tipos), T21-P/T22-P (API/red/errores), T20
(consultas con IDs relevantes conocidos), T26-P/T27-P (reproducción y revisión).
El ejecutor `ai.evaluate` ya acepta el paquete etiquetado; ver EVALUACION.md.
No hace falta programar otra herramienta para correrlo al recibir las referencias.

## Ángel: pruebas en la MSI

1. Conservar `.venv-gpu` de la raíz y el inventario revisado. No copiar el entorno
   CPU ni ejecutar su requirements sobre GPU.
2. T03: desde la raíz, `bash ai/preparar_gpu.sh .venv-gpu`. Si falla, conservar
   la salida y revisar el estado parcial antes de reintentar. Compartir JSON y lock.
3. Preparar recursos oficiales con `python3 -m ai.resources --sam --demo`;
   si hay código SAM local incompatible, el comando se detiene sin sobrescribir.
4. T04: cargar SAM/DINO e inferir con CUDA real, sincronizar al medir y registrar
   VRAM pico; no sustituirlo por NVIDIA-SMI o por la prueba CPU de Brandon.
5. Ensayar `python -m ai.pipeline --device cuda` con el intérprete explícito de
   `.venv-gpu`, después de T03; mantener separados los resultados CPU/GPU.
6. Con Manuel, integrar selección/resultados en web y validar enlaces/archivos
   accesibles desde clientes. La demo local no sustituye esa integración.

SAM 3D sigue no disponible: la investigación documenta que 8 GB no cumplen su
configuración oficial de 32 GB VRAM. Su activación necesita evaluación separada.
