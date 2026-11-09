# IA y catálogo — Brandon / P4

La base de desarrollo es **`/home/user/projects/Asset-Finder`**.
El seguimiento paso a paso está en [PLAN_P4_IA.md](PLAN_P4_IA.md).
El alcance original está en [PLAN_P4.md](../PLAN_P4.md).

## Comparación de las dos carpetas

| Aspecto | `asset-finder` | `Asset-Finder` |
| --- | --- | --- |
| Git principal | Rama master sin commits; archivos preparados en staging | Historial del equipo; base inspeccionada `ffb8dd8` |
| Documentación del equipo | Ausente | AGENTS, PLAN_EQUIPO, PLAN_P4 y contratos |
| Backend propio | Solo entorno virtual encontrado | `main.py` con `/health` y dependencias |
| Prueba propia de IA | No está fuera del repositorio externo SAM | `prueba_sam2.py`, imagen y dependencias |
| Componentes y estilos web | Idénticos a los de la otra carpeta | Idénticos a los de la otra carpeta |
| Herramientas web | Oxlint y lockfile distinto | ESLint y lockfile del equipo |
| Recursos locales SAM | Código, pesos y entorno CPU | Código y pesos copiados localmente durante esta preparación |

Decisión: conservar el código y las herramientas de `Asset-Finder`. El instalador
antiguo `script-intalación2.sh` instala PyTorch CPU, usa la ruta minúscula y ejecuta
`git pull`; no es el instalador para el servidor CUDA. No se ejecutó.
La comparación anterior es histórica. La prueba CPU actual usa un entorno nuevo
en `ai/.venv-sam2`; ya no necesita el código, el intérprete ni los paquetes de la
carpeta antigua. No se copiaron entornos virtuales ni herramientas de otras áreas.

## Qué quedó preparado

- `sam2/`: copia local del proveedor desde `asset-finder/ai/sam2`, sin su `.git`.
  Commit de origen: `2b90b9f5ceec907a1c18123530e92e794ad901a4`.
- `sam2/checkpoints/sam2.1_hiera_tiny.pt`: copia verificada por SHA-256.
  Ambos recursos quedan ignorados por Git, por lo que no viajan al clonar el proyecto.
- `requirements-sam2.txt`: lista CPU histórica; solo se corrigió la ruta editable
  a `./sam2`, que requiere ejecutar una futura instalación desde `ai/`.
  Se reinstalaron las mismas versiones, con autorización de Brandon, en un
  entorno nuevo de Python 3.11.18 dentro de esta carpeta.
- Prueba CPU ejecutada con código, pesos y paquetes de esta carpeta; evidencia y
  límites en [MEDICIONES.md](MEDICIONES.md). El rectángulo fijo selecciona fondo,
  por lo que todavía falta implementar la selección de objeto de E2.

## Repetir la prueba CPU local

Desde la raíz de `Asset-Finder`, usar el intérprete propio en modo aislado evita
heredar `PYTHONPATH` y rutas del directorio de trabajo. No requiere la carpeta
antigua ni tener activado otro entorno:

```bash
ai/.venv-sam2/bin/python -I ai/prueba_sam2.py
```

Genera `mascara.png`, `silla_transparente.png` y `seleccion.png` en `ai/`, ignorados
por Git. El nombre `silla_transparente.png` viene del script histórico y no
garantiza que la máscara corresponda a una silla. Abrir `seleccion.png` permite
revisar lo seleccionado. Se comprobó también la ejecución desde `/tmp`, bloqueando
accesos Python a la ruta antigua y verificando el origen de los módulos importados.

## Entorno de pruebas propio

```bash
ai/.venv-tests/bin/python -m py_compile ai/*.py
ai/.venv-tests/bin/python -m pytest ai/tests -q
```

`requirements-tests.txt` fija sus versiones. Ambos entornos virtuales, el
checkpoint y las salidas permanecen fuera de Git. Los intérpretes base son
instalaciones de Python del sistema/uv, independientes del proyecto antiguo.

## Segmentación reutilizable (T06)

Desde otro módulo del proyecto se puede importar `from ai.segmentation import segment`.
Recibe una imagen RGB PIL o ndarray, caja xyxy en píxeles y puntos `{x, y, label}`;
devuelve `(mask, score)`: máscara booleana H×W y puntuación bruta del modelo.
Usar `device="cpu"` o `device="cuda"`. No guarda archivos ni redimensiona la imagen.
Las entradas inválidas lanzan `ValueError` antes de cargar el predictor (T07):

- Imagen PIL en modo RGB o ndarray `uint8` H×W×3, con ancho/alto positivos.
  No se convierte automáticamente escala de grises, RGBA ni arrays flotantes.
- Caja con cuatro números finitos: `0 <= x1 < x2 <= ancho` y
  `0 <= y1 < y2 <= alto`; no acepta strings, booleanos ni cajas vacías.
- Cada punto contiene `x`, `y`, `label`: coordenadas finitas con
  `0 <= x < ancho`, `0 <= y < alto`; label entero 0/1, excluyendo booleanos.
- Debe haber una caja válida o puntos. Omitir puntos o usar `points=[]` es válido
  junto a una caja; sin caja ni puntos se rechaza como selección vacía.

Las coordenadas se refieren a la imagen recibida, sin cambio de tamaño, unidades
ni corrección automática de orientación EXIF. El llamador prepara su imagen RGB.

El predictor se carga una vez por dispositivo/ruta de pesos durante el proceso;
reiniciar el proceso si se sustituyen los pesos. Se serializa cada selección
porque el predictor conserva estado de imagen. Pesos/CUDA ausentes producen
`ServiceUnavailableError` con el mensaje «servicio no disponible».
`prueba_sam2.py` ya usa esta función; el comando aislado `-I` sigue funcionando
mediante una carga explícita del módulo hermano, sin añadir `ai/` a `sys.path`.
La primera llamada incluye carga del modelo en su tiempo y no es comparable
directamente con las mediciones antiguas que excluían esa carga.

Las pruebas numéricas usan el intérprete de `ai/.venv-sam2` como subproceso,
sin mezclar sus paquetes Python 3.11 con el entorno pytest Python 3.14. Si falta
ese entorno o sus pesos, las pruebas de integración correspondientes se omiten
explícitamente; no descargan ni instalan recursos automáticamente.

## Servidor acordado

La IA correrá en **Ubuntu sobre WSL de la laptop de Angel**. Brandon compartió
driver NVIDIA 610.78, VRAM total detectada de 8188 MiB y Python 3.12.1. La salida
incluye WDDM y procesos Windows; aún falta identificar la distribución Ubuntu y
confirmar Python/memoria dentro del WSL que ejecutará la IA. Evidencia recibida:
[MEDICIONES.md](MEDICIONES.md#datos-del-servidor-de-angel-recibidos).

**Actualización del 6 de noviembre:** Brandon confirma que Angel aún no tiene
WSL/Ubuntu instalado y pide dejar esa parte pendiente. El comando de diagnóstico
de abajo se ejecutará cuando ese sistema esté listo; no hay que ejecutarlo ahora
en Windows para acreditar Linux. La prueba CPU local sigue disponible.

El entorno CUDA de ese servidor se preparará por separado mediante T02–T05;
esta reinstalación CPU no cierra esas tareas. SAM 3D sigue como
**servicio no disponible**.

## Recopilar T01 dentro del WSL de Angel

Desde la raíz del proyecto, sin activar entornos ni instalar paquetes:

```bash
python3 -I ai/diagnostico_servidor.py --output /tmp/asset-finder-diagnostico.json
cat /tmp/asset-finder-diagnostico.json
```

Compartir ese JSON con Brandon. Incluye Ubuntu, kernel, Python, memoria visible,
indicios WSL2 y la salida/errores de NVIDIA-SMI. Busca también el ejecutable WSL
fuera de PATH. Datos ausentes quedan `null`; un informe generado no acredita GPU
operativa. El archivo se guarda fuera del repositorio y no contiene pesos ni imágenes.
La consulta usa el [formato CSV documentado por NVIDIA](https://docs.nvidia.com/deploy/nvidia-smi/index.html).

## Prueba visual T08

```bash
ai/.venv-sam2/bin/python -I ai/prueba_seleccion.py
```

Usa la imagen `prueba.jpeg` a 1024×631 y dos selecciones documentadas dentro del
script: caja alrededor de la silla amarilla y puntos positivos/negativos.
Genera `caja_*`, `puntos_*` y `metrics.json` en `ai/resultados/T08/`, ignorado por
`ai/.gitignore`. Revisar ambos `*_overlay.png` y los recortes; las partes ocultas
no se reconstruyen. Los scores no miden precisión. Si cambia la imagen de
prueba, deben revisarse sus prompts; no son un detector automático de sillas.
