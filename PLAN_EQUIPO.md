# Plan de equipo — Asset Finder (entrega en ~1 semana)

**Creado:** 5 nov 2026. **Equipo:** 4 personas, todos con Codex.
**Objetivo del curso:** aprender herramientas de IA y entregar una app sencilla pero robusta con IA integrada. (Después habrá un proyecto profesional de 4 semanas; este es de aprendizaje.)

> Este plan **recorta** el roadmap de 6 semanas del documento de contexto a 7 días. Cubre los 4 frentes (móvil, web, backend, IA) pero en versión básica. Todo lo marcado ⚠ es una recomendación a confirmar en equipo.

## 1. Roles (completar nombres)
| Rol | Nombre | Carpeta | Entrega al final |
| --- | --- | --- | --- |
| P1 — Móvil | ______ | `mobile/` | Foto real → selección → resultados, probado en teléfono |
| P2 — Web + escena 3D | ______ | `frontend/` | Subir imagen, resultados, escena con varios GLB guardable |
| P3 — Backend + servidor | ______ | `backend/`, raíz | API estable, archivos, tareas, Tailscale, arranque repetible |
| P4 — IA + catálogo | ______ (Manuel sugerido) | `ai/` | SAM + DINO + catálogo indexado (20–30 modelos), medición |

P1:Luis
P2:Angel
P3:Manuel
P4:Brandon

## 2. Simplificaciones recomendadas para 1 semana ⚠
Confirmar antes del día 2; si no se acuerda, se usa lo del documento original.
- **BD:** SQLite en vez de PostgreSQL (migrar después en el proyecto de 4 semanas).
- **Vectores:** NumPy (coseno) en vez de pgvector. Con 20–50 assets sobra.
- **Cola:** un trabajador en el proceso/hilo con candado (una tarea GPU a la vez), sin Redis/RQ.
- **Archivos:** disco local del servidor.
- **Cuentas:** sin login; un “modo demo” con proyectos por ID.
- **Móvil:** solo Android (Expo Go para probar rápido). iOS no.
- **SAM 3D:** solo investigación de 2 h por P4 (día 2). Si no es viable con 8 GB, se documenta la conclusión y la UI muestra “servicio no disponible”.
- **Video:** solo si sobra tiempo (extraer un fotograma con FFmpeg).

## 3. Principios anti-conflictos
1. **Cada quien en su carpeta** (ver `AGENTS.md`). Cruce de carpetas = pedir al dueño.
2. **Contratos y mocks el día 1.** P1 y P2 no esperan a P3/P4.
3. **PR chicos y diarios**, rebase antes de empezar.
4. **Un dueño por archivo compartido** (P3 en raíz y contratos).
5. **Lockfiles y dependencias:** solo el dueño de la carpeta.
6. **Congelamiento** de contratos el día 3 (después solo cambios acordados por todos).
7. **Worktrees** si alguien corre varios Codex en paralelo.

## 4. Rutina diaria
- **10 min de sync** (mañana): qué hice, qué haré, qué me bloquea, qué contrato cambia.
- Antes de codear: `git fetch && git rebase origin/main`.
- Al terminar el día: PR abierto (aunque sea parcial, marcado “WIP”) y mensaje al grupo.
- **Orden de merge** cuando coinciden PRs: contratos/mocks → backend → IA → clientes.

## 5. Calendario (día 1 = jue 5 nov)
| Día | P1 móvil | P2 web/3D | P3 backend | P4 IA | Hito |
| --- | --- | --- | --- | --- | --- |
| 1 (jue 5) | Revisar repo; pantallas con mocks | Pantallas + escena con GLB de prueba | **Contratos + mocks + API base `/health`** | Medir SAM/DINO con CUDA; set de pruebas | Contratos publicados |
| 2 (vie 6) | Cámara/galería/permisos | Carga GLB, piso, cuadrícula, cámara | `/media`, archivos, Tailscale | Segmentación reutilizable; prueba SAM 3D (2 h) | Captura real llega al servidor |
| 3 (sáb 7) | Rectángulo de selección + subida | Selección/mover/rotar/escalar | Tareas + trabajador GPU + `/segmentations` | Catálogo 20–30 modelos (renders + DINO) | **Congelar contratos**; selección real + índice |
| 4 (dom 8) | Resultados reales | Resultados reales + arrastre a escena | `/searches`, `/assets`, entrega de GLB | Ranking agrupado por asset + evaluación | Foto → búsqueda → resultado |
| 5 (lun 9) | Guardar elección en proyecto | Guardar/recuperar escena | `/projects`, `PUT /scene` | Caché de embeddings; fotograma de video si hay tiempo | Móvil → web → escena guardada |
| 6 (mar 10) | Errores, permisos, pruebas en teléfono | Errores, rendimiento | Arranque repetible + pruebas integradas | Medición final + documentación | **Congelamiento de features** |
| 7 (mié 11) | Pulir | Pulir | Ensayo de demo | Ensayo de demo | **Demo extremo a extremo** |

*Si la entrega es antes/después, mover el congelamiento (día 6) un día antes de la fecha real.*

## 6. Detalle por rol (qué pedirle a Codex)
**P1 móvil:** Expo + TypeScript. Pantallas: captura/galería → previsualización → selección (rectángulo) → resultados → detalle/guardar. Cliente HTTP único que lea la URL del servidor de `.env`. Estados reales de tarea; manejo de permisos denegados y red caída.

**P2 web/3D:** React + Vite + Tailwind + React Three Fiber. Subir imagen y seleccionar (Canvas), mostrar resultados, cargar GLB bajo demanda, arrastrar al piso (raycasting), mover/rotar/escalar/eliminar, guardar/recuperar escena (`asset_id`, `instance_id`, posición, rotación, escala; Y hacia arriba). Si `model_available: false`, no ofrecer arrastre.

**P3 backend:** FastAPI + Pydantic. Implementar los endpoints de `docs/CONTRATOS_API.md` primero **devolviendo los mocks**, luego sustituir por lógica real. Tareas en cola con una sola ejecución GPU. CORS para web. Dejar `README` de arranque y reinicio, y `.env.example`.

**P4 IA:** PyTorch con CUDA (verificar versión; no reutilizar el instalador CPU). SAM 2.1 Tiny + DINOv2 ViT-S/14. Módulo con funciones puras: `segment(image, box, points) → mask`, `embed(image) → vector`, `search(vector, k)`. Indexador del catálogo con renders (Blender si hay GLB). Registrar modelo/pesos/configuración del índice. Medir VRAM y tiempos. Ejecutar scripts desde `ai/` con `python -P` para evitar el conflicto de importación conocido.

## 7. Riesgos y qué hacer
| Riesgo | Mitigación |
| --- | --- |
| Servidor/GPU no listo | P4 y P3 lo verifican el día 1; plan B: SAM/DINO en CPU para la demo (más lento) |
| Catálogo sin GLB descargables | Empezar con modelos que ya tengamos; el resultado muestra `model_available` real |
| Conflicto de contrato | Solo por PR a `CONTRATOS_API.md`, con aviso al grupo |
| Dependencias rotas (TypeScript, PyTorch) | Solo el dueño de la carpeta actualiza; revisar lockfile antes de imponer versiones |
| Laptop servidor se duerme | Conectada, sin suspensión, durante pruebas y demo |
| SAM 3D no cabe en 8 GB | Aceptado: documentar conclusión; UI “servicio no disponible” |
| Un integrante bloquea a otro | Mocks desde el día 1; nadie espera a un servicio real |

## 8. Decisiones por cerrar hoy
1. Nombres P1–P4.
2. ¿Aceptan las simplificaciones de la sección 2 (SQLite, NumPy, sin Redis, sin login, solo Android)?
3. Fecha real de entrega para ajustar el día de congelamiento.
4. Fuente y licencia del catálogo inicial.
5. ¿Demo con Tailscale (privado) o necesitan acceso público?

## 9. Prompt inicial sugerido para cada Codex
> Lee `AGENTS.md` y `docs/PLAN_EQUIPO.md`. Mi rol es **P_ (nombre del rol)**. Trabaja solo en `<mi carpeta>` y en la rama `feature/<área>-<tarea>`. Primero inspecciona el repo y resume qué existe. La tarea de hoy es: *<pegar fila del calendario>*. Usa los mocks de `docs/mocks/` y no cambies contratos ni archivos fuera de mi carpeta; si hace falta, detente y dime qué cambio pedir.
