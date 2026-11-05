# AGENTS.md — Reglas para Codex y el equipo (Asset Finder)

Este archivo lo leen los agentes de Codex al abrir el repo. Los 4 integrantes lo respetan.
Plan completo en `docs/PLAN_EQUIPO.md`. Contratos de API en `docs/CONTRATOS_API.md`.

## 0. Antes de tocar nada
1. Pregunta (o revisa `docs/PLAN_EQUIPO.md`) **qué rol eres**: P1 móvil, P2 web/3D, P3 backend, P4 IA.
2. Inspecciona el repo antes de modificar. No asumas que algo existe o funciona: distingue avance confirmado de propuesta.
3. Trabaja **solo en tu rama** y **solo en tus carpetas** (sección 2).

## 1. Contexto mínimo del producto
Asset Finder: foto/video → seleccionar objeto → SAM genera máscara → DINO genera embedding → búsqueda en catálogo de assets 3D → guardar elección en un proyecto → colocar modelos en una escena web.
Restricciones: solo modelos de IA de Meta; la IA corre en el servidor (laptop RTX 4070, 8 GB VRAM), nunca en el cliente; conexión por Tailscale. SAM 3D es solo investigación (no prometer que funciona). No inventes resultados de pruebas ni muestres datos de ejemplo como reales.

## 2. Propiedad de carpetas (regla anti-conflictos #1)
| Carpeta | Dueño | Otros pueden |
| --- | --- | --- |
| `mobile/` | P1 | solo leer |
| `frontend/` (web) | P2 | solo leer |
| `backend/` | P3 | solo leer |
| `ai/` | P4 | solo leer |
| `docs/CONTRATOS_API.md`, `docs/mocks/` | P3 (dueño), todos proponen cambios por PR | — |
| Raíz (`.gitignore`, `.env.example`, `README.md`, configs globales) | P3 | pedir cambio a P3 |

**Si necesitas cambiar un archivo que no es de tu carpeta: NO lo edites.** Abre un issue/mensaje al dueño con el cambio exacto, o haz un PR pequeño solo con ese cambio y avisa.

## 3. Reglas de Git
- Una rama por tarea: `feature/<area>-<tarea>` (ej. `feature/mobile-capture`). Nunca commits directos a `main`.
- Antes de empezar cada sesión: `git fetch && git rebase origin/main` (o merge si hay dudas).
- PR pequeños (< ~300 líneas), mínimo 1 por día. Descripción: qué hace, cómo probarlo, limitaciones.
- Un integrante distinto al autor revisa y mergea. Merge con squash.
- Si dos agentes de Codex corren en paralelo en tu máquina, usa `git worktree` (un directorio por rama), no la misma carpeta.
- **Prohibido:** reformatear archivos completos, renombrar/mover carpetas, “limpiar” código ajeno, actualizar dependencias masivamente.
- No subir: `node_modules`, `.venv*`, pesos de modelos, `.env`, capturas privadas, resultados grandes.
- Lockfiles (`package-lock.json`, `uv.lock`): solo el dueño de esa carpeta los modifica. Si no cambiaste dependencias, no los incluyas en el commit.

## 4. Contratos primero, código después
- La comunicación entre áreas es **solo** por `docs/CONTRATOS_API.md`.
- P1 y P2 desarrollan contra respuestas de ejemplo en `docs/mocks/` desde el día 1; no esperan al backend/IA.
- Cambiar un contrato = PR a ese archivo + aviso al grupo + actualizar el mock. Sin cambios “silenciosos”.
- Campos desconocidos van `null`; no se inventan.

## 5. Cómo debe trabajar Codex
- Pasos pequeños y verificables; explica en español qué hizo y cómo probarlo.
- Corre la prueba/arranque de tu módulo antes de dar la tarea por terminada.
- Si una tarea requiere salir de tu carpeta o cambiar un contrato, **detente y avisa** en vez de improvisar.
- No instales ni cambies versiones de dependencias sin que el dueño lo apruebe (ej. no mezclar PyTorch CPU con CUDA; verificar TypeScript en `package.json`).
- Estados de tarea: `queued`, `running`, `completed`, `failed`.
- Si algo no está disponible (p. ej. generación 3D), responde explícitamente “servicio no disponible”.

## 6. Definición de terminado
Funciona contra el servidor real (o mock acordado), maneja errores esperados, tiene comando de arranque documentado y otra persona puede probarlo siguiendo tus pasos.
