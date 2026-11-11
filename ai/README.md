# IA visual — Brandon / P4

**11 de noviembre de 2026.** Flujo CPU implementado: selección → SAM → recorte
→ DINOv2 → ranking de candidatos externos. La conexión a la API y CUDA se validan
con Manuel y Ángel; generación SAM 3D sigue no disponible.

## Iniciar la demo

Comandos para Ubuntu/WSL, ejecutados desde la raíz del repositorio. Requieren
`ai/.venv-sam2` con las dependencias CPU y los pesos e imágenes ya preparados.
Si faltan recursos, sigue [preparar recursos](docs/REPRODUCIR_CPU.md).

### Frontend oficial de Ángel

Abre dos terminales. Inicia el servidor IA en la primera y Vite en la segunda:

```bash
# Terminal 1 · raíz del repositorio
ai/.venv-sam2/bin/python -m ai.demo
```

```bash
# Terminal 2 · raíz del repositorio
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Abre **http://127.0.0.1:5173**. Podrás subir una foto, seleccionar el objeto y
elegir cuántos candidatos comparar y cuántos resultados mostrar. Vite envía las
solicitudes al servidor local de IA en el puerto 8765.

### Demo aislada de IA

Desde otra terminal, en la raíz, ejecuta:

```bash
ai/.venv-sam2/bin/python -m ai.demo
```

Abre **http://127.0.0.1:8765**. Puedes subir una foto, dibujar el rectángulo y
comparar. Para detener el servidor, presiona Ctrl+C. Si el puerto 8765 está ocupado,
agrega `--port 8766` y abre http://127.0.0.1:8766. Para usar otro lote de candidatos,
añade `--manifest /ruta/al/manifest.json`.

### Prueba por consola

```bash
ai/.venv-sam2/bin/python -m ai.pipeline
```

Usa la foto incluida, selecciona la silla amarilla y compara con 24 miniaturas
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

Verifica SHA-256 de código, pesos y 24 imágenes de muestra. Obtiene solo lo
que falta, no sobrescribe recursos incompatibles y no instala paquetes.
La inferencia y los tests no descargan nada automáticamente.
Para un clon nuevo: [REPRODUCIR_CPU.md](docs/REPRODUCIR_CPU.md).
Para la MSI: [PROPUESTA_ENTORNO.md](docs/PROPUESTA_ENTORNO.md) y
[preparar_gpu.sh](scripts/preparar_gpu.sh), tareas T03–T05 diferidas.

No se necesitan la carpeta antigua, un servidor remoto, Blender ni los paquetes
FastAPI/HTTPX del backend para esta prueba CPU. En el producto, IA corre en servidor.

## Código y responsabilidad

```text
ai/
├── README.md            Inicio, comandos y mapa de esta carpeta
├── TASKS.md             Checklist vigente
├── PROGRESS.md          Historial de trabajo y validación
├── docs/                Plan, contratos P3, entrega, mediciones y propuestas
├── scripts/             Diagnóstico independiente y preparación GPU
├── examples/            Ejemplos manuales SAM/DINO y foto de referencia
├── manifests/           Origen, versión y hashes de recursos SAM/DINO/demo
├── Pruebas/             Informes recibidos de los equipos
├── demo.py / web/       Servidor de prueba y HTML de la demo aislada
├── service.py           Entrada Python para Manuel
├── pipeline.py          Flujo completo, CLI y evidencias de selección
├── segmentation.py      SAM 2.1 Tiny, selección y caché de predictor
├── preprocess.py        Máscara, recorte, fondo y proporciones consistentes
├── embedding.py         DINOv2 ViT-S/14 oficial, vectores normalizados de 384
├── candidates.py         Contrato interno y metadatos validados
├── candidate_images.py  Preparación de vistas y errores por imagen
├── infrastructure/      Persistencia NPZ común, sin pickle y con escritura atómica
├── index.py             Lotes/caché de vectores y metadatos verificados
├── search.py            Coseno y mejor vista por asset
├── results.py           Formato de resultados y disponibilidad real
├── query_cache.py       Caché de selección/modelos; ranking siempre actualizado
├── resources.py         Aprovisionamiento explícito y verificación de hashes
├── input_manifest.py    Imágenes listadas explícitamente, sin explorar carpetas
├── benchmark.py         Carga y tiempos por etapa en CPU
├── evaluate.py          Evaluación por conteos cuando lleguen consultas etiquetadas
├── requirements-*.txt   Dependencias fijadas; instalación SAM desde ai/
├── tests/               Validaciones e inferencias reales, sin descargas
└── resultados/          Máscaras, reportes y mediciones locales, fuera de Git
```

Los módulos de ejecución permanecen en la raíz para conservar las importaciones
de `ai.service` y los comandos `python -m ai.demo`, `ai.pipeline`, `ai.resources`,
`ai.benchmark` y `ai.evaluate`. Los requirements mantienen su ubicación y versiones
para conservar la ruta editable de SAM. No se necesitan archivos puente duplicados.

Entradas de lectura: [resumen del proyecto](docs/RESUMEN_PROYECTO.md),
[índice documental](docs/README.md), [herramientas](scripts/README.md) y
[ejemplos manuales](examples/README.md). Las rutas antiguas de scripts y de la foto
en anotaciones históricas corresponden a la estructura anterior al 11 de noviembre.

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
Detalles: [MEDICIONES.md](docs/MEDICIONES.md).

## Integración y pendientes

Manuel ya tiene búsqueda textual Sketchfab, `/media` y exportación de candidatos.
El código remoto inspeccionado aún no llama SAM/DINO. El módulo acepta imágenes y
candidatos en memoria; [ENTREGA_EQUIPO.md](docs/ENTREGA_EQUIPO.md) explica su conexión.
[INTERFAZ_P3.md](docs/INTERFAZ_P3.md) y [CANDIDATOS_P3.md](docs/CANDIDATOS_P3.md) siguen
pendientes de aceptación escrita de Manuel.

Faltan consultas etiquetadas para medir relevancia (T20), pruebas CUDA y flujo desde
clientes. [EVALUACION.md](docs/EVALUACION.md) distingue ensayos de funcionamiento de
aciertos medidos. SAM 3D requiere evaluar hardware aparte; no es una conexión final.

Seguimiento: [TASKS.md](TASKS.md), [PLAN_P4_IA.md](docs/PLAN_P4_IA.md) y
[PROGRESS.md](PROGRESS.md). Commit por tarea y push por fase local a
`feature/ai-exploracion`. Graphify permitido solo en esa rama, separado del PR a
main. El último push falló por autenticación HTTPS; identidad configurada no equivale
a credenciales. No subir entornos, pesos, secretos ni resultados grandes/privados.

## Cantidades configurables

`--candidate-limit N` determina cuántos candidatos del lote compara IA; `--k K`
cuántos resultados devuelve. La demo permite elegir ambas cifras. La muestra
se amplió a 24 candidatos reales; el informe distingue solicitado, disponible y
comparado. Cambiar N no multiplica una muestra de datos ni consulta automáticamente
Sketchfab: esa obtención pertenece a la API de Manuel, que aún fija count=10.

## Frontend oficial y organización

Frontend de Ángel: `frontend/`, con VisualSearch y proxy local a ai.demo.
En otra terminal: `cd frontend && npm run dev -- --host 127.0.0.1 --port 5173`;
abrir http://127.0.0.1:5173. Conserva las tarjetas Three.js como ejemplos separados.
NPZ compartido en `ai/infrastructure/arrays.py`; HTML aislado en `ai/web/demo.html`.
Los módulos públicos y comandos principales se conservan. Ver propuesta de revisión
en [PROPUESTA_FRONTEND.md](docs/PROPUESTA_FRONTEND.md); conexión definitiva a FastAPI sigue con Manuel.
