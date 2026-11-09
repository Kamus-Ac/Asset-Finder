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

Política de análisis: `graphify-out/` puede versionarse en `feature/ai-exploracion`,
con commits separados. Antes de un PR a `main`, preparar una rama sin esos cambios
y comprobar el diff, según la regla 6 de `TASKS.md`.

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

La IA correrá en **Ubuntu/WSL2 de la MSI de Angel**. Diagnóstico real recibido:
Ubuntu 26.04.1, x86_64, glibc 2.43, Python 3.14.4, RAM visible 7.61 GiB;
NVIDIA-SMI detecta RTX 4070 Laptop, driver 610.78 y 8188 MiB VRAM.
[Evidencia MSI](Pruebas/Diagnostico_MSI_Angel_2026-11-09.json) y
[mediciones](MEDICIONES.md). T01 completa; PyTorch CUDA aún no está validado.

**Actualización del 6 de noviembre:** Brandon confirma que Angel aún no tiene
WSL/Ubuntu instalado y pide dejar esa parte pendiente. El comando de diagnóstico
de abajo se ejecutará cuando ese sistema esté listo; no hay que ejecutarlo ahora
en Windows para acreditar Linux. La prueba CPU local sigue disponible.

El entorno CUDA de ese servidor se preparará por separado mediante T02–T05;
esta reinstalación CPU no cierra esas tareas. SAM 3D sigue como
**servicio no disponible**.

**Actualización del 9 de noviembre:** Brandon informa que la laptop de Angel
ya está preparada y comparte finalmente el diagnóstico de la MSI correcta.
NVIDIA visible en WSL; siguiente tarea T03: comprobar Python 3.12 y entorno GPU.

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

## Instalar y comprobar T03 en la MSI

El usuario ya creó `.venv-gpu` **en la raíz** con uv/Python 3.12.16 y confirmó
`ai/sam2/`. Se usa esa ubicación, separada de los entornos CPU/pruebas.
Copiar [preparar_gpu.sh](preparar_gpu.sh) dentro de `ai/` de la MSI y ejecutar,
desde `~/projects/Asset-Finder` en Ubuntu:

```bash
bash ai/preparar_gpu.sh .venv-gpu
```

No requiere la rama actual si se copia el script. Primero verifica entorno
vacío o con la base común revisada en sus versiones exactas, RTX 4070 y SAM en la
revisión fijada, sin cambios locales. Si algo difiere, se detiene para revisarlo.
No mueve carpetas, recrea entornos ni descarga pesos. Instala las versiones
ya aprobadas y prueba una suma real en CUDA, sin cargar SAM/DINO todavía.

Si termina: compartir el JSON final (`/tmp/asset-finder-T03-MSI.json`) y
`ai/requirements-gpu.txt`. Si falla: compartir el error antes de repetir;
una instalación parcial necesita revisar los paquetes existentes. T03 permanece
pendiente hasta recibir y validar esa evidencia. Detalles en `PROPUESTA_ENTORNO.md`.

El inventario recibido de la MSI ya contiene 14 paquetes comunes, sin torch.
Se permite continuar con esas versiones exactas; paquetes distintos o versiones
incompatibles siguen deteniendo el script. Reemplazar en la MSI el instalador
por esta versión antes de reintentar. Desde cualquier carpeta:

```bash
cd ~/projects/Asset-Finder && bash ai/preparar_gpu.sh .venv-gpu
```

Las rutas de consultas manuales son relativas: desde `ai/`, el intérprete está
en `../.venv-gpu/bin/python`. No crear otro entorno por ese error de ruta.

### Historial T01: pruebas iniciales en otra laptop (Dell)

**Evidencia histórica de otro equipo:** [modelo](Pruebas/Equipo_Dell_2026-11-09.txt):
Dell Latitude 3410 e Intel UHD presente, OK. No coincide con la MSI/RTX 4070
comunicada inicialmente. La consulta PnP de errores no devolvió coincidencias;
su mensaje no demuestra una avería ni la presencia/ausencia física de una RTX.
Brandon confirmó después el error: se mantiene la MSI/RTX 4070 como servidor.
Ejecutar el recolector o las comprobaciones siguientes allí; los resultados de
la Dell, incluido Python 3.14.4, no validan el estado de la MSI.

Bloque para pegar **solo en PowerShell de la MSI**; no requiere el repositorio:

```powershell
Get-CimInstance Win32_ComputerSystem | Format-List Manufacturer, Model
nvidia-smi
wsl -l -v
wsl -d Ubuntu -- cat /etc/os-release
wsl -d Ubuntu -- uname -m
wsl -d Ubuntu -- getconf GNU_LIBC_VERSION
wsl -d Ubuntu -- /usr/lib/wsl/lib/nvidia-smi
wsl -d Ubuntu -- python3 --version
wsl -d Ubuntu -- python3.12 --version
wsl -d Ubuntu -- free -h
```

Pegar toda la salida, incluidos errores. No instala ni cambia configuración.
Si Ubuntu tiene otro nombre en `wsl -l -v`, revisar ese nombre antes de repetir
las líneas `wsl -d Ubuntu`; un fallo de selección de distribución no prueba su GPU.

Evidencia: [JSON recibido](Pruebas/Diagnostico_Angel_2026-11-09.json). Python del
sistema: 3.14.4; RAM visible para WSL: 7.64 GiB. `/dev/dxg` existe, pero el
script no encuentra `nvidia-smi` en PATH ni como ejecutable en la ruta estándar
WSL. No se concluye que la GPU física falte ni que CUDA haya sido probada.

Primeras comprobaciones, **todas desde PowerShell de Windows**. `wsl -d Ubuntu --`
ejecuta las líneas indicadas dentro de Ubuntu sin cambiar de terminal:

```powershell
nvidia-smi
wsl --version
wsl -l -v
wsl -d Ubuntu -- ls -l /dev/dxg /usr/lib/wsl/lib/nvidia-smi /usr/lib/wsl/lib/libcuda.so.1
wsl -d Ubuntu -- python3.12 --version
```

Compartir errores tal como aparezcan. El último comando solo comprueba si ya
existe el intérprete aprobado; no reemplaza Python 3.14. Según la
[guía oficial NVIDIA para WSL](https://docs.nvidia.com/cuda/wsl-user-guide/index.html),
WSL usa el driver NVIDIA de Windows; no instalar un driver de pantalla NVIDIA
Linux para intentar resolver este diagnóstico. La causa sigue sin determinar.

**Resultado recibido:** Windows solo enumera Intel UHD; los dos archivos NVIDIA
no existen en WSL y `python3.12` no se encuentra. Esto no prueba que no haya
una RTX física. Identificar equipo y dispositivos actuales en PowerShell:

```powershell
Get-CimInstance Win32_ComputerSystem | Format-List Manufacturer, Model
Get-PnpDevice -PresentOnly -Class Display | Format-Table Status, FriendlyName -AutoSize
Get-PnpDevice -PresentOnly -Status ERROR,DEGRADED,UNKNOWN | Format-Table Status, Class, FriendlyName -AutoSize
```

Los comandos solo consultan datos ([Get-PnpDevice, Microsoft](https://learn.microsoft.com/en-us/powershell/module/pnpdevice/get-pnpdevice)).
La hipótesis anterior sobre modos gráficos de MSI no aplica a la Dell identificada.
No instalar MSI Center ni cambiar firmware para intentar resolver esta diferencia
de equipos. Los archivos previos conservan la atribución recibida; no prueban
el entorno de la MSI prevista.

## Servicio Python para P3 (T09)

Importar `segment`, `mask_to_png`, `embed`, `search` y `ServiceUnavailableError`
desde `ai.service`. SAM devuelve máscara NumPy bool y score; `mask_to_png`
la convierte a bytes PNG L sin guardar archivos. `embed` y `search` lanzan
«servicio no disponible» hasta sus tareas. Importar no carga modelos ni requiere
PyTorch; ejecutar segmentación sí necesita el entorno CPU documentado.

Tipos, ejemplo ejecutable, errores y responsabilidades:
[INTERFAZ_P3.md](INTERFAZ_P3.md). Propuesta pendiente de confirmación de Manuel;
no acredita integración HTTP. Prueba solo de IA:

```bash
ai/.venv-tests/bin/python -m pytest ai/tests/test_service.py -q
```

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

## Investigación SAM 3D (T10)

[NOTAS_SAM3D.md](NOTAS_SAM3D.md) registra requisitos oficiales, licencia,
hardware y alternativas. La configuración oficial pide 32 GB VRAM, por encima
de los 8 GB documentados: **servicio no disponible** para generación 3D.
No se instaló ni ejecutó SAM 3D. Esto no bloquea las pruebas SAM 2 CPU.
