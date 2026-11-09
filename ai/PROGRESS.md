# PROGRESS.md — Bitácora de P4 (IA y catálogo)

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
