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

- **Estado:** `queued`, propuesta elaborada y revisada documentalmente;
  aceptación pendiente de Brandon. No se instalaron dependencias ni modelos.
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
- Revisar y aprobar T02 antes de cualquier instalación CUDA. Mantener T01/T02
  pendientes por sus criterios externos; no comenzar T03 sin resolverlos.

## Rama de publicación acordada · 2026-11-05

- Brandon indica que estos avances deben publicarse en **feature/ai-exploracion**.
- Las ramas T01/T02 fueron ramas locales de trabajo; no son el destino de publicación.
- Incorporar los commits por fast-forward, sin reescribir el historial de ai-exploracion.
- Destino autorizado: https://github.com/Kamus-Ac/Asset-Finder, rama feature/ai-exploracion.
- Comando de publicación: `git push -u origin feature/ai-exploracion`.
- B01 sigue pendiente: el último push falló por credenciales HTTPS; no pedir de
  nuevo autorización para el repositorio o esta rama ya confirmados por Brandon.
