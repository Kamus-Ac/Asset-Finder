# PLAN_P4_IA — Cómo trabajaremos la IA de Asset Finder

Responsable: **Brandon / P4**. Base: `Asset-Finder/`. Código propio: `ai/`.
Fuentes del alcance: [PLAN_P4.md](../PLAN_P4.md), [PLAN_EQUIPO.md](../PLAN_EQUIPO.md)
y [CONTRATOS_API.md](../CONTRATOS_API.md). Este archivo es la bitácora operativa;
`PLAN_P4.md` describe qué entregar. No modifica contratos ni confirma las
simplificaciones que el equipo aún debe acordar.

## Cómo marcaré el progreso

- `[ ]` pendiente, `[x]` terminado con evidencia. Estados: `queued`, `running`,
  `completed`, `failed`. Solo marcaré tareas que haya ejecutado y comprobado.
- Antes de cada sesión leeré este plan y el estado de Git; trabajaré en una rama
  `feature/ai-exploracion`, según la indicación posterior de Brandon. Antes de
  cambiar dependencias presentaré las versiones y
  pediré aprobación al dueño, sin reutilizar la instalación CPU como entorno CUDA.
- Cada tarea seguirá: inspección → cambio pequeño → prueba real → registro del
  resultado y limitaciones → actualización de esta lista. Un fallo se anotará
  con su error; no avanzará a `completed` por haber escrito código.
- Al cerrar una sesión indicaré qué terminó, qué falta y el siguiente ID.
  Guardaré tiempos/VRAM en [MEDICIONES.md](MEDICIONES.md), con comando y entorno.
- Coordinaré firmas con Manuel desde E2. Los mensajes/PR externos se prepararán
  para revisión; no enviaré comunicaciones al equipo sin indicación de Brandon.

## Tablero

| Etapa | Estado | Resultado para cerrar |
| --- | --- | --- |
| E0 · Elegir base y auditar CPU | completed | Comparación, recursos recuperados y prueba documentada |
| E1 · Entorno del servidor | queued | SAM/DINO ejecutables en CUDA, o alternativa CPU documentada |
| E2 · Segmentación e interfaz temprana | queued | `segment` reutilizable y selección correcta |
| E3 · Recorte y embedding | queued | `embed` real y preparación consistente |
| E4 · Catálogo e índice | queued | 20–30 assets con metadatos y vectores versionados |
| E5 · Ranking y evaluación | queued | `search` real, top-k por asset y métricas |
| E6 · Integración y caché | queued | Flujo real con P3, errores y caché verificados |
| E7 · Cierre y demo | queued | Arranque reproducible y pruebas por otro integrante |
| I1 · Investigación SAM 3D | queued | Conclusión documentada en un máximo de 2 horas |

## E0 — Base correcta y punto de partida

- [x] E0.1 Comparar ambas carpetas: `Asset-Finder` tiene historial del equipo,
  documentos, backend y prueba IA; `asset-finder` conserva el entorno local CPU.
  Comparación y decisión: [README de IA](README.md).
- [x] E0.2 Mantener `Asset-Finder` como proyecto de desarrollo. La dependencia
  temporal del entorno antiguo se eliminó: ahora se usa `ai/.venv-sam2` local.
- [x] E0.3 Copiar localmente el código SAM y el checkpoint Tiny a `ai/sam2/`,
  excluidos de Git. Verificar hash del checkpoint. No copiar entornos virtuales.
- [x] E0.4 Cambiar solo la ruta editable obsoleta de `requirements-sam2.txt`
  a `./sam2`, resoluble desde `ai/`. Conservar las versiones CPU existentes.
- [x] E0.5 Ejecutar el script del proyecto actual con el entorno CPU antiguo;
  validar tamaños, máscara binaria y canal alfa. Evidencia: [MEDICIONES.md](MEDICIONES.md).
- [x] E0.6 Revisar visualmente la selección: el rectángulo fijo seleccionó
  fondo/pared, no un objeto útil. El arranque funciona; la calidad queda pendiente en E2.
- [x] E0.7 Registrar que este entorno no tiene CUDA disponible. `git fetch`
  falla por credenciales HTTPS; actualización remota y rebase quedan pendientes.

## E1 — Entorno real del servidor (día 1 orientativo)

- [ ] E1.1 Con P3, identificar el servidor donde correrá la IA y comprobar
  GPU, driver, sistema operativo, Python y memoria. Brandon confirma la laptop
  de Angel con Ubuntu/WSL; salida NVIDIA y Python recibidas. Falta identificar
  la distribución Ubuntu y comprobar memoria/Python dentro del WSL objetivo.
- [ ] E1.2 Consultar fuentes oficiales de PyTorch/SAM/DINO; proponer versiones
  compatibles y comandos antes de instalar. Con aprobación, crear entorno nuevo
  bajo `ai/`, separado de CPU; registrar dependencias reproducibles sin rutas personales.
- [ ] E1.3 Verificar `torch.cuda.is_available()`, dispositivo y versiones reales.
  Registrar carga SAM y DINO, tiempos y pico de VRAM; considerar calentamiento y
  sincronización CUDA al medir. Si GPU no está disponible, acordar CPU con P3.
- [ ] E1.4 Dejar un comando de arranque que use el entorno de `Asset-Finder`,
  con CUDA en el servidor de Angel. La prueba CPU local ya es independiente
  de la carpeta antigua; esto no completa el arranque CUDA del servidor.

**Cierre:** otra sesión puede cargar los modelos con los comandos documentados;
el modo CPU/GPU y los recursos disponibles quedan explícitos.

## E2 — Segmentación reutilizable e interfaz temprana (día 2)

- [x] E2.1 Crear `ai/segmentation.py`: `segment(image, box_xyxy, points)` sin imagen
  ni rectángulo fijos. Acordar tipos de retorno (máscara/puntuación) con P3;
  cargar el modelo una vez por proceso y permitir configurar CPU/CUDA.
- [ ] E2.2 Validar RGB, dimensiones, coordenadas xyxy, puntos positivos/negativos
  y selecciones inválidas según el contrato; conservar la correspondencia con
  la imagen normalizada por orientación. No cambiar unidades silenciosamente.
- [ ] E2.3 Probar selección manual de un objeto identificable con rectángulo
  y con puntos. Verificar máscara no vacía, forma, recorte y superposición visual.
- [ ] E2.4 Publicar temprano `ai/service.py` con firmas estables para P3.
  Operaciones no implementadas: error explícito «servicio no disponible».
  Si P3 requiere stubs, usar fixtures separados y `stub: true`, nunca resultados
  ficticios presentados como inferencia real ni cambios silenciosos del contrato.

**Cierre:** otro script importa y usa `segment` sin copiar código; los casos
inválidos tienen errores claros. Ejecutar I1 durante el día 2 con tiempo acotado.

## E3 — Preparación del recorte y DINO (día 3)

- [ ] E3.1 Crear `ai/preprocess.py`: aplicar máscara, recortar y componer fondo
  RGB uniforme. Reutilizar la preparación acordada en consultas y vistas del catálogo.
- [ ] E3.2 Crear `ai/embedding.py`: DINOv2 ViT-S/14 real, modo evaluación,
  inferencia sin gradientes y vector normalizado. Registrar dimensión real,
  pesos y configuración; rechazar máscaras vacías y vectores inválidos.
- [ ] E3.3 Comparar fotos del mismo objeto y de objetos distintos; registrar
  las similitudes observadas aunque no cumplan la hipótesis esperada. No inventar precisión.

**Cierre:** `embed(image)` devuelve vectores finitos, de dimensión consistente
y norma unitaria; resultados y tiempos quedan registrados.

## E4 — Catálogo y versionado (día 3–4)

- [ ] E4.1 Reunir 20–30 assets con origen y licencia; desconocidos van `null`.
  `model_available` solo será verdadero con archivo real accesible y entregable
  por P3; si solo hay miniatura, será falso.
- [ ] E4.2 Si hay GLB, renderizar 4–6 vistas por asset con Blender, encuadre y
  fondo consistentes. Conservar el vínculo vista → asset y la preparación usada.
- [ ] E4.3 Crear `ai/index_catalog.py`: vectores `.npy` y metadatos JSON con
  asset/vista, versión de índice, modelo/pesos, dimensión y preprocesado.
  Usar NumPy como propone PLAN_P4; confirmar esta simplificación con el equipo.
- [ ] E4.4 Verificar correspondencia entre vectores y metadatos, IDs únicos,
  archivos disponibles y rechazo de índices incompatibles. Mantener datos
  generados fuera de Git; acordar con P3 cualquier exclusión global faltante.

**Cierre:** el índice se reconstruye con un comando documentado y no se recalcula
el catálogo entero al hacer una consulta.

## E5 — Búsqueda y evaluación (día 4)

- [ ] E5.1 Crear `ai/search.py`: `search(vector, k)`, coseno, agrupación por
  asset tomando su mejor vista y top-k sin repetir el mismo asset.
- [ ] E5.2 Probar índice vacío, k inválido o mayor que el catálogo, dimensiones
  incompatibles y varias vistas del mismo asset. Acordar con P3 cómo traducir
  resultados internos al formato de `CONTRATOS_API.md`.
- [ ] E5.3 Evaluar 10–15 consultas con referencia conocida y 3–5 sin coincidencia
  clara. Registrar conjunto, top-1/top-5 y tiempos; separar consultas de las
  vistas indexadas. No presentar similitud como porcentaje de acierto.

**Cierre:** ranking verificable con datos reales y evaluación reproducible,
incluyendo limitaciones cuando el catálogo no contenga el objeto.

## E6 — Integración con P3 y caché (día 5)

- [ ] E6.1 Con Manuel, probar imagen → selección → máscara → embedding → assets
  mediante API real o mock explícitamente acordado. P3 implementa endpoints,
  estados `queued/running/completed/failed`, archivos y trabajador GPU serializado.
- [ ] E6.2 Verificar errores de selección, modelo/pesos ausentes, índice
  incompatible y memoria insuficiente; evitar fallos presentados como éxito.
- [ ] E6.3 Añadir caché de consulta con claves que incluyan contenido/selección,
  modelo/pesos y preprocesado. Probar acierto e invalidación; no cachear errores.
- [ ] E6.4 Solo si sobra tiempo, extraer un fotograma con FFmpeg y reutilizar
  el mismo flujo, sin prometer soporte de video completo.

**Cierre:** prueba conjunta documentada, con archivos y resultados reales;
ningún cambio de contrato ni carpeta ajena se hace sin coordinación.

## I1 — SAM 3D: investigación, no dependencia del MVP (día 2)

- [ ] I1.1 Revisar requisitos y licencias oficiales actuales; contrastar con
  el servidor real y posibles alternativas, en un máximo de 2 horas.
- [ ] I1.2 Guardar fuentes, hardware y conclusión en `ai/NOTAS_SAM3D.md`.
  No instalar ni descargar recursos grandes sin revisar viabilidad y aprobación.
  Mientras no haya validación: **servicio no disponible**.

**Cierre:** conclusión verificable; no requiere un generador 3D funcionando.

## E7 — Medición final, documentación y demo (día 6–7)

- [ ] E7.1 Medir por separado carga, segmentación, preparación, embedding y
  búsqueda; registrar dispositivo, repeticiones, VRAM y límites de la medición.
- [ ] E7.2 Actualizar `ai/README.md`, dependencias y comandos de prueba para
  que otro integrante reproduzca el módulo desde el entorno acordado.
- [ ] E7.3 Ensayar una consulta real y los errores esperados; dejar PR pequeños
  para revisión por otro integrante. Registrar quién pudo reproducirlo.

**Cierre:** no basta con código escrito: el módulo se prueba, documenta e integra.

## Última actualización — 6 de noviembre de 2026

- **Terminado:** E0 completo; comparación, copia local de SAM, ruta corregida,
  prueba CPU y validación de archivos. Entorno CPU propio instalado con las
  mismas versiones aprobadas, probado sin accesos a la carpeta antigua.
  Resultados en `MEDICIONES.md`; seguimiento de tareas en `TASKS.md`.
- **T02 aprobada:** Brandon autoriza la combinación de `PROPUESTA_ENTORNO.md`.
  No se instaló CUDA. Angel todavía no tiene WSL/Ubuntu; Brandon pidió posponer
  su preparación y diagnóstico. La aprobación GPU sigue vigente.
- **Cambio de alcance remoto:** main ahora prioriza candidatos externos y tiene
  conector Sketchfab. Las etapas de catálogo manual deben revisarse con P3 antes
  de implementarse; el diagnóstico T01 y la preparación de modelos siguen siendo útiles.
- **Falta:** entorno propio CUDA, selección correcta, funciones reutilizables,
  DINO, catálogo, búsqueda, integración, caché y evaluación; I1 sin iniciar.
- **T06 completada en CPU:** módulo reutilizable, modelo en caché y prueba real;
  validación de entradas y selección visual permanecen en T07/T08.
- **Siguiente tarea local:** T07, validar entradas; no se ejecutó en esta sesión.
- **Tarea externa pendiente:** **T01 / E1.1**, preparar Ubuntu/WSL de Angel y
  después recopilar su diagnóstico. No se marca completada por las pruebas CPU.
  El fallo de autenticación Git también debe resolverse antes de sincronizar ramas.
