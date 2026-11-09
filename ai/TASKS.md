# TASKS.md — Lista de tareas de P4 (IA y catálogo), orden estricto, una a la vez

Responsable: Brandon (P4). Carpeta propia: `ai/`. Rama acordada con Brandon:
`feature/ai-exploracion` (trabajo y publicación; instrucción del 5 de noviembre).
Alcance y criterios de cada etapa: `PLAN_P4.md` (raíz) y `ai/PLAN_P4_IA.md`. Contratos actuales: `CONTRATOS_API.md` (raíz).

Leyenda: `[ ]` pendiente · `[x]` hecha con evidencia · `[NEEDS USER]` requiere algo de Brandon o del equipo (implementa lo posible, anota el bloqueo y sigue con la siguiente tarea que no dependa de él).

## Reglas de trabajo (obligatorias)

1. **Una tarea a la vez, en orden.** No saltar tareas ni empezar la siguiente sin cerrar la actual. Si una tarea queda bloqueada, márcala como bloqueada en `PROGRESS.md` y avisa antes de continuar.
2. **Antes de codear:** `git fetch && git rebase origin/main`. Si falla por credenciales, anótalo y trabaja en local sin subir nada.
3. **Después de CADA tarea**, en este orden:
   - Validación: `python -m py_compile ai/*.py` y `python -m pytest ai/tests -q` (a partir de T01 existen las pruebas). Si una tarea solo es de investigación o medición, su evidencia es el archivo indicado en su criterio.
   - Marcar `[x]` aquí **solo** si la validación pasó. Un fallo se queda `[ ]` con el error anotado.
   - Anotar en `ai/PROGRESS.md`: fecha, ID, comando ejecutado, resultado, limitaciones.
   - Commit: `ai(T0X): descripción corta`. Un commit por tarea.
   - Push al terminar cada FASE, con sus tareas aceptadas y validación en verde.
     Si falla la autenticación de Git, conservar los commits locales y no subir.
4. **Nunca instalar dependencias** sin presentar versiones y recibir aprobación (ver T02).
5. **Nada fuera de `ai/`.** Si una tarea necesita otra carpeta (`backend/`, `.gitignore`, contratos), se pide el cambio a su dueño y no se hace.
6. **Datos y pesos fuera de Git:** checkpoints, `.venv*`, renders, `graphify-out/`, imágenes privadas.
7. **Resultados reales o explícitamente marcados.** Nada de datos de ejemplo presentados como salida de modelo. Errores esperados: «servicio no disponible».

---

## Estado base

- [x] **T00 Base y auditoría CPU (E0).** Completada: comparación de carpetas, copia local de SAM y checkpoint Tiny en `ai/sam2/`, ruta corregida en `requirements-sam2.txt`, prueba CPU ejecutada y documentada en `ai/MEDICIONES.md`. Limitación: el rectángulo fijo seleccionó fondo, no el objeto.

---

## FASE 1 — Entorno del servidor (E1)

- [ ] **T01 Diagnóstico del servidor (E1.1).** Crear `ai/tests/` con una prueba mínima que pase (`test_smoke.py`) para fijar la validación. Registrar en `ai/MEDICIONES.md`: GPU, driver, sistema operativo, versión de Python, RAM y VRAM. Confirmar con Manuel en qué equipo correrá la IA.
  *Aceptación:* `ai/MEDICIONES.md` tiene la salida de `nvidia-smi`, `python --version` y memoria; validación en verde.
  [NEEDS USER] Recibidas las salidas de Angel: driver 610.78, 8188 MiB de VRAM
  y Python 3.12.1. Brandon confirma que la IA correrá en Ubuntu sobre WSL.
  **Bloqueada y pospuesta por Brandon el 6 de noviembre:** Angel todavía no
  tiene WSL/Ubuntu instalado. Primero debe prepararse ese sistema y, después,
  obtener el diagnóstico. Las salidas recibidas no acreditan un entorno Linux.
  El entorno local de pruebas está en verde. Por solicitud explícita de Brandon,
  se reinstaló el entorno CPU dentro de este proyecto: ya no depende del antiguo.
  Ver `PROGRESS.md`. T01 sigue `[ ]`; Brandon autorizó preparar únicamente la
  propuesta documental T02 el 5 de noviembre, sin instalar ni ejecutar T03.

- [x] **T02 Propuesta de versiones (E1.2), sin instalar.** Consultar la documentación oficial de PyTorch, SAM 2 y DINOv2. Escribir en `ai/PROPUESTA_ENTORNO.md` la combinación compatible con el driver: versión de PyTorch, CUDA, numpy, pillow y los comandos exactos.
  *Aceptación:* propuesta revisada; no se modifica ningún entorno.
  **Aprobada por Brandon el 6 de noviembre de 2026:** Python 3.12.x,
  torch 2.14.1 + torchvision 0.29.1/cu126, NumPy 2.4.6, Pillow 13.0.0 y la lista
  de `ai/PROPUESTA_ENTORNO.md`. No se requiere volver a pedir esa autorización.
  No se ejecutaron instalaciones GPU. Manuel deberá confirmar solo si se comparte
  ese entorno con backend. T03 depende del diagnóstico WSL de T01.

- [ ] **T03 Entorno CUDA aislado (E1.2).** Crear `ai/.venv-gpu` (fuera de Git), instalar la combinación aprobada en T02 y generar `ai/requirements-gpu.txt` nuevo. No modificar `requirements-sam2.txt`, que fija PyTorch CPU.
  *Aceptación:* `python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"` muestra `True` y la GPU. Si no hay GPU, la tarea queda `[ ]` y se acuerda CPU con P3.
  **Bloqueada por T01:** WSL/Ubuntu del servidor aún no está instalado. T02
  conserva su aprobación; T03–T05 quedan pendientes sin ejecutar instalaciones.

- [ ] **T04 Carga de modelos en GPU y medición (E1.3).** Cargar SAM 2.1 Tiny y DINOv2 ViT-S/14 en CUDA. Medir tiempo de carga, tiempo de inferencia (con calentamiento y `torch.cuda.synchronize()`) y VRAM pico con `torch.cuda.max_memory_allocated()`.
  *Aceptación:* cifras en `ai/MEDICIONES.md` con comando, repeticiones y dispositivo.

- [ ] **T05 Comando de arranque reproducible (E1.4).** Crear `ai/README.md` con los comandos para activar `ai/.venv-gpu`, cargar los modelos y ejecutar la prueba. No depender de `asset-finder`.
  *Aceptación:* los comandos funcionan copiados tal cual desde una terminal limpia.

---

## FASE 2 — Segmentación reutilizable (E2)

- [x] **T06 `segment()` reutilizable (E2.1).** Crear `ai/segmentation.py` con `segment(image, box_xyxy, points)` → máscara y puntuación. Cargar el modelo una sola vez por proceso y permitir elegir CPU o CUDA. Extraerlo de `prueba_sam2.py` sin copiar la lógica dos veces.
  *Aceptación:* `ai/tests/test_segmentation.py` pasa; otro script importa `segment` sin copiar código.
  **Completada en CPU el 6 de noviembre:** 19 pruebas pasan, incluida inferencia
  SAM real y caché de modelo. CUDA es seleccionable y falla explícitamente si no
  está disponible; todavía no está validada en GPU. T07/T08 siguen pendientes.

- [x] **T07 Validación de entradas (E2.2).** Rechazar: imagen que no sea RGB, cajas con `x1 >= x2` o `y1 >= y2`, coordenadas fuera de la imagen, puntos con `label` distinto de 0 o 1, y listas vacías de selección.
  *Aceptación:* pruebas para cada caso, con error claro.
  **Completada el 9 de noviembre:** 28 pruebas pasan, con casos inválidos que
  comprueban que no se carga SAM. RGB uint8; cajas dentro de [0, ancho/alto],
  puntos dentro de [0, ancho/alto); label entero 0/1; se requiere caja o puntos.
  `points=[]` es opcional si hay caja válida; `box_xyxy=[]` siempre es inválido.

- [x] **T08 Prueba de selección real (E2.3).** Probar con `ai/prueba.jpeg`: un rectángulo sobre la silla y una selección con puntos positivos y negativos. Verificar que la máscara no esté vacía, que su forma coincida con la imagen y guardar una visualización de la superposición.
  *Aceptación:* imágenes de resultado en `ai/resultados/` (fuera de Git) y una línea en `PROGRESS.md` con lo observado, incluido si falla.
  **Completada el 9 de noviembre:** `prueba_seleccion.py` produjo ambas máscaras,
  recortes y superposiciones en `ai/resultados/T08/`. Revisión visual: silla
  amarilla visible seleccionada, bancos grises excluidos; sin métricas de precisión.

- [ ] **T09 Servicio temprano para Manuel (E2.4).** Crear `ai/service.py` con firmas estables. Lo no implementado responde con error explícito «servicio no disponible». Si Manuel necesita datos de prueba, usar fixtures separados con `stub: true`.
  *Aceptación:* `ai/service.py` importable; Manuel confirma por escrito los tipos de entrada y salida.
  [NEEDS USER] Acordar con Manuel el formato de máscara (PNG o arreglo) y de errores.

- [ ] **T10 Investigación SAM 3D (I1), máximo 2 horas.** Revisar los requisitos oficiales actuales y las licencias. Documentar en `ai/NOTAS_SAM3D.md`: requisitos, hardware disponible, posibles alternativas y conclusión.
  *Aceptación:* conclusión escrita con fuentes; sin instalar nada pesado. Resultado válido: «no viable con 8 GB; servicio no disponible».

---

## FASE 3 — Recorte y embeddings (E3)

- [ ] **T11 Preparación del recorte (E3.1).** Crear `ai/preprocess.py`: aplicar máscara, recortar al objeto y componer sobre fondo RGB uniforme. Esta preparación se usará igual en consultas y en el catálogo.
  *Aceptación:* pruebas con máscara vacía, máscara completa y máscara normal.

- [ ] **T12 `embed()` con DINOv2 (E3.2).** Crear `ai/embedding.py`: DINOv2 ViT-S/14, modo evaluación, sin gradientes, vector normalizado. Guardar pesos y configuración de preprocesado usados.
  *Aceptación:* vector finito, dimensión constante, norma 1; rechaza máscaras vacías.

- [ ] **T13 Prueba de cordura (E3.3).** Comparar dos fotos de la misma silla contra una foto de otro objeto. Registrar las similitudes **tal como salgan**, aunque no cumplan lo esperado.
  *Aceptación:* resultados en `PROGRESS.md`; no se declara precisión sin medición.

---

## FASE 4 — Catálogo e índice (E4)

- [ ] **T14 Lista del catálogo.** Reunir 20–30 assets en `ai/catalogo/assets.json` con nombre, origen, licencia y ruta del archivo. Campos desconocidos = `null`. `model_available` solo es `true` si el archivo 3D existe y es accesible.
  *Aceptación:* el JSON valida; ningún dato inventado.
  [NEEDS USER] Fuente y licencia del catálogo, o confirmación de qué modelos ya tienen.

- [ ] **T15 Renders de vistas (E4.2).** Si hay GLB, renderizar 4–6 vistas por asset con Blender en segundo plano, con encuadre y fondo consistentes. Si solo hay miniaturas, marcarlo y omitir este paso.
  *Aceptación:* vistas en `ai/catalogo/vistas/` (fuera de Git) y vínculo vista → asset en el JSON.
  [NEEDS USER] Confirmar si hay GLB descargables y la versión de Blender disponible.

- [ ] **T16 Indexador (E4.3).** Crear `ai/index_catalog.py`: vectores en `.npy` y metadatos JSON con asset, vista, versión de índice, modelo/pesos, dimensión y preprocesado.
  *Aceptación:* un comando reconstruye el índice completo; no se recalcula en cada consulta.

- [ ] **T17 Verificación del índice (E4.4).** Comprobar que cada vector tiene metadatos, que los IDs son únicos, que los archivos existen y que un índice de otra versión se rechaza.
  *Aceptación:* pruebas en `ai/tests/test_index.py`.

---

## FASE 5 — Búsqueda y evaluación (E5)

- [ ] **T18 `search()` (E5.1).** Crear `ai/search.py`: similitud coseno con NumPy, una mejor vista por asset y top-k sin repetir assets.
  *Aceptación:* pruebas con índice vacío, `k` inválido y `k` mayor que el catálogo.

- [ ] **T19 Formato de respuesta (E5.2).** Traducir el resultado al formato de `docs/CONTRATOS_API.md`, con `similarity_score` tratado como ranking y `model_available` real.
  *Aceptación:* la salida coincide con el ejemplo del contrato en claves y tipos.

- [ ] **T20 Evaluación (E5.3).** Probar 10–15 consultas con referencia conocida y 3–5 sin coincidencia clara. Registrar top-1 y top-5 y tiempos en `ai/EVALUACION.md`.
  *Aceptación:* resultados reproducibles; no se presentan como porcentaje de acierto.

---

## FASE 6 — Integración y caché (E6)

- [ ] **T21 Integración con Manuel (E6.1).** Probar imagen → selección → máscara → embedding → assets con la API real (o un mock acordado).
  *Aceptación:* una captura del flujo completo con resultados reales en `PROGRESS.md`.
  [NEEDS USER] Coordinar la prueba con Manuel.

- [ ] **T22 Errores reales (E6.2).** Verificar: selección inválida, pesos ausentes, índice incompatible y memoria insuficiente. Ningún error se muestra como éxito.
  *Aceptación:* cada error tiene mensaje y prueba.

- [ ] **T23 Caché de consultas (E6.3).** Clave: contenido de la imagen, selección, pesos y preprocesado. No cachear errores.
  *Aceptación:* pruebas de acierto e invalidación al cambiar la selección o el modelo.

- [ ] **T24 Fotograma de video (E6.4), opcional.** Solo si sobra tiempo: extraer un fotograma con FFmpeg y usar el mismo flujo.
  *Aceptación:* prueba con un video corto; sin prometer soporte completo.

---

## FASE 7 — Cierre (E7)

- [ ] **T25 Medición final (E7.1).** Medir por separado carga, segmentación, preparación, embedding y búsqueda, con dispositivo, repeticiones y VRAM.
  *Aceptación:* tabla en `ai/MEDICIONES.md`.

- [ ] **T26 Reproducibilidad (E7.2).** Actualizar `ai/README.md` y las dependencias para que otro integrante reproduzca el módulo.
  *Aceptación:* otra persona ejecuta los comandos sin ayuda.

- [ ] **T27 Ensayo y PR de revisión (E7.3).** Ejecutar una consulta real y los errores esperados. Abrir PR pequeño para revisión por otro integrante.
  *Aceptación:* PR abierto con descripción, validación y limitaciones conocidas.

---

## Bloqueos externos (no son tareas de código)

- [ ] **B01 Publicación GitHub.** Fetch funciona, pero push CLI falla por
  credenciales HTTPS. El conector muestra permiso push de la cuenta, pero su
  intento de crear el árbol devolvió 403 `Resource not accessible by integration`.
  No hay publicación nueva; falta autenticar Git o habilitar escritura de la integración.
- [ ] **B02 `graphify-out/` en `.gitignore`.** Lo gestiona P3 (dueño de la raíz).
  [NEEDS USER] Pedir a Manuel que lo agregue.
- [ ] **B03 Integración con main.** `origin/main` avanzó hasta `350a42e`.
  La previsualización de merge detecta conflicto en README compartido y elimina
  los antiguos planes/contratos de raíz. Coordinar la integración con P3;
  no se modificaron esos archivos ni se reescribió la rama publicada.
