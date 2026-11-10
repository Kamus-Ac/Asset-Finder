# IA y ranking visual — Brandon / P4

**Estado: 10 de noviembre de 2026.** Desarrollamos primero el flujo completo en
CPU local y después validamos CUDA e integración en la MSI de Ángel.

- [TASKS.md](TASKS.md): orden de ejecución, casillas y criterios; **siguiente T11**.
- [PLAN_P4_IA.md](PLAN_P4_IA.md): arquitectura, fases y límites entre áreas.
- [PROGRESS.md](PROGRESS.md): historial de decisiones, pruebas y limitaciones.
- [RESUMEN_PROYECTO.md](RESUMEN_PROYECTO.md): vista breve del proyecto.

El módulo recibe una imagen/selección y candidatos de páginas externas obtenidos
por P3. SAM separa el objeto, DINO permitirá compararlo con imágenes de esos
candidatos y el ranking devolverá enlaces. El catálogo manual y los renders
Blender del plan antiguo no son prerrequisitos del producto.

## Estado comprobado

| Componente | Estado actual |
| --- | --- |
| SAM 2.1 Tiny | Inferencia real CPU con caja y puntos, caché y validación |
| Máscara y PNG | Implementados; propuesta de interfaz pendiente de Manuel |
| Preparación del objeto | T11 pendiente |
| DINO y ranking | T12/T18 pendientes; hoy `embed`/`search` lanzan error explícito |
| Suite local | Último resultado registrado: 35 pruebas y 5 subtests en verde |
| MSI | NVIDIA visible en WSL; Python 3.12.16 creado, CUDA PyTorch sin validar |
| SAM 3D | Investigación terminada; generación no disponible |

## Recursos locales y entornos

Todo el código propio está en `ai/`. No depende de la carpeta antigua `asset-finder`.
El módulo de IA se desplegará en el servidor, aunque ahora se desarrolle en CPU.

```text
ai/
├── segmentation.py        SAM reutilizable, selección y validación
├── service.py             Entrada Python para P3; partes pendientes fallan explícitamente
├── diagnostico_servidor.py Diagnóstico de sistema/GPU sin instalar paquetes
├── preparar_gpu.sh        Instalador revisado para la futura validación en MSI
├── prueba_seleccion.py    Prueba real de caja/puntos sobre la silla
├── tests/                 Validadores, servicio e inferencia CPU local
├── requirements-sam2.txt  Dependencias CPU; no usar como instalador CUDA
├── requirements-tests.txt Dependencias del entorno pytest separado
├── sam2/                  Código proveedor y checkpoint locales, ignorados
├── .venv-sam2/            Python 3.11.18 / PyTorch CPU, ignorado
├── .venv-tests/           Python 3.14.4 / pytest, ignorado
└── resultados/            Evidencia visual local, ignorada
```

El código SAM local procede de `2b90b9f5ceec907a1c18123530e92e794ad901a4`.
El checkpoint está en `sam2/checkpoints/sam2.1_hiera_tiny.pt`; copia y SHA-256
registrados en [MEDICIONES.md](MEDICIONES.md). Código proveedor, pesos y entornos
no viajan al clonar. Su reproducción completa con DINO se cerrará en T26-L.

CPU, GPU y pytest están separados. No mezclar paquetes Python 3.11 y 3.14;
las pruebas que requieren NumPy/SAM usan el intérprete CPU como subproceso.
Si faltan recursos, la omisión de una prueba se informa; no demuestra inferencia.
No se descargan pesos ni se instalan dependencias automáticamente al probar.

## Pruebas disponibles ahora

Desde la raíz de `Asset-Finder`, sin activar otro entorno:

```bash
ai/.venv-tests/bin/python -m py_compile ai/*.py
ai/.venv-tests/bin/python -m pytest ai/tests -q
ai/.venv-sam2/bin/python -I ai/prueba_seleccion.py
```

La prueba visual usa `ai/prueba.jpeg` normalizada a 1024×631 y prompts explícitos
para la silla amarilla. Produce máscaras, recortes, superposiciones y métricas en
`ai/resultados/T08/`. Las imágenes fueron revisadas en T08; los scores no miden
precisión y las partes ocultas no se reconstruyen. Cambiar la imagen requiere
revisar las coordenadas; el script no detecta sillas automáticamente.

`ai/.venv-sam2/bin/python -I ai/prueba_sam2.py` conserva la prueba histórica con
rectángulo fijo que seleccionó fondo. Para revisar selección de objeto, usar T08.
Los comandos evitan añadir `ai/` a `sys.path`, donde podría ocultar el paquete SAM.

## Interfaz Python actual

Importar desde la raíz: `from ai.service import segment, mask_to_png`.
El entorno que ejecute la llamada debe tener las dependencias CPU documentadas.

- `segment(image, box_xyxy=None, points=None, *, device="cpu", checkpoint=None)`
  recibe PIL RGB o ndarray uint8 H×W×3 y devuelve `(mask, score)`:
  ndarray bool H×W y float bruto de SAM.
- `mask_to_png(mask)` devuelve bytes PNG L: fondo 0, objeto 255.
- `embed` y `search` están reservadas y lanzan `ServiceUnavailableError`.
  Sus implementaciones y la entrada de candidatos llegarán en T12/T14–T19.

Coordenadas en píxeles de la imagen recibida, sin redimensionado ni corrección
EXIF implícitos. Caja dentro de `[0, ancho/alto]` y puntos dentro de
`[0, ancho/alto)`, label entero 0/1. Hace falta caja o al menos un punto;
`points=[]` es válido junto a una caja. Los datos inválidos fallan antes de cargar SAM.
El predictor se conserva una vez por dispositivo/ruta y serializa sus selecciones.

Tipos, ejemplo ejecutable y errores: [INTERFAZ_P3.md](INTERFAZ_P3.md).
Manuel conserva endpoints, descarga de imágenes, archivos, tareas y red.
Todavía no hay integración HTTP visual; no confundir importar el módulo con ella.

## Servidor — ejecución diferida hasta FASE 5

MSI de Ángel: Ubuntu 26.04.1/WSL2, RTX 4070 Laptop/8188 MiB, driver 610.78,
RAM visible 7.61 GiB. Sistema Python 3.14.4; el usuario creó aparte Python 3.12.16
con uv en **`.venv-gpu` de la raíz**, no en `ai/`. No crear un segundo entorno.
Evidencia: [diagnóstico MSI](Pruebas/Diagnostico_MSI_Angel_2026-11-09.json).
Los informes Dell y Luis corresponden a otros equipos y se conservan como historial.

Recopilar diagnóstico en Ubuntu/WSL, sin instalar paquetes:

```bash
python3 -I ai/diagnostico_servidor.py --output /tmp/asset-finder-diagnostico.json
cat /tmp/asset-finder-diagnostico.json
```

Al retomar T03, con el script actualizado disponible en la MSI:

```bash
bash ai/preparar_gpu.sh .venv-gpu
```

El instalador encuentra la raíz Git y usa el entorno indicado incluso si se llama
desde `ai/`. Revisa Python, inventario de paquetes, GPU y revisión limpia del
proveedor antes de instalar la combinación aprobada. La última ejecución encontró
14 dependencias comunes sin torch; el script actualizado permite esas versiones.
Si se detiene, conservar el error y revisar el estado antes de reintentar.
No recrear el entorno ni quitar comprobaciones para forzar una instalación.

Solo tras versiones correctas, `pip check` y una operación CUDA real genera
`ai/requirements-gpu.txt` y `/tmp/asset-finder-T03-MSI.json`. Esa evidencia cerrará
T03; cargar y medir SAM/DINO en GPU corresponde a T04. Receta y aprobación:
[PROPUESTA_ENTORNO.md](PROPUESTA_ENTORNO.md). No ejecutar este instalador localmente
para completar tareas CPU.

## Publicación y alcance de SAM 3D

Commit por tarea y push al cerrar cada fase local en `feature/ai-exploracion`.
`graphify-out/` puede subirse a esa rama en commits separados, **nunca a main**;
el PR se prepara en una rama de integración sin esos cambios y se verifica su diff.
No subir pesos, entornos, secretos ni resultados grandes/privados.

[NOTAS_SAM3D.md](NOTAS_SAM3D.md) conserva requisitos y licencia: la configuración
oficial documentada pide 32 GB VRAM frente a unos 8 GB disponibles. Generación:
**servicio no disponible**. No se instaló ni ejecutó SAM 3D y resolverlo requiere
una evaluación aparte; no condiciona completar la búsqueda visual en CPU.
