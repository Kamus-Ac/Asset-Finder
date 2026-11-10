# PLAN P4 IA — Desarrollo local primero, servidor al final

**Brandon / P4 · actualizado el 10 de noviembre de 2026.**
Trabajo en `ai/`, rama `feature/ai-exploracion`.
[TASKS.md](TASKS.md) es la lista única de tareas, estados y aceptación;
[PROGRESS.md](PROGRESS.md) conserva la evidencia. Este archivo explica el orden.

## Objetivo

Entregar el módulo que separa el objeto seleccionado con **SAM 2.1 Tiny**, obtiene
su representación con **DINOv2 ViT-S/14** y ordena modelos candidatos de páginas
externas por similitud visual. La aplicación devuelve enlaces; disponer de una
miniatura no garantiza disponer del archivo 3D para la escena.

El desarrollo y las pruebas funcionales se harán primero en **CPU local**.
En el producto, SAM y DINO se ejecutarán en el **servidor**. Elegir CPU para
desarrollar no cambia esa arquitectura ni acredita su rendimiento en CUDA.

## Orden de ejecución

| Fase | Tareas | Estado al reorganizar | Condición de cierre |
| --- | --- | --- | --- |
| 0 · Base existente | T00–T02, T06–T08, T09-L, T10 | Terminada con evidencia local/documental | Conservar lo probado; CUDA y aceptación P3 siguen aparte |
| 1 · Recorte y DINO CPU | T11 → T12 → T13 | Completada | Embeddings reales y prueba de cordura |
| 2 · Candidatos externos | T14 → T15 → T16 → T17 | Completada | Imágenes y vectores trazables, caché e integridad |
| 3 · Ranking | T18 → T19 → T20 | T18/T19 completas; T20 espera etiquetas del equipo | Ranking probado y evaluación con datos reales |
| 4 · Entrega local | T21-L → T22-L → T23 → T25-L → T26-L → T27-L | Implementada; ensayo local documentado | Flujo completo CPU, errores, mediciones y arranque |
| 5 · Servidor y equipo | T03 → T04 → T05; T09-P, T21-P, T22-P, T25-P–T27-P | Diferida | CUDA, API, red y reproducción por otro integrante |

**Desarrollo local implementado; pruebas pendientes con el equipo y datos T20.**
Los IDs se conservan para no perder la relación
con commits y mediciones anteriores. `-L` identifica el entregable local y `-P`
la validación con P3/servidor. La tarea completa exige ambos cuando aplique.
Si una dependencia externa bloquea una prueba, se registra antes de continuar
con una tarea independiente; no se presenta el bloqueo como una fase terminada.

## Flujo que dejaremos probado localmente

```text
Imagen RGB + selección
         │
         ▼
     SAM 2 CPU ──► máscara ──► recorte RGB ──► DINO CPU ──► vector consulta
                                                                    │
Candidatos externos suministrados por P3                             │
         │                                                          │
         ▼                                                          ▼
 imágenes/vistas ──► preparación ──► DINO CPU / caché ──► ranking coseno
                                                             │
                                                             ▼
                                           resultados con enlace y procedencia
```

Durante las pruebas podemos usar una captura de candidatos reales, con origen y
permisos documentados. Eso permite repetir resultados sin conectarse a la MSI.
Los fixtures sintéticos sirven para validadores/ranking, nunca sustituyen la
inferencia ni una evaluación real. El lote candidato puede cambiar en cada consulta;
no se limita el producto a una colección manual ni a carpetas del usuario.

## Qué cambia frente al plan anterior

- **CUDA pasa al final:** T03–T05 conservan lo preparado y la aceptación pendiente.
  No hay que esperar a Ángel para recortar imágenes, implementar DINO CPU o ranking.
- **T09 se divide:** segmentación/PNG ya están probados; falta la aceptación de
  Manuel. Las firmas de embedding y búsqueda actuales son reservas, y la propuesta
  debe concretar cómo recibe candidatos antes de pedir aprobación final.
- **T14–T17 cambian de enfoque:** sustituyen colección fija/renders obligatorios
  por recepción de imágenes de fuentes externas, preparación y caché de vectores.
  Blender y disponer de GLB no son prerrequisitos para comparar miniaturas.
- **Integración y cierre se separan:** primero pruebas dentro de IA; después
  pruebas HTTP, red, GPU y aceptación por otro integrante. La evidencia CPU se
  conserva separada de la GPU y de las pruebas controladas con dobles.
- **Orden por dependencias:** el avance se mide con aceptación y evidencia,
  no con los días del calendario original ni un porcentaje estimado.

Los documentos de raíz [PLAN_P4.md](../PLAN_P4.md),
[PLAN_EQUIPO.md](../PLAN_EQUIPO.md) y [CONTRATOS_API.md](../CONTRATOS_API.md)
son antecedentes compartidos. Este plan actualiza el trabajo de P4 por autorización
de Brandon; no cambia endpoints ni compromisos de otros integrantes.

## Límites entre áreas

| P4 / Brandon (`ai/`) | P3 / Manuel (`backend/` y contratos) |
| --- | --- |
| SAM, recorte, DINO y ranking | Buscar en fuentes externas y obtener candidatos |
| Validar imágenes recibidas y metadatos internos | Descargar/validar URLs e imágenes de fuentes |
| Caché visual versionada y errores del módulo | API, tareas, archivos, acceso y conectividad |
| Proponer formatos y probar el flujo CPU | Aceptar tipos y conectar clientes con IA |
| Preparar pruebas y comandos CPU/CUDA | Coordinar despliegue y entrega de modelos accesibles |

El conector actual de Sketchfab recibe texto. Sigue pendiente acordar con Manuel
cómo se obtiene el lote de candidatos a partir de la referencia del usuario
(términos, filtros u otra estrategia). DINO compara imágenes ya disponibles;
no es un buscador de internet ni genera por sí solo la consulta textual.
Esa decisión no bloquea T11, pero sí condiciona el flujo final desde el cliente.

## Dependencias y comprobaciones

- Reutilizar `ai/.venv-sam2` para inferencia CPU y `ai/.venv-tests` para pytest.
  Antes de añadir paquetes: revisar compatibilidad, presentar versiones y pedir
  aprobación. T12 ya fijó revisión/pesos oficiales DINO y comprobó inferencia real.
- GPU: se conserva la combinación aprobada en
  [PROPUESTA_ENTORNO.md](PROPUESTA_ENTORNO.md), sin instalarla localmente.
  La MSI tiene `.venv-gpu` en la raíz con Python 3.12.16. T03 aún necesita su
  ejecución CUDA real, informe y lock; T04 medirá SAM y DINO en ese dispositivo.
- Pruebas reales necesitan pesos e imágenes disponibles con procedencia conocida.
  Si faltan datos para T13/T20/T21-L, registrar lo que falta sin inventar resultados.
- Cada tarea: prueba pertinente → registro → casilla aceptada → commit.
  Push al cerrar cada fase local. Consultar estado remoto sin rebase automático
  de la rama compartida. Graphify puede publicarse solo en la rama IA, separado
  de los cambios destinados a main; preparar allí un PR sin esos archivos.

## Qué quedará pendiente al terminar las fases locales

1. Ejecutar instalador y pruebas CUDA en la MSI; resolver cualquier incompatibilidad
   real y medir tiempos/VRAM. Es validación, no solo cambiar `device` a CUDA.
2. Aceptación de tipos por Manuel y conexión de candidatos reales/API/archivos.
3. Prueba de red y flujo desde web/móvil, más reproducción por otro integrante.
4. Revisión y PR limpio para integración, con limitaciones conocidas.

Por tanto, **listo para desplegar** exige haber demostrado el flujo CPU y tener
comandos/recursos claros; no significa que el producto esté integrado ni que solo
falte pegar una URL.

## SAM 3D y opcionales

T10 ya investigó **SAM 3D Objects**: su configuración oficial documentada pide
32 GB de VRAM y la MSI tiene unos 8 GB. La generación sigue como
**servicio no disponible**. No se ha ejecutado ni se promete una versión de menor
memoria. Activarla requiere una evaluación aparte de hardware, entorno, pesos y
salidas; no es la última conexión pendiente del buscador.
Fuentes y alcance: [NOTAS_SAM3D.md](NOTAS_SAM3D.md).

T24 (fotograma de video) se considera después del flujo de imagen y solo si sobra
tiempo. No bloquea la entrega de búsqueda visual.

## Punto de prueba disponible

`ai/.venv-sam2/bin/python -m ai.demo` → http://127.0.0.1:8765.
También `python -m ai.pipeline` con el intérprete CPU documentado genera imágenes
y JSON en resultados/demo. Demo HTTP local validada con candidatos reales;
no sustituye las pruebas de FastAPI/clientes ni la revisión visual en navegador.
La evaluación por conteos ya tiene CLI (`ai.evaluate`), pendiente del conjunto real.
