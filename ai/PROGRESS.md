# PROGRESS.md — Bitácora de P4 (IA y ranking visual)

**Orden vigente desde el 10 de noviembre de 2026:** CPU local primero;
servidor e integración al final. Siguiente tarea: **T18**. Ver
[TASKS.md](TASKS.md) y [PLAN_P4_IA.md](PLAN_P4_IA.md).
Las entradas anteriores conservan el orden y bloqueos que había en cada fecha;
no sustituyen el tablero actual ni se reescriben sus resultados.

Formato de cada entrada: fecha · ID de tarea · comando ejecutado · resultado · limitaciones · commit.

---

## 2026-11-05

- **T00 Base y auditoría CPU (E0)** — completada.
  - Comando: prueba CPU de `ai/prueba_sam2.py` con el entorno antiguo.
  - Resultado: arranque correcto, máscara binaria y canal alfa validados. Evidencia en `ai/MEDICIONES.md`.
  - Limitaciones: el rectángulo fijo seleccionó fondo; CUDA no disponible en este entorno; `git fetch` falla por credenciales (B01).
  - Commit: pendiente de registrar.

## T01 — Diagnóstico del servidor · 2026-11-05

- **Estado:** `queued`, pendiente de completar evidencia de Ubuntu/WSL; pruebas
  locales en verde. T02 documental se preparó después por autorización explícita
  de Brandon; la instalación CUDA T03 no se inició.
- **Servidor confirmado por Brandon:** laptop de Angel, Ubuntu sobre WSL.
  Datos iniciales del equipo: i7-12650H, 16 GB RAM, RTX 4070 Laptop de 8 GB,
  Windows 11 Home 25H2 como anfitrión. Angel compartió NVIDIA-SMI/KMD 610.78,
  8188 MiB de VRAM y Python 3.12.1. Esta sesión NO está en ese equipo.
  Falta identificar la distribución Ubuntu, su RAM visible y confirmar que
  la versión Python reportada corresponde al WSL objetivo.
- **Diagnóstico local:** `nvidia-smi`, `python --version`, `python3 --version`,
  `uname -srm`, `free -b` y `/etc/os-release`. Salidas y distinción entre equipos
  en [MEDICIONES.md](MEDICIONES.md#t01--diagnóstico-parcial--5-de-noviembre-de-2026).
- **Cambios de T01:** `tests/test_smoke.py` comprueba las marcas JPEG del recurso
  local sin cargar IA; `requirements-tests.txt` fija el entorno de pruebas.
- **Aprobación:** Brandon autorizó `pytest==9.2.0` y sus dependencias en
  `ai/.venv-tests` con Python 3.14.4, sin modificar el entorno SAM.
- **Preparación ejecutada** desde la raíz:
  ```bash
  uv venv --cache-dir /tmp/asset-finder-t01-uv-cache --python /usr/bin/python3 ai/.venv-tests
  uv pip install --cache-dir /tmp/asset-finder-t01-uv-cache --python ai/.venv-tests/bin/python pytest==9.2.0
  ```
  La descarga falló por DNS en el sandbox y pasó al repetirla con acceso
  autorizado. Versiones instaladas: `requirements-tests.txt`. No se instaló IA.
- **Validación final ejecutada:**
  ```bash
  ai/.venv-tests/bin/python -m py_compile ai/*.py
  ai/.venv-tests/bin/python -m pytest ai/tests -q
  ```
  Resultado: ambos comandos con código 0; `1 passed in 0.01s`. El intento previo
  con Python global falló por ausencia de pytest; no fue contado como aprobado.
  La prueba también pasó con `python3 -m unittest discover -s ai/tests -q`.
- **Limitaciones:** el smoke test no valida segmentación, CUDA ni el servidor.
  La dependencia temporal del entorno CPU antiguo quedó eliminada en la
  actualización de independencia de abajo; ya no impide mover esa carpeta.
- **Git:** `git fetch origin` falló por credenciales HTTPS (B01); no se hizo
  rebase ni push. Rama `feature/ai-t01-diagnostico`. Solo se incluirán archivos
  de T01 bajo `ai/`. TASKS/PROGRESS/MEDICIONES se incorporan con su contexto
  previo; los cambios anteriores de README, plan y requisitos CPU quedan fuera.
- **Commit de avance:** `ai(T01): diagnostico e independencia del entorno local`.
  Se actualiza el commit local aún no publicado de T01 para conservar uno por
  tarea; obtener su hash con `git log -1 --oneline --grep='^ai(T01):'`.
  No cierra T01 ni la FASE 1.
- **Push:** al terminar cada FASE, con validación aceptada y acceso Git
  restablecido. No se intenta publicar una fase incompleta.

## Independencia de la carpeta antigua · 2026-11-05

- **Solicitud adicional explícita:** Brandon pidió que nada dependa del proyecto
  antiguo y autorizó reinstalar las mismas versiones CPU. Esta preparación local
  no instala CUDA, DINO ni ejecuta T02–T05 del servidor.
- **Acción:** creado `ai/.venv-sam2` con Python 3.11.18 desde una instalación uv
  independiente del proyecto antiguo; reinstaladas las 23 versiones fijadas en
  `requirements-sam2.txt`. Registrado SAM en modo editable desde `ai/sam2/`,
  con `SAM2_BUILD_CUDA=0`, `--no-deps` y `--no-build-isolation`.
- **Validación de versiones:** las 23 entradas fijadas coinciden exactamente
  con las instaladas. `ai/.venv-sam2/bin/python -I -m pip check` termina con
  código 0: `No broken requirements found.`
- **Comando de uso independiente**, desde la raíz:
  ```bash
  ai/.venv-sam2/bin/python -I ai/prueba_sam2.py
  ```
- **Prueba ejecutada:** intérprete propio con `-I`, desde `/tmp`; un audit hook
  bloqueó accesos Python de archivos/directorios/carga de bibliotecas a la ruta
  antigua. Se ejecutó el script con `runpy.run_path` y se comprobaron los orígenes
  de todos los módulos importados: 4,889 accesos supervisados, ninguno a esa ruta.
  Resultado: código 0, segmentación 2.17 s, máscara binaria y alfa validados.
  El comando publicado también se ejecutó directamente: código 0, 2.05 s.
- **Auditoría de entornos:** enlaces simbólicos, `.pth`, `.egg-link`,
  `direct_url.json` y `pyvenv.cfg` de ambos entornos locales sin rutas al proyecto
  antiguo. PyTorch/torchvision/NumPy/Pillow provienen de `ai/.venv-sam2` y SAM
  de `ai/sam2`. Las menciones antiguas en mediciones son registros históricos.
- **Documentación:** el comando activo de `ai/README.md` ya usa el entorno propio;
  el entorno CUDA de Angel permanece separado y pendiente de aprobación en T02.

## T02 — Propuesta de entorno · 2026-11-05

- **Estado:** `completed`: propuesta revisada y aprobada expresamente por
  Brandon el 6 de noviembre de 2026. No se instalaron dependencias ni modelos GPU.
- **Autorización:** Brandon pidió T02 con límite de 10 minutos y un commit que
  incluya todos los cambios pendientes realizados, también README y plan raíz.
- **Evidencia:** [PROPUESTA_ENTORNO.md](PROPUESTA_ENTORNO.md). Fuentes oficiales
  de PyTorch, Meta/SAM, Meta/DINOv2, NVIDIA y PyPI. Candidata: Python 3.12.x,
  torch 2.14.1 + torchvision 0.29.1, CUDA 12.6, NumPy 2.4.6 y Pillow 13.0.0.
- **Revisión:** pareja publicada y ruedas CPython 3.12 Linux x86_64 verificadas;
  se documentó el conflicto del requirements de entrenamiento DINO y la ruta de
  inferencia sin xFormers. Sin afirmación de pruebas GPU en esta laptop.
- **Validación:** compilación Python con código 0; pytest `1 passed in 0.01s`;
  enlaces locales y sintaxis de dos bloques shell y un bloque Python de la
  propuesta revisados. `git diff --check` pasó. Las instrucciones CUDA no se ejecutaron.
- **Git:** fetch volvió a fallar por credenciales HTTPS; trabajo local en
  `feature/ai-t02-propuesta-entorno`, sin rebase. Brandon pidió push inmediato;
  la revisión automática pidió confirmar el destino y Brandon autorizó
  explícitamente `https://github.com/Kamus-Ac/Asset-Finder`. Al reintentar,
  `git push -u origin feature/ai-t02-propuesta-entorno` falló por credenciales:
  `could not read Username for https://github.com`. La aprobación ya está
  resuelta; falta autenticar Git (B01). No se publicó ningún commit. Commit de esta entrada:
  `ai(T02): proponer entorno CUDA y guardar cambios pendientes`.
  Incluye todos los cambios pendientes pedidos por Brandon: documentación,
  `ai/notas.txt` y los tres metadatos Windows Zone.Identifier preexistentes.
  Los entornos, pesos y resultados generados continúan ignorados y fuera del commit.

## Pendiente de la siguiente sesión

- Retomar **T01**, sin avanzar: registrar `/etc/os-release` y `free -h` del WSL
  de Angel y confirmar allí Python 3.12.1. La elección Ubuntu/WSL ya está resuelta.
- El proyecto actual ya funciona sin la carpeta antigua; T03–T05 siguen pendientes
  para preparar y probar el entorno CUDA del servidor de Angel.
- T02 está aprobada desde el 6 de noviembre; no volver a pedir esta aprobación.
  T01 aún requiere el informe del WSL de Angel antes de ejecutar T03 allí.

## Rama de publicación acordada · 2026-11-05

- Brandon indica que estos avances deben publicarse en **feature/ai-exploracion**.
- Las ramas T01/T02 fueron ramas locales de trabajo; no son el destino de publicación.
- Incorporar los commits por fast-forward, sin reescribir el historial de ai-exploracion.
- Destino autorizado: https://github.com/Kamus-Ac/Asset-Finder, rama feature/ai-exploracion.
- Comando de publicación: `git push -u origin feature/ai-exploracion`.
- B01 sigue pendiente: el último push falló por credenciales HTTPS; no pedir de
  nuevo autorización para el repositorio o esta rama ya confirmados por Brandon.

## Continuación T01 y aprobación T02 · 2026-11-06

- **Autorización recibida:** Brandon aprueba Python 3.12.x, torch 2.14.1,
  torchvision 0.29.1/cu126, NumPy 2.4.6, Pillow 13.0.0 y el resto de la propuesta.
  T02 se marca completada. Brandon puede ejecutar el diagnóstico con Angel;
  no hay acceso remoto al servidor disponible para esta sesión.
- **T01:** `queued`, pendiente de evidencia de Angel. Se creó
  `ai/diagnostico_servidor.py`: solo biblioteca estándar, sin instalar paquetes,
  con JSON de Ubuntu, kernel, Python, RAM visible y datos/salidas NVIDIA-SMI.
  Permisos insuficientes, comandos ausentes, timeout y CSV inválido quedan
  explícitos; los valores desconocidos son null. No se infiere éxito CUDA.
- **Comandos ejecutados:**
  ```bash
  ai/.venv-tests/bin/python -m py_compile ai/*.py
  ai/.venv-tests/bin/python -m pytest ai/tests -q
  python3 -I ai/diagnostico_servidor.py --output /tmp/asset-finder-diagnostico-local.json
  ```
  Resultado: compilación correcta; **12 passed, 3 subtests passed in 0.04s**.
  CLI con código 0 y JSON válido. Prueba local: Ubuntu 26.04.1, Python 3.14.4,
  RAM visible 8,195,334,144 bytes y GPU desconocida (NVIDIA-SMI ausente, 127).
  Ese resultado pertenece al equipo de desarrollo, no a la laptop de Angel.
- **Git:** la primera revisión automática de permisos para fetch venció sin
  ejecutar el comando. El reintento pasó y actualizó origin/main a `c12b19a`.
  La previsualización con `git merge-tree` detecta conflicto en README compartido,
  nuevo alcance de candidatos externos y retirada de planes/contratos de raíz.
  No se hizo rebase, merge, cambios de carpetas ajenas ni reescritura de historial;
  corresponde coordinar esa integración con P3 (B03).
- **Commit de continuación:** `ai(T01): agregar diagnostico reproducible de WSL`.
  Se conserva el historial publicado de T01/T02; esta continuación no cierra T01.
- **Publicación bloqueada (B01):** push CLI falla por credenciales HTTPS.
  El conector devolvió `permissions.push=true` para la cuenta, pero `create_tree`
  fue rechazado con 403 `Resource not accessible by integration`. El permiso de
  la cuenta no acredita el alcance del token de la integración. No se actualizó
  ninguna referencia remota, ni se hizo force push o alineación de commits.
  Se conserva el commit local y el script puede copiarse a Angel como archivo
  independiente, sin esperar al acceso GitHub ni instalar paquetes.
- **Siguiente paso:** Angel ejecuta el comando de `ai/README.md` dentro de Ubuntu
  y Brandon comparte el JSON. Con esa evidencia se podrá cerrar T01 y preparar
  el entorno GPU aprobado, en el equipo correcto. No se ejecutó T03 localmente.

## WSL del servidor pospuesto por Brandon · 2026-11-06

- Brandon aclara que Angel aún no tiene WSL/Ubuntu instalado y solicita dejar
  esa parte pendiente. T01 permanece `[ ]`, `queued`, bloqueada por ese requisito
  externo. El diagnóstico se pedirá cuando Ubuntu/WSL esté disponible.
- T02 conserva su aprobación explícita; T03–T05 no se ejecutaron ni se marcaron
  completadas. No se instalará WSL ni CUDA como parte de esta aclaración.
- Se actualizaron TASKS, plan, README, propuesta y mediciones. El entorno CPU
  independiente y el recolector estándar siguen listos para usarse.
- Esta aclaración se incorpora al commit local aún no publicado de T01,
  conservando el historial remoto y dejando fuera el timestamp local de graphify.

## T06 — Segmentación reutilizable · 2026-11-06

- **Estado:** `completed` en CPU. T01 y T03–T05 dependen del WSL pospuesto de
  Angel; según la regla de tareas sin esa dependencia se ejecutó únicamente
  T06. No se inició T07 ni se instaló CUDA o alguna dependencia nueva.
- **Código:** `ai/segmentation.py` devuelve máscara bool y score float; acepta
  PIL/ndarray RGB, caja xyxy y puntos. Caché por dispositivo/ruta, carga única
  incluso ante llamadas concurrentes y selección protegida por candado.
  Pesos o CUDA ausentes devuelven error explícito «servicio no disponible».
- **Extracción:** `prueba_sam2.py` importa la función sin duplicar inferencia.
  Conserva su entrada/salidas y caja fija; el tiempo ahora incluye primera carga.
- **Pruebas:** `ai/.venv-tests/bin/python -m py_compile ai/*.py` y
  `ai/.venv-tests/bin/python -m pytest ai/tests -q`, código 0: **19 passed,
  3 subtests passed in 12.63s**. Caché concurrente, reintento de carga fallida,
  paso de prompts, errores de recursos y SAM real. Los subprocesos CPU usan su
  propio Python 3.11; no se mezclaron paquetes con pytest Python 3.14.
- **Arranque real:** prueba aislada desde `/tmp`, código 0; se generaron máscara,
  recorte y superposición locales. Tiempo 5.51 s con primera carga y pruebas
  concurrentes; score bruto 0.4343. No es una medición de precisión o benchmark.
- **Evidencia adicional:** el reporte nuevo corresponde a Luis (RTX 4060,
  Ubuntu/WSL2, Python 3.14.4), no a Angel. Se conserva sin modificaciones ni
  incluirlo en este commit; su resumen está en `MEDICIONES.md`.
- **Git:** fetch pasó y origin/main llegó a `350a42e`. La integración con main
  sigue pendiente de coordinación por B03; no se editó ninguna carpeta ajena.
  Commit: `ai(T06): extraer segmentacion SAM reutilizable` en
  `feature/ai-exploracion`. Reporte de Luis y timestamp de graphify quedan fuera.
- **Siguiente tarea local:** T07. T06 está terminada; el servidor GPU no lo está.

## T07 — Validación de entradas · 2026-11-09

- **Estado:** `completed`. T01/T03–T05 mantienen el bloqueo del servidor;
  se ejecutó solo T07, siguiente tarea local independiente. T08 no se inició.
- **Cambio:** imágenes PIL RGB o ndarray uint8 H×W×3 con dimensiones positivas;
  cajas xyxy de cuatro números finitos y orden/rangos correctos; puntos con
  claves x/y/label, coordenadas interiores y label entero 0/1. Se rechazan
  booleanos, strings, NaN/Inf y ausencia de selección. Una lista de puntos vacía
  es válida si hay caja, pero una caja vacía es inválida.
- **Errores:** ValueError en español que identifica imagen, box_xyxy o punto.
  La validación ocurre antes de importar PyTorch y solicitar/cargar el predictor.
  No se cambian coordenadas, orientación ni colores silenciosamente.
- **Validación ejecutada:**
  ```bash
  ai/.venv-tests/bin/python -m py_compile ai/*.py
  ai/.venv-tests/bin/python -m pytest ai/tests -q
  ```
  Resultado: compilación correcta; **28 passed, 3 subtests passed in 18.57s**.
  Casos negativos verifican que el predictor no se solicite. Casos positivos
  cubren caja hasta el borde, solo puntos, caja+puntos y ndarray de solo lectura;
  las pruebas SAM reales de T06 también pasan. Sin dependencias nuevas.
- **Git:** fetch pasó sin novedades. B03 sigue pendiente: no se integró main
  por el conflicto compartido ya registrado; no se reescribió la rama publicada.
  Commit: `ai(T07): validar entradas antes de cargar SAM`, en
  `feature/ai-exploracion`. No corresponde push de cierre de FASE 2 todavía.
- **Siguiente tarea local:** T08. La elección de objeto y la GPU no se declaran
  validadas por estas pruebas de entradas.

## T08 — Selección real · 2026-11-09

- **Estado:** `completed`. `ai/prueba_seleccion.py` ejecutó SAM real en CPU con
  una caja y una selección de tres puntos positivos/tres negativos sobre la silla.
- **Comando:** `ai/.venv-sam2/bin/python -I ai/prueba_seleccion.py`, código 0.
  Caja: 17,425 píxeles, score 0.878883, 6.633 s con carga; puntos: 17,086 píxeles,
  score 0.848000, 1.889 s con modelo cargado. Una ejecución por caso, sin benchmark.
- **Evidencia:** `ai/resultados/T08/`: máscaras, recortes RGBA, superposiciones
  y `metrics.json`. Dimensiones/valores binarios/alfa validados. Revisé ambas
  imágenes: seleccionan la silla amarilla visible y excluyen los bancos grises;
  no se evalúan las partes ocultas ni precisión con ground truth.
- **Validación de módulo:** compilación código 0; pytest: **28 passed,
  3 subtests passed in 14.03s**; evidencia real
  y revisión visual completadas. `ai/.gitignore` excluye `/resultados/`; ninguna
  imagen, peso o entorno se incluye en el commit.
- **Commit:** `ai(T08): verificar seleccion real con caja y puntos`.
  No se probó backend ni se modificó otra área. La siguiente tarea es T09.

## T09 — Interfaz temprana, aceptación externa pendiente · 2026-11-09

- **Estado:** `queued` para aceptación; implementación local validada. Brandon
  confirma que aún no hay acuerdo con Manuel y autoriza usar criterio.
- **Decisión:** `ai/service.py` exporta `segment` real con su caché y errores;
  máscara NumPy bool H×W/score float, y `mask_to_png` devuelve bytes PNG L 0/255.
  `embed` y `search` lanzan `ServiceUnavailableError` con «servicio no disponible».
  Importar el servicio no importa NumPy/PyTorch ni carga modelos.
- **Propuesta:** `ai/INTERFAZ_P3.md` describe tipos, orientación/coordenadas,
  excepciones y responsabilidades de P3. No modifica el contrato HTTP, no envía
  mensajes al equipo ni introduce dependencias o fixtures ficticios.
- **Validación:** `ai/.venv-tests/bin/python -m py_compile ai/*.py` código 0;
  `ai/.venv-tests/bin/python -m pytest ai/tests -q`: **31 passed,
  5 subtests passed in 19.63s**. Incluye SAM CPU real desde el servicio,
  codificación/decodificación PNG exacta, errores y ausencia de resultados falsos.
- **Bloqueo:** T09 conserva `[ ]` hasta confirmación escrita de Manuel; no se
  ejecutó ninguna prueba en backend. Publicación también pendiente de B01.
  Commit: `ai(T09): exponer servicio IA y propuesta de tipos para P3`.
- **Continuación autorizada:** T10 es documental e independiente; se continúa
  para completar el trabajo local de FASE 2 sin declarar aceptada la fase.

## T10 — Investigación SAM 3D y cierre local de FASE 2 · 2026-11-09

- **Estado T10:** `completed`. Investigación documental dentro del límite de
  2 horas; evidencia y fuentes primarias en `ai/NOTAS_SAM3D.md`.
- **Resultado:** guía oficial de SAM 3D Objects pide Linux64 y GPU NVIDIA con
  al menos 32 GB VRAM. Angel/Luis tienen 8188 MiB documentados. No se cumple
  la configuración oficial; generación 3D: **servicio no disponible**.
  Sin instalaciones, descargas de pesos ni pruebas de inferencia SAM 3D.
- **Licencia:** código y pesos bajo SAM License (19/11/2025), con obligaciones
  de redistribución y uso; no se asume la licencia de SAM 2. Se documentan las
  alternativas y no se promete una optimización para 8 GB sin validarla.
- **Comprobación local:** `ai/.venv-sam2/bin/python -I -c 'import torch;
  print(torch.__version__); print(torch.cuda.is_available())'`, código 0:
  `2.15.0+cpu`, `False`. No acredita GPU del servidor de Angel.
- **Validación:** revisión de setup, README, licencia completa, entorno y código
  de inferencia oficiales; enlaces incluidos en el documento. `git diff --check`
  limpio. Suite del último cambio de código: 31 pruebas y 5 subtests en verde.
- **Commit:** `ai(T10): documentar viabilidad y licencia de SAM 3D`.
- **FASE 2:** T06, T07, T08 y T10 completas; implementación T09 lista, pero su
  aceptación requiere la confirmación escrita de Manuel sobre `INTERFAZ_P3.md`.
  No se marca la fase totalmente aceptada ni se inicia T11. No se probó backend.
- **Publicación:** no se ejecuta push de cierre mientras falte aceptación T09,
  según la regla de trabajo 3. B01 (autenticación histórica) y B03 (conflicto
  compartido con main) continúan pendientes; todos los commits se conservan
  en `feature/ai-exploracion`. No se modificaron otras carpetas.

## T01 — Retomada con la laptop de Angel preparada · 2026-11-09

- **Estado:** `running`, aceptación pendiente. Brandon informa que Angel ya
  tiene la laptop preparada para pruebas. Se sustituye el bloqueo anterior por
  la solicitud de evidencia: diagnóstico ejecutado dentro de Ubuntu/WSL de Angel.
  No se considera que el anuncio confirme por sí solo GPU/CUDA operativas.
- **Siguiente acción en ese equipo:** desde la raíz del proyecto,
  `python3 -I ai/diagnostico_servidor.py`, y compartir el JSON completo.
  También se puede copiar solo el script y ejecutarlo de forma independiente.
  No instala paquetes. El informe de Luis no reemplaza esta evidencia.
- **Validación local del recolector:**
  `ai/.venv-tests/bin/python -m pytest ai/tests/test_diagnostico_servidor.py ai/tests/test_smoke.py -q`,
  código 0: **12 passed, 3 subtests passed in 0.04s**. Casos sintéticos;
  no son una prueba del servidor ni completan T01. No cambió código ejecutable.
- **Instalación:** T02 mantiene su aprobación; no se pide de nuevo para las
  mismas versiones. T03–T05 esperan el diagnóstico y acceso/ejecución en Angel;
  no se instala nada en esta sesión ni se usa el entorno CPU como prueba CUDA.
- **Git:** fetch pasó y `origin/main` ya es ancestro de esta rama. B03 resuelto
  por merge `4425c62` y restauración documental `7390afa`; se actualiza su estado.
  Los archivos generados de graphify quedan fuera del commit. No corresponde
  push de cierre: FASE 1 aún no aceptada. T09 sigue esperando a Manuel y no
  bloquea esta reanudación de FASE 1.
- **Commit:** `ai(T01): retomar diagnostico del servidor de Angel`.

## T01 — Evidencia WSL recibida; NVIDIA aún pendiente · 2026-11-09

- **Estado:** `running`, aceptación parcial. Brandon comparte el JSON de Angel,
  conservado en `ai/Pruebas/Diagnostico_Angel_2026-11-09.json`. No se sustituyen
  los `null` por los datos de Luis ni por la captura Windows anterior.
- **Confirmado por el informe:** Ubuntu 26.04.1 en WSL2, Linux x86_64,
  glibc 2.43, Python 3.14.4, 7.64 GiB RAM visibles, `/dev/dxg` presente.
  **No confirmado:** modelo NVIDIA, driver/VRAM en Linux e inferencia CUDA.
  `nvidia-smi` no se encontró y ambas consultas devolvieron 127.
- **Análisis:** el recolector ya comprueba la ruta estándar
  `/usr/lib/wsl/lib/nvidia-smi`; no se presupone un simple problema de PATH.
  Python 3.14.4 no es el Python 3.12 aprobado; falta consultar `python3.12`.
- **Siguiente evidencia solicitada:** PowerShell: `nvidia-smi`, `wsl --version`,
  `wsl -l -v`. Ubuntu: rutas de `/dev/dxg`, `nvidia-smi`, `libcuda.so.1` y
  `python3.12 --version`. Comandos completos y fuente NVIDIA en el README.
  Son de lectura; la causa no se diagnostica por suposición ni se instalan drivers Linux.
- **Validación:** JSON parseado, campos de sistema/WSL/errores comprobados,
  cálculo de RAM y enlaces a evidencia revisados; `git diff --check` limpio.
  Solo documentación/evidencia; sin cambios de código ni repetición de pruebas
  de modelo. La suite local de diagnóstico anterior pasó 12 pruebas/3 subtests;
  ese resultado no acredita el equipo de Angel.
- **Alcance:** no se ejecutó T03 ni se cambiaron dependencias; la aprobación
  de T02 se conserva para la combinación original. T01 continúa `[ ]` hasta
  aclarar la evidencia NVIDIA; no se avanza a otra tarea por este informe parcial.
- **Commit:** `ai(T01): registrar diagnostico WSL de Angel y pendientes NVIDIA`.

## T01 — Windows solo enumera Intel; comprobación PnP pendiente · 2026-11-09

- **Estado:** `running`, pendiente de evidencia externa. Recibida consulta real
  de Windows y ejecución explícita dentro de Ubuntu mediante `wsl -d Ubuntu --`.
  Evidencia: `ai/Pruebas/Angel_GPU_Windows_2026-11-09.txt`.
- **Resultado:** Intel UHD, driver 31.0.101.2134, OK; NVIDIA no enumerada por
  `Win32_VideoController`. En WSL faltan `nvidia-smi` y `libcuda.so.1` en su ruta
  estándar; `python3.12` devuelve `command not found`. No es prueba de ausencia
  física de una RTX, ni permite afirmar una causa concreta.
- **Próximo paso:** modelo exacto con `Win32_ComputerSystem`, dispositivos
  Display presentes y dispositivos PnP con errores, todo desde PowerShell.
  README actualizado para evitar copiar comandos Linux directamente en Windows.
  Microsoft documenta las consultas PnP; MSI documenta un modo integrado que
  desactiva NVIDIA, pero no sabemos si aplica a esta laptop. Fuentes en README.
- **Validación:** evidencia textual y enlaces locales revisados;
  `git diff --check` limpio. Sin cambios de código ni pruebas CUDA simuladas.
  No se instalaron paquetes, drivers o MSI Center ni se modificó firmware.
- **Continuidad:** T01 sigue `[ ]`; T03 no se ejecuta hasta resolver NVIDIA
  y preparar un intérprete aprobado. Commit:
  `ai(T01): registrar deteccion Intel y comprobaciones de hardware pendientes`.

## T01 — Últimas pruebas en Dell Latitude 3410 · 2026-11-09

- **Estado:** `running`, pendiente de confirmar equipo. La salida recibida
  identifica Dell Inc., Latitude 3410; PnP Display presente: Intel UHD, OK.
  Se conserva en `ai/Pruebas/Equipo_Dell_2026-11-09.txt`.
- **Interpretación:** el mensaje de la consulta PnP de estados de error indica
  que no hubo coincidencias; no demuestra hardware averiado. Las últimas salidas
  no corresponden al modelo MSI/RTX 4070 previsto y no acreditan esa GPU.
- **Pregunta pendiente:** confirmar servidor definitivo. MSI: diagnóstico en
  esa máquina; Dell: acordar alternativa CPU con P3, sin asumir CUDA disponible.
  No se decide cambiar servidor ni instalar otras versiones sin esa respuesta.
- **Documentación:** TASKS, plan, resumen, propuesta y README reflejan la
  discrepancia. La hipótesis de MSI Center no aplica a la Dell identificada.
  No se alteraron los informes anteriores ni se cambiaron dependencias.
- **Validación:** salida textual y enlaces locales revisados;
  `git diff --check` limpio. Sin cambios de código ni nuevas pruebas de modelo.
- **Commit:** `ai(T01): distinguir equipo Dell de servidor MSI previsto`.

## T01 — Brandon confirma laptop equivocada; servidor MSI se mantiene · 2026-11-09

- Brandon aclara que las pruebas anteriores se ejecutaron en la laptop
  equivocada y que las repetirá en la correcta. Se mantiene la MSI/RTX 4070.
  No se acuerda ni se instala una alternativa CPU en la Dell.
- Los informes Dell se conservan como evidencia de otro equipo; su Python,
  memoria y ausencia de archivos NVIDIA no se trasladan al servidor MSI.
- README actualizado con un único bloque PowerShell, sin depender de la rama
  ni de archivos locales del proyecto. Consulta modelo, Windows NVIDIA, WSL,
  Ubuntu, arquitectura, glibc, NVIDIA/Python y memoria dentro de Ubuntu.
- T01 sigue `running`, `[ ]`, a la espera de las nuevas salidas. Sin cambios
  de dependencias o código y sin ejecutar T03. Validación documental:
  `git diff --check`; se conservan los informes originales sin alterarlos.
- Commit: `ai(T01): confirmar MSI y separar evidencia de la Dell`.

## T01 — Completada con diagnóstico MSI/RTX real · 2026-11-09

- **Estado:** `completed`. Brandon identifica la laptop correcta y comparte el
  informe del host MSI, WSL2/Ubuntu 26.04.1, x86_64, glibc 2.43, Python 3.14.4,
  7.61 GiB RAM visibles. NVIDIA-SMI funciona: RTX 4070 Laptop/8188 MiB/610.78.
- **Evidencia:** `ai/Pruebas/Diagnostico_MSI_Angel_2026-11-09.json`, conservada
  sin completar ni modificar los datos. `MEDICIONES.md` registra salida y límites.
  La primera ejecución no encontró el archivo; la segunda, con copia disponible,
  sí produjo el JSON. No implica dependencia de una ruta de la carpeta antigua.
- **Validación:** `ai/.venv-tests/bin/python -m py_compile ai/*.py` código 0;
  `ai/.venv-tests/bin/python -m pytest ai/tests -q`: **31 passed,
  5 subtests passed in 22.39s**. JSON parseado y campos GPU/driver/VRAM revisados.
  La suite usa CPU local; no se declara PyTorch CUDA ni inferencia GPU validada.
- **T01:** marcada `[x]` con evidencia del equipo confirmado; se actualizaron
  TASKS, plan, resumen, propuesta y README para dejar atrás el bloqueo Dell.
  No se alteraron los informes históricos de otras laptops.
- **Siguiente tarea T03:** se solicita comprobar `python3.12`, presencia de uv y
  directorios `ai/sam2`/`ai/.venv-gpu` en Ubuntu de la MSI. No se infiere que falte
  Python 3.12 en ella por el resultado de la Dell. La aprobación de T02 permanece;
  se reconsultaron índices oficiales cu126/cp312, sin instalar paquetes.
- **Git:** commit `ai(T01): cerrar diagnostico del servidor MSI con RTX 4070`.
  No corresponde push de cierre: FASE 1 aún requiere T03–T05.

## T03 — Preparación pendiente de Python 3.12 en MSI · 2026-11-09

- **Estado:** `queued`, instalación aún no ejecutada. T01 cerrada en `13f5d18`.
  En el equipo correcto, `python3.12 --version` devuelve `command not found`.
  No se deduce que falten uv o SAM: el usuario encadenó con `&&` y esas
  comprobaciones no llegaron a ejecutarse.
- **Siguiente evidencia solicitada:** `command -v uv` con aviso si no existe y
  `ls -ld ai ai/sam2 ai/.venv-gpu`, desde Ubuntu/raíz de la MSI. Sin instalaciones.
- **Preparación independiente:** índices oficiales confirman ruedas cu126/cp312
  para la pareja aprobada; documentación de uv permite Python gestionado.
  Metadatos locales de uv ofrecen CPython 3.12.16 Linux x86_64 GNU, sin descarga
  ni instalación. Esa consulta no es evidencia del estado de la MSI.
- **Límites:** se mantiene Python 3.12.x aprobado; no se propone cambiar a 3.14
  ni instalar uv sin revisar si existe. No se creó `.venv-gpu`, no se instaló
  PyTorch y no se ejecutó una prueba CUDA. Validación: revisión documental y
  `git diff --check`. La suite T01 ya pasó; no se repite por estos cambios documentales.
- **Commit:** `ai(T03): registrar comprobaciones previas de Python y entorno`.

## T03 — Python 3.12.16 creado; instalador GPU listo · 2026-11-09

- **Estado:** `running`, pendiente de ejecución en MSI. El usuario confirma uv
  en `/home/tobias/.local/bin/uv` y crea `.venv-gpu` en la raíz con Python 3.12.16.
  También confirma `ai/` y `ai/sam2/`. Evidencia recibida en
  `ai/Pruebas/Preparacion_MSI_T03_2026-11-09.txt`.
- **Ubicación:** se adopta el entorno que creó el usuario, sin moverlo ni crear
  otro bajo ai/. Código, documentación y futuro lock permanecen en `ai/`.
  `.gitignore` ya excluye `.venv-*/`; no se modificó ningún archivo de raíz.
- **Implementación:** `ai/preparar_gpu.sh` autocontenido, copiable a la MSI.
  Rechaza intérprete ajeno, paquetes previos no acordados, otra GPU y revisión
  SAM no confirmada antes de instalar. Usa las versiones aprobadas, sin extensión
  CUDA SAM. Solo genera lock e informe después de `pip check` y operación CUDA real.
- **Validación local:** `bash -n`; dos bloques Python analizados con `ast.parse`;
  comprobación real en repo temporal: rechaza entorno ausente y Python CPU 3.11
  antes de instalar. Compilación ai/*.py código 0; suite pytest: **31 passed,
  5 subtests passed in 22.36s**. No se instalaron paquetes aquí ni en la MSI.
- **Pendiente:** pasar el script y ejecutar `bash ai/preparar_gpu.sh .venv-gpu`
  en Ubuntu de la MSI. Recibir JSON y lock reales; no se inventa un freeze.
  Si falla, revisar el error/estado parcial antes de reintentar. T03 sigue `[ ]`;
  no se inicia T04 ni se declara SAM/DINO funcionando en GPU.
- **Commit:** `ai(T03): preparar instalador GPU para entorno existente`.

## T03 — Reanudar con dependencias comunes ya presentes · 2026-11-09

- **Estado:** `running`, GPU aún pendiente. El instalador encontró 14 paquetes
  comunes, sin torch, y se detuvo antes de instalar por su comprobación inicial.
  Evidencia en `ai/Pruebas/Inventario_MSI_T03_2026-11-09.txt`.
- **Corrección:** se permite ese inventario exacto, compatible con la base
  aprobada; se rechazan versiones distintas y paquetes ajenos, incluido torch CPU.
  No se quita la comprobación de Python, revisión SAM, NVIDIA ni CUDA real.
- **Rutas:** las consultas manuales fallaron porque se ejecutaron desde `ai/`
  con rutas de la raíz. El instalador sí localiza el entorno correcto mediante
  la raíz Git. No se recrea ni mueve `.venv-gpu`.
- **Validación:** `bash -n`, compilación y suite pytest código 0: **35 passed,
  5 subtests passed in 29.95s**. Cuatro regresiones prueban el inventario recibido,
  entorno vacío y rechazo de numpy incompatible/torch CPU. Son pruebas de política
  con metadata controlada; no se presentan como CUDA real.
- **Pendiente MSI:** reemplazar el script y ejecutar desde la raíz, conservando
  los paquetes revisados. T03 sigue `[ ]`; no hay JSON CUDA ni lock real todavía.
- **Commit:** `ai(T03): permitir reanudar con la base comun revisada`.
- **Publicación:** Brandon solicita ahora commit y push de los cambios pendientes
  en `feature/ai-exploracion`, sin esperar al cierre de fase. Se incluyen código,
  documentación e historial local; graphify generado permanece fuera del commit.

## Publicación solicitada y política Graphify corregida · 2026-11-09

- El ajuste de T03 quedó en `ee03343`, con 35 pruebas y 5 subtests en verde.
  Fetch pasó; la rama remota IA no divergió. Había 24 commits locales pendientes.
- `git push origin HEAD:refs/heads/feature/ai-exploracion` falló:
  `could not read Username for 'https://github.com': No such device or address`.
  No hay GitHub CLI, token GitHub en entorno, agente SSH ni identidad SSH
  predeterminada disponibles. Falta autenticar GitHub en esta sesión; no se
  publicó ningún commit ni se solicitó de nuevo autorización del destino.
- Brandon aclara la regla: **graphify-out/ sí puede subirse a su rama y no a
  main**. TASKS y notas actualizados; B02 resuelto. Se autoriza expresamente
  esa carpeta fuera del área ai/. Sus salidas se guardan en un commit separado
  para excluirlo al preparar el PR a main; `.gitignore` no basta para archivos
  ya versionados. No se cambiaron reglas globales ni archivos de main.
- El fetch vio `origin/main` en `116f440`; no se fusiona en este trabajo de
  publicación. El merge anterior de `350a42e` sigue conservado.
- Validación de esta aclaración: `git diff --check`; contenido documental.
  Publicación sigue pendiente por autenticación, aunque los cambios quedan
  guardados localmente en la rama acordada.

## R01 — Reorganización: CPU primero, servidor al final · 2026-11-10

- **Estado:** `completed` para la reorganización documental, autorizada por
  Brandon. No se ejecutó T11 ni se añadió funcionalidad, dependencias o pesos.
- **Orden:** base conservada → recorte/DINO CPU (T11–T13) → candidatos externos
  (T14–T17) → ranking/evaluación (T18–T20) → flujo local/errores/caché/mediciones
  (T21-L–T27-L) → validación GPU e integración. Video queda opcional.
- **Trazabilidad:** IDs anteriores conservados. T09-L identifica la interfaz
  inicial ya probada; T09-P sigue sin aceptación de Manuel. Las tareas compartidas
  de integración/cierre se dividen en entregable local y validación externa,
  sin completar GPU ni criterios pendientes por haber cambiado el orden.
- **Alcance:** T14–T17 sustituyen catálogo manual/renders obligatorios por
  candidatos externos con imágenes suministradas por P3, preparación y caché
  versionada. El conector actual de Sketchfab recibe texto; falta coordinar cómo
  la referencia inicia esa obtención. DINO compara candidatos, no descubre páginas.
- **Dependencias diferidas:** T03–T05 esperan MSI; confirmación de tipos y pruebas
  HTTP/red/clientes esperan al equipo. T13/T20/T21-L necesitan imágenes reales;
  si faltan, anotar el bloqueo y continuar solo con tareas independientes.
  SAM 3D conserva su investigación y estado no disponible, fuera del cierre de búsqueda.
- **Reglas ajustadas:** orden por dependencias, commit por tarea, push por fase
  local y validación documental proporcional. Se elimina el rebase automático
  de una rama compartida; se conserva la política Graphify solo en rama IA.
- **Archivos:** TASKS y PLAN_P4_IA reescritos; README, resumen, interfaz,
  propuesta GPU, notas SAM 3D y notas de trabajo sincronizados. No se eliminó
  ningún archivo ni se modificaron raíz, backend, frontend o el grafo.
- **Git comprobado:** `git status --short --branch`, `git fetch origin` y
  `git rev-list --left-right --count HEAD...origin/feature/ai-exploracion`:
  `0 0` antes de esta edición, HEAD/remoto en `87bc082`. Los commits anteriores
  ya están publicados; el error de autenticación queda como antecedente.
  `origin/main` continúa en `116f440`, sin integrar como parte de esta tarea.
- **Validación:** `git diff --check` código 0. Revisión Python de enlaces y
  estructura: 9 archivos documentales dentro de ai/, 36 enlaces relativos válidos,
  bloques Markdown cerrados, IDs T00–T27 conservados y criterios externos todavía
  pendientes. Se revisó el diff para comprobar estados y concordancia de fases.
  No se repite inferencia ni pytest por cambios solo documentales; la última suite
  de código registrada conserva 35 pruebas y 5 subtests, sin presentarla como nueva.
- **Commit previsto:** `ai(R01): reorganizar plan CPU antes de servidor`.
  La siguiente tarea ejecutable es **T11**, preparación del recorte con pruebas.

## Merge de main hacia la rama IA · 2026-11-10

- **Solicitud:** Brandon autoriza traer los últimos cambios de main mediante
  merge, conservar todos sus archivos y avisar de conflictos. No se inicia T11.
- **Base:** árbol limpio; rama `feature/ai-exploracion`, HEAD `9623065`.
  `git fetch origin` pasó; main remoto en `116f440`, con el incremento
  `6529b92` de API de imágenes y exportación de candidatos.
- **Comando:** `git merge --no-ff --no-commit origin/main` detectó un único
  conflicto de contenido en README. Se avisó a Brandon durante la operación.
  Se resolvió conservando todo su README previo y añadiendo al final las secciones
  entrantes de API/exportación. Sin rebase ni resolución global a favor de una rama.
- **Conservación:** inventario previo de 134 rutas registrado fuera del repo;
  todas siguen presentes. README conserva íntegro el contenido anterior y la
  documentación nueva. Los cinco archivos backend afectados son idénticos a main;
  no se eliminó ningún archivo ni se modificaron código IA, entornos o pesos.
- **Estado actualizado:** B03 resuelto en TASKS y resumen actualizado con `/media`
  y exportador JSON. Sigue pendiente acordar la descarga/decodificación de
  miniaturas antes de llamar IA: el exportador entrega URLs, no imágenes RGB.
- **Validación:** compilación de los cinco archivos backend código 0;
  `ai/.venv-tests/bin/python -m py_compile ai/*.py` código 0;
  `ai/.venv-tests/bin/python -m pytest ai/tests -q`:
  **35 passed, 5 subtests passed in 21.95s**. Revisión de contenido del merge,
  conservación de rutas, ausencia de marcadores y `git diff --check` en verde.
- **Límite:** no hay entorno backend local ni FastAPI/HTTPX/multipart en los
  intérpretes consultados; no se ejecutan las pruebas HTTP/exportación del backend
  ni consultas reales a Sketchfab. No se instalan paquetes sin propuesta/aprobación.
- **Commit de merge:** `Merge origin/main into feature/ai-exploracion`.
  Se conserva el historial de ambas ramas; siguiente tarea de desarrollo: T11.


## T11 — Recorte determinista CPU · 2026-11-10

- `preprocess.py`: RGB uint8, máscara bool del mismo tamaño, rechazo de máscara
  vacía, recorte al objeto, fondo blanco y margen del 10% en lienzo cuadrado.
  Sin máscara se prepara la imagen completa; no muta entradas ni aplica EXIF.
- Validación: compilación y `ai/.venv-tests/bin/python -m pytest ai/tests -q`:
  **37 passed, 5 subtests passed in 21.12s**. Casos numéricos comprueban fondo,
  recorte, máscara completa, huecos, determinismo y rechazo de entradas inválidas.
- Sin paquetes nuevos, pesos ni cambios fuera de ai/. Siguiente: T12.
- Commit: `ai(T11): preparar recortes RGB consistentes`.


## T12 — DINOv2 real en CPU · 2026-11-10

- `embedding.py`: backbone oficial ViT-S/14, revisión
  `7764ea0f912e53c92e82eb78a2a1631e92725fc8`, vector float32 de 384 dimensiones
  con norma 1, evaluación/sin gradientes y caché por dispositivo/recurso.
  Preparación T11 y resize bicúbico 224 con normalización ImageNet registrados.
- `resources.py` descarga solo por CLI explícita; tamaño/hash de archivo, código
  y pesos en `dino_resources.json`. Pesos: 88,283,115 bytes, SHA-256
  `b938bf1bc15cd2ec0feacfe3a1bb553fe8ea9ca46a7e1d8d00217f29aef60cd9`.
  Proveedor/archivo comprimido ignorados, licencia Apache-2.0 de DINO conservada.
- No se instaló ningún paquete ni se cambió el entorno CPU aprobado. Inferencia
  sin xFormers y sin red; `service.embed` ahora es real. CUDA no se probó.
- Validación: compilación y suite **39 passed, 4 subtests passed in 23.67s**;
  dos embeddings reales iguales, finitos/normalizados, una carga, recursos ausentes
  y entradas inválidas. La prueba reservada para embed se retira al implementarlo.
- Fuentes: https://github.com/facebookresearch/dinov2/blob/7764ea0f912e53c92e82eb78a2a1631e92725fc8/dinov2/hub/backbones.py
  y pesos oficiales https://dl.fbaipublicfiles.com/dinov2/dinov2_vits14/dinov2_vits14_pretrain.pth
- Commit: `ai(T12): incorporar DINOv2 CPU con recursos verificados`.


## T13 — Prueba real de similitud y cierre FASE 1 CPU · 2026-11-10

- Comando: `OMP_NUM_THREADS=2 MKL_NUM_THREADS=2 ai/.venv-sam2/bin/python -m ai.prueba_embeddings`.
- Dos fotogramas reales del video de ejemplo bedroom, región de la misma cama
  [0,450,700,540], frente al recorte de silla amarilla de la referencia local.
  Coseno cama/cama: **0.95553565**; cama/silla: **0.34461749**. Tiempos DINO
  0.6564 s con carga, 0.1155/0.1264 s posteriores; una ejecución por imagen.
- Procedencia, SHA-256, recortes, configuración y límites en
  `ai/resultados/T13/metrics.json`; imágenes ignoradas, no redistribuidas. Dos
  fotogramas correlacionados de un video no acreditan relevancia de assets 3D.
  La licencia particular de esos ejemplos no está confirmada y queda registrada.
- Compilación y suite: **39 passed, 4 subtests passed in 23.25s**.
  FASE 1 CPU aceptada; siguiente T14. No prueba CUDA ni API.
- Commit: `ai(T13): medir similitud real entre vistas de objeto`.


## T14 — Desarrollo CPU · 2026-11-10

- `candidates.py` valida metadatos/IDs/vistas y URLs sin red; desconocidos null y archivo 3D solo con confirmación interna de P3. Casos sintéticos de validación explícitos, no inferencia.
- Propuesta de imágenes en memoria y diferencias del JSON exportado en CANDIDATOS_P3.md; no cambia contratos HTTP.
- Push de FASE 1 intentado tras 49e815c: falló por credenciales HTTPS ausentes. Identidad bdiazsofttek-oss / bdiazsofttek@gmail.com confirmada; no equivale a autenticación.

- Validación: compilación `ai/*.py` y `ai/.venv-tests/bin/python -m pytest ai/tests -q`: **42 passed, 13 subtests passed in 22.76s**.
- Sin instalaciones, CUDA ni API del equipo; siguiente T15.
- Commit por tarea en `feature/ai-exploracion`.


## T15 — Desarrollo CPU · 2026-11-10

- Preparación compartida de miniaturas/vistas en candidate_images.py, con huella de contenido y trazabilidad asset/vista. Lotes parciales informan imágenes inválidas o ausentes sin inventar vectores.
- Se separa la codificación DINO de imagen ya preparada para evitar aplicar dos veces el margen. La inferencia real y su identidad permanecen verificadas.

- Validación: compilación `ai/*.py` y `ai/.venv-tests/bin/python -m pytest ai/tests -q`: **43 passed, 13 subtests passed in 35.58s**.
- Sin instalaciones, CUDA ni API del equipo; siguiente T16.
- Commit por tarea en `feature/ai-exploracion`.


## T16 — Desarrollo CPU · 2026-11-10

- index.py construye lotes externos incrementales, vectores float32 y metadatos separados; caché por contenido/modelo/preprocesado/dispositivo, guardado atómico NPZ sin pickle.
- Prueba DINO real confirma una sola preparación, reutilización entre IDs con igual imagen, invalidación por contenido y persistencia/relectura. Ninguna colección global obligatoria.

- Validación: compilación `ai/*.py` y `ai/.venv-tests/bin/python -m pytest ai/tests -q`: **44 passed, 13 subtests passed in 26.08s**.
- Sin instalaciones, CUDA ni API del equipo; siguiente T17.
- Commit por tarea en `feature/ai-exploracion`.


## T17 — Desarrollo CPU · 2026-11-10

- Integridad de índices: versión/identidad, dimensión, norma/finitud, IDs y vistas únicas, metadatos, huellas y checksum de vectores. Persistencia NPZ sin pickle y límite descomprimido de 64 MiB.
- La caché verifica también checksum por vector; pruebas rechazan datos corruptos, huérfanos y versiones incompatibles. FASE 2 local aceptada.
- Publicación sigue pendiente por autenticación HTTPS ya comprobada; no se repite el intento sin cambio de credenciales.

- Validación: compilación `ai/*.py` y `ai/.venv-tests/bin/python -m pytest ai/tests -q`: **45 passed, 13 subtests passed in 25.79s**.
- Sin instalaciones, CUDA ni API del equipo; siguiente T18.
- Commit por tarea en `feature/ai-exploracion`.
