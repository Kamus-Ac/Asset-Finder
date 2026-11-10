# IA visual — Brandon / P4

**10 de noviembre de 2026.** Flujo CPU implementado: selección → SAM → recorte
→ DINOv2 → ranking de candidatos externos. La conexión a la API y CUDA se validan
con Manuel y Ángel; generación SAM 3D sigue no disponible.

## Probar ahora desde la raíz

```bash
ai/.venv-sam2/bin/python -m ai.pipeline
```

Usa la foto incluida, selecciona la silla amarilla y compara con ocho miniaturas
reales de Sketchfab. Abre `ai/resultados/demo/overlay.png`, `crop.png` y
`report.json`: el JSON incluye cinco enlaces y sus cosenos. No hay porcentajes de
acierto ni disponibilidad de GLB inventada. Los candidatos pueden sustituirse con
`--manifest`; la muestra fija solo permite repetir la prueba sin consultar una fuente.

Para otra imagen, indicar selección sobre su versión RGB normalizada a máximo
1024 píxeles de lado (el CLI informa errores si no recibe selección):

```bash
ai/.venv-sam2/bin/python -m ai.pipeline --image /ruta/foto.jpg --box 100 80 400 500
```

También admite `--points '[{"x":250,"y":200,"label":1}]'`, `--k 5`,
`--no-cache`, `--output` y `--device cpu|cuda`. CUDA se rechaza si no está disponible;
no se sustituye silenciosamente por CPU.

## Recursos y dependencias

Si ya tienes los entornos, preparar/verificar recursos explícitamente:

```bash
python3 -m ai.resources --sam --demo
```

Verifica SHA-256 de código, pesos y ocho imágenes de muestra. Obtiene solo lo
que falta, no sobrescribe recursos incompatibles y no instala paquetes.
La inferencia y los tests no descargan nada automáticamente.
Para un clon nuevo: [REPRODUCIR_CPU.md](REPRODUCIR_CPU.md).
Para la MSI: [PROPUESTA_ENTORNO.md](PROPUESTA_ENTORNO.md) y
[preparar_gpu.sh](preparar_gpu.sh), tareas T03–T05 diferidas.

No se necesitan la carpeta antigua, un servidor remoto, Blender ni los paquetes
FastAPI/HTTPX del backend para esta prueba CPU. En el producto, IA corre en servidor.

## Código y responsabilidad

```text
ai/
├── service.py           Entrada Python para Manuel
├── pipeline.py          Flujo completo, CLI y evidencias de selección
├── segmentation.py      SAM 2.1 Tiny, selección y caché de predictor
├── preprocess.py        Máscara, recorte, fondo y proporciones consistentes
├── embedding.py         DINOv2 ViT-S/14 oficial, vectores normalizados de 384
├── candidates.py         Contrato interno y metadatos validados
├── candidate_images.py  Preparación de vistas y errores por imagen
├── index.py             Lotes/caché de vectores y persistencia sin pickle
├── search.py            Coseno y mejor vista por asset
├── results.py           Formato de resultados y disponibilidad real
├── query_cache.py       Caché de selección/modelos; ranking siempre actualizado
├── resources.py         Aprovisionamiento explícito y verificación de hashes
├── input_manifest.py    Imágenes listadas explícitamente, sin explorar carpetas
├── benchmark.py         Carga y tiempos por etapa en CPU
├── tests/               Validaciones e inferencias reales, sin descargas
└── resultados/          Máscaras, reportes y mediciones locales, fuera de Git
```

`sam2/`, `vendor/`, `checkpoints/`, `.venv*`, `cache/`, `demo_data/` y
resultados se mantienen fuera de Git. Manifiestos JSON registran origen/versiones;
licencias desconocidas quedan null. Una miniatura no autoriza ofrecer un GLB.

## Validar y medir

```bash
ai/.venv-tests/bin/python -m py_compile ai/*.py
ai/.venv-tests/bin/python -m pytest ai/tests -q
ai/.venv-sam2/bin/python -m ai.benchmark
```

Entornos separados: CPU Python 3.11.18 y PyTorch 2.15.0+cpu;
pytest Python 3.14.4. Las pruebas numéricas usan subprocesos CPU, sin mezclar ABIs.
Última medición: 3 repeticiones calentadas, mediana 2.89 s para el flujo sin caché
de consulta; repetición cacheada 0.048 s. Ocho candidatos, 2 hilos, carga de modelos
medida aparte. Es CPU local con suite concurrente, no rendimiento GPU garantizado.
Detalles: [MEDICIONES.md](MEDICIONES.md).

## Integración y pendientes

Manuel ya tiene búsqueda textual Sketchfab, `/media` y exportación de candidatos.
El código remoto inspeccionado aún no llama SAM/DINO. El módulo acepta imágenes y
candidatos en memoria; [ENTREGA_EQUIPO.md](ENTREGA_EQUIPO.md) explica su conexión.
[INTERFAZ_P3.md](INTERFAZ_P3.md) y [CANDIDATOS_P3.md](CANDIDATOS_P3.md) siguen
pendientes de aceptación escrita de Manuel.

Faltan consultas etiquetadas para medir relevancia (T20), pruebas CUDA y flujo desde
clientes. [EVALUACION.md](EVALUACION.md) distingue ensayos de funcionamiento de
aciertos medidos. SAM 3D requiere evaluar hardware aparte; no es una conexión final.

Seguimiento: [TASKS.md](TASKS.md), [PLAN_P4_IA.md](PLAN_P4_IA.md) y
[PROGRESS.md](PROGRESS.md). Commit por tarea y push por fase local a
`feature/ai-exploracion`. Graphify permitido solo en esa rama, separado del PR a
main. El último push falló por autenticación HTTPS; identidad configurada no equivale
a credenciales. No subir entornos, pesos, secretos ni resultados grandes/privados.
