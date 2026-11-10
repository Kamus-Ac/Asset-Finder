# TASKS — IA y ranking visual · Brandon / P4

Reorganizado con autorización de Brandon el **10 de noviembre de 2026**.
Área: `ai/`. Rama de trabajo y publicación: **`feature/ai-exploracion`**.
Plan operativo: [PLAN_P4_IA.md](PLAN_P4_IA.md). Evidencia histórica:
[PROGRESS.md](PROGRESS.md) y [MEDICIONES.md](MEDICIONES.md).

**Siguiente tarea ejecutable: T13.** Recorte y DINO reales probados en CPU.
Primero completamos y probamos el flujo en CPU; después lo validamos en el servidor.
Los IDs originales se conservan, aunque cambie su orden. Los sufijos `-L` y `-P`
separan entregas locales y aceptación con P3/servidor; no duplican tareas terminadas.

Leyenda: `[x]` aceptada con evidencia · `[ ]` pendiente · `[NEEDS USER]`
depende de datos, acceso o confirmación externa. Una tarea bloqueada no bloquea
otras que sean independientes. No marcar la tarea principal completa si falta un subcriterio.

## Reglas de trabajo

1. **Una tarea a la vez, siguiendo el orden de estas fases y sus dependencias.**
   Registrar el bloqueo en PROGRESS y avisar antes de seguir con una independiente.
   T03–T05 y T09-P quedan diferidas expresamente; no impiden empezar T11.
2. **Git:** revisar `git status` y consultar `git fetch origin` antes de implementar.
   Comparar con la rama remota IA y con main. No hacer rebase automático de esta
   rama compartida ni reescribir sus commits. Integrar main en una operación
   separada y revisada, conservando el trabajo y avisando de conflictos.
   No hacer commits en main, force push ni subir a otra rama por defecto.
3. **Después de cada tarea de código:** ejecutar desde la raíz
   `ai/.venv-tests/bin/python -m py_compile ai/*.py` y
   `ai/.venv-tests/bin/python -m pytest ai/tests -q`, más la prueba real pertinente.
   Una omisión de inferencia por falta de pesos no acredita funcionamiento del modelo.
   Para documentación: revisar consistencia, enlaces y `git diff --check`; no repetir
   inferencia por editar texto. Registrar comando, resultado y límites en PROGRESS,
   actualizar esta lista y hacer un commit por tarea: `ai(TXX): descripción`.
   Publicar en la rama IA al cerrar cada fase local, sin esperar las fases del
   servidor, o cuando Brandon lo solicite. Si falla autenticación, conservar commits.
4. **Dependencias:** presentar versiones y obtener aprobación antes de instalar
   paquetes nuevos o cambiar los existentes. Las aprobaciones anteriores siguen
   vigentes para sus combinaciones exactas. Conservar separados CPU, pruebas y GPU;
   no cambiar `requirements-sam2.txt` para simular un entorno CUDA.
5. **Área propia:** editar `ai/`. Backend, fuentes externas, endpoints y contratos
   pertenecen a Manuel; preparar una propuesta concreta si hace falta cambiarlos.
   Los planes de raíz son antecedentes: este orden sustituye para P4 las partes
   antiguas de catálogo manual, calendario fijo y GPU como prerrequisito universal.
6. **Git y datos:** no subir entornos, secretos, checkpoints ni resultados grandes
   o privados. `graphify-out/` sí puede subirse a **feature/ai-exploracion**, en
   commits separados, **nunca a main**. Preparar una rama de integración limpia
   para el PR y comprobar que
   `git diff --name-only origin/main...HEAD -- graphify-out/` esté vacío.
   `.gitignore` no retira archivos ya versionados.
7. **Resultados reales:** no sustituir modelos por vectores ficticios. Los fixtures
   sintéticos solo prueban lógica y se identifican como tales. Distinguir CPU, CUDA,
   pruebas con dobles y pruebas HTTP. Pesos o servicio ausentes: error explícito
   «servicio no disponible». La similitud es ranking, no porcentaje de acierto.

## FASE 0 — Base existente y decisiones conservadas

- [x] **T00 Base CPU independiente.** Código y entorno de este proyecto no dependen
  de la carpeta antigua. Recursos locales de SAM ignorados por Git.
- [x] **T01 Diagnóstico de la MSI.** Evidencia real del 9 de noviembre:
  Ubuntu 26.04.1/WSL2, RTX 4070 Laptop/8188 MiB, driver 610.78, RAM visible 7.61 GiB.
  NVIDIA-SMI funciona; esto no acredita inferencia CUDA. Informes Dell/Luis separados.
- [x] **T02 Propuesta GPU aprobada.** Se conserva la combinación aprobada el
  6 de noviembre en [PROPUESTA_ENTORNO.md](PROPUESTA_ENTORNO.md); no reinstalar ahora.
- [x] **T06 Segmentación reutilizable.** SAM 2.1 Tiny real en CPU, caché por
  dispositivo/pesos y selección por caja/puntos; CUDA seleccionable pero sin validar.
- [x] **T07 Entradas validadas.** RGB uint8, dimensiones, cajas, puntos y labels
  comprobados antes de cargar el predictor.
- [x] **T08 Selección real.** Silla amarilla seleccionada con caja y puntos;
  máscaras y superposiciones revisadas, sin afirmar precisión con ground truth.
- [x] **T09-L Interfaz inicial local.** `service.py` expone segmentación real y PNG;
  `embed`/`search` fallan explícitamente hasta implementarlos. T09-P sigue pendiente.
- [x] **T10 Investigación SAM 3D.** Requisitos/licencia documentados en
  [NOTAS_SAM3D.md](NOTAS_SAM3D.md). Generación no disponible; no bloquea la búsqueda.

Última suite de código registrada: **35 pruebas y 5 subtests**, incluidas regresiones
del instalador. Es evidencia CPU/local, no una prueba GPU ni de integración HTTP.

## FASE 1 — Recorte y embeddings reales en CPU

- [x] **T11 Preparación del recorte.** Crear `ai/preprocess.py`: validar imagen y
  máscara del mismo tamaño, aplicar máscara, recortar al objeto y componer sobre
  fondo RGB uniforme. Definir configuración reproducible para consulta y candidatos;
  cuando el candidato no tenga máscara, usar su imagen completa y registrarlo.
  *Aceptación:* pruebas de máscara vacía (rechazo), completa, normal, dimensiones
  incompatibles y entradas inválidas; salida RGB determinista sin mutar entradas.

- [x] **T12 `embed()` real con DINOv2 ViT-S/14.** Crear `ai/embedding.py`, fijar
  revisión oficial, identidad/hash de pesos y preprocesado. Reutilizar el entorno
  CPU existente si es compatible; no instalar el requirements de entrenamiento
  de DINO sobre SAM. Si faltan paquetes, presentar propuesta antes de instalarlos.
  Cargar una vez por proceso, evaluación y sin gradientes; CPU por defecto y
  CUDA configurable sin afirmar que se probó. Conectar la implementación a `service.py`.
  *Aceptación:* inferencia CPU real, vector finito, dimensión registrada, norma 1,
  errores por recursos ausentes y pruebas de caché/validación. Sin pesos, no se cierra.

- [ ] **T13 Prueba de cordura.** Comparar dos fotos reales del mismo objeto
  contra uno distinto, con procedencia y permisos de uso registrados.
  *Aceptación:* similitudes y tiempos CPU tal como salgan; no ajustar el informe
  para forzar la hipótesis. Si faltan fotos, registrar esa dependencia y continuar
  solo con trabajo independiente. No confundir esta prueba con evaluación de búsqueda.

**Cierre local:** recorte y embedding reales reproducibles, con evidencia y commit
por tarea; push de la fase cuando estén aceptadas.

## FASE 2 — Candidatos externos y reutilización de vectores

Esta fase reemplaza el catálogo manual obligatorio y los renders Blender del plan
antiguo. P3 obtiene candidatos de páginas externas; P4 prepara sus imágenes y vectores.
Un conjunto guardado sirve para repetir pruebas, no limita las fuentes del producto.

- [ ] **T14 Contrato interno de candidatos.** Crear en `ai/` una propuesta y
  validadores para ID/origen, enlace, nombre, licencia desconocida `null`, vistas
  e imágenes RGB ya obtenidas por P3. Registrar si hay archivo 3D entregable;
  una miniatura o enlace a página no lo acredita. No hacer scraping ni HTTP en IA.
  *Aceptación:* casos válidos, duplicados, campos ausentes y errores; fixtures
  sintéticos identificados. Propuesta lista para P3, sin cambiar su contrato HTTP.

- [ ] **T15 Preparación de imágenes candidatas.** Procesar miniaturas o vistas
  recibidas con la configuración T11/T12; mantener vínculo vista → asset y
  procedencia. No exigir GLB, Blender ni máscaras SAM para cada candidato.
  *Aceptación:* entradas inválidas o sin imagen identificadas; lote parcial
  conserva trazabilidad y fallos explícitos, sin inventar vectores ni coincidencias.

- [ ] **T16 Vectores y caché de candidatos.** Implementar construcción incremental
  de vectores para el lote externo y reutilización por contenido/versión. Guardar
  solo si se configura persistencia: vectores y metadatos de asset/vista, revisión
  y pesos DINO, dimensión, preprocesado y versión de formato. Recursos fuera de Git.
  *Aceptación:* admite nuevos candidatos en cada consulta; no exige reconstruir
  una colección global ni acceder a carpetas del usuario. Repetir el mismo lote
  no recalcula vectores válidos; cambios de imagen/modelo sí los invalidan.

- [ ] **T17 Integridad y compatibilidad.** Verificar IDs, correspondencia de
  vectores y vistas, dimensión, valores finitos, hashes y versiones. Al cargar,
  rechazar datos incompatibles; no confiar en un archivo serializado solo por existir.
  *Aceptación:* pruebas de entradas dañadas, incompatibles, duplicadas y lote vacío.

**Cierre local:** recepción de candidatos, preparación y almacenamiento reutilizable
probados; la conexión a la fuente real sigue siendo responsabilidad de P3.

## FASE 3 — Ranking y evaluación local

- [ ] **T18 `search()` real.** Similitud coseno NumPy sobre los candidatos
  recibidos, mejor vista por asset y top-k sin repetir assets. Hacer explícito en
  la interfaz cómo se suministra el lote/índice; actualizar propuesta y llamadores
  locales si cambia la firma reservada, antes de pedir aceptación a P3.
  *Aceptación:* ranking determinista, k inválido/mayor al lote, lote vacío,
  vectores incompatibles y varias vistas. No necesita servidor para estas pruebas.

- [ ] **T19 Resultado para P3.** Traducir ranking a ID, nombre, miniatura,
  similitud y enlace/origen conservando metadatos. Desconocidos `null`;
  `model_available` depende de disponibilidad verificada por P3, nunca del score.
  *Aceptación:* claves/tipos documentados y probados; señalar diferencias con
  [CONTRATOS_API.md](../CONTRATOS_API.md) como propuesta, sin editarlo unilateralmente.

- [ ] **T20 Evaluación con candidatos reales.** Usar 10–15 consultas con referencia
  conocida y 3–5 sin coincidencia clara, o documentar el tamaño real disponible
  y el faltante. Separar fotos de consulta de vistas comparadas; registrar fuente,
  permisos, candidatos, top-1/top-5 y tiempos en `ai/EVALUACION.md`.
  *Aceptación:* conjunto real reproducible y resultados observados, incluidos
  fallos. Un conjunto pequeño da evidencia parcial; pruebas sintéticas no cierran T20.
  [NEEDS USER si faltan datos] P3/Brandon aporta o confirma las referencias y
  candidatos reales. No impide implementar T18/T19 ni las pruebas locales independientes.

## FASE 4 — Flujo local y entrega preparada para el servidor

- [ ] **T21-L Flujo completo dentro de IA.** Imagen → selección → SAM CPU →
  recorte → DINO CPU → ranking de candidatos externos suministrados → resultados.
  Crear un comando de prueba reproducible, sin depender de FastAPI ni de la MSI.
  *Aceptación:* ejecución con modelos e imágenes reales; evidencia de entradas,
  resultados y errores. Dobles del backend solo validan el adaptador, no la fuente real.

- [ ] **T22-L Errores locales.** Selección inválida, pesos ausentes, imágenes
  candidatas inválidas, versiones incompatibles, CUDA solicitada pero ausente y
  tratamiento de error de memoria con prueba controlada explícita.
  *Aceptación:* ninguna excepción se convierte en éxito; distinguir simulación
  de memoria de un OOM real y no provocar agotamiento deliberado de la máquina.

- [ ] **T23 Caché de consulta.** Clave con contenido de imagen/selección,
  modelo/pesos/preprocesado; el ranking además depende del lote candidato vigente.
  *Aceptación:* acierto e invalidación por imagen, selección, modelo y candidatos;
  no cachear errores ni reutilizar disponibilidad/enlaces caducados como actuales.

- [ ] **T25-L Medición CPU.** Separar carga, segmentación, preparación, embedding
  y ranking, con repeticiones, calentamiento y entorno. Anotar memoria si se mide;
  nunca presentar RAM o tiempos CPU como VRAM/rendimiento CUDA.
  *Aceptación:* comandos y tabla reproducible en MEDICIONES.

- [ ] **T26-L Reproducción y arranque.** Documentar comandos desde terminal
  limpia y dependencias realmente usadas. Preparar selección CPU/CUDA y verificación
  de recursos sin instalaciones implícitas; conservar separado el lock GPU pendiente.
  *Aceptación:* repetir el flujo local con los comandos documentados y dejar
  checklist concreto de despliegue para Ángel/Manuel.

- [ ] **T27-L Ensayo y entrega local.** Ejecutar consulta real y errores, preparar
  descripción de revisión con comportamiento, evidencia y pendientes externos.
  *Aceptación:* ensayo real y criterios locales cerrados; enumerar aparte las
  dependencias externas. Si falta evidencia local, registrar avance parcial sin
  cerrar la fase. No dar por aceptado T27-P al preparar el paquete.

**Listo para desplegar** significa: búsqueda real probada en CPU, interfaz propuesta,
recursos identificados, errores/cachés probados y comandos de arranque preparados.
No equivale a afirmar que solo falta una URL ni a cerrar los criterios externos.

## FASE 5 — Validación GPU e integración con el equipo · diferida

Estas tareas esperan ejecución en la MSI o coordinación con Manuel; se conservan
pendientes y no bloquean las fases locales.

- [ ] **T03 Entorno CUDA real.** Reanudar con `bash ai/preparar_gpu.sh .venv-gpu` y
  la propuesta aprobada. La MSI ya tiene Python 3.12.16 en `.venv-gpu` de la raíz;
  inventario de 14 dependencias comunes revisado, sin torch en la última evidencia.
  *Aceptación:* `pip check`, operación CUDA real, JSON y `ai/requirements-gpu.txt`
  generados en la MSI. El instalador escrito no cierra esta tarea. [NEEDS USER]
- [ ] **T04 Modelos en GPU.** SAM Tiny y DINO reales en CUDA; medir carga,
  inferencia calentada, sincronización y VRAM pico. [NEEDS USER: MSI]
- [ ] **T05 Arranque del servidor.** Repetir comandos GPU desde terminal limpia;
  comprobar rutas/recursos y ausencia de dependencia de la carpeta antigua.
- [ ] **T09-P Aceptación de interfaz.** Manuel confirma por escrito las firmas
  finales, máscara/PNG, candidatos, ranking y errores, después de actualizar
  [INTERFAZ_P3.md](INTERFAZ_P3.md). T09 principal permanece pendiente hasta entonces.
- [ ] **T21-P API y red reales.** Con Manuel: obtención de candidatos externos,
  descarga/validación de imágenes en P3, llamadas al módulo, tareas y archivos,
  conectividad y prueba desde clientes. Sin editar otras áreas unilateralmente.
- [ ] **T22-P Errores de integración.** Fuente caída, imágenes inaccesibles,
  dispositivo/pesos ausentes y errores del trabajador llegan correctamente al cliente.
- [ ] **T25-P Medición GPU.** Medir el flujo real desplegado, separado de CPU.
- [ ] **T26-P Reproducción por otro integrante.** Registrar persona, comando,
  entorno y resultado; esta sesión local no sustituye esa aceptación.
- [ ] **T27-P Revisión y cierre.** PR pequeño revisable sin `graphify-out/`,
  consulta real desde cliente y limitaciones documentadas. Otro integrante revisa.

## Opcionales posteriores al flujo básico

- [ ] **T24 Fotograma de video.** Solo después del flujo de imagen y si sobra
  tiempo; revisar FFmpeg disponible antes de proponer instalarlo. No bloquea ninguna fase.
- [ ] **SAM 3D operativo — fuera del cierre de búsqueda.** T10 ya investigó;
  cualquier ejecución requiere resolver hardware/recursos, entorno aislado y
  validación independiente. No es una conexión pendiente garantizada con 8 GB.

## Dependencias externas y estado Git

- **B01 Publicación:** el fallo histórico fue autenticación HTTPS. El 10 de
  noviembre `git fetch origin` pasa y HEAD coincide con la rama remota IA en
  `87bc082`; esos commits ya están publicados. Esto no garantiza el siguiente push.
- **B02 Graphify:** regla aclarada; permitido en rama IA, excluido de main.
- **B03 Main:** integración solicitada por Brandon el 10 de noviembre:
  `origin/main` en `116f440` incorporado mediante merge. Conflicto único en
  README resuelto conservando su contenido previo y añadiendo la documentación
  nueva de API/exportación. Ningún archivo previo eliminado; sin rebase.
- **B04 P3/datos:** confirmación de interfaz, mecanismo para obtener candidatos
  desde la referencia y conjunto real para evaluación. El conector actual busca
  por texto y ahora dispone de exportación JSON con URLs. Falta acordar quién
  obtiene/decodifica esas imágenes antes de llamar IA: la propuesta P4 las recibe
  preparadas, mientras el README entrante asigna la descarga al consumidor.
  DINO compara candidatos y no descubre páginas ni genera esos términos.
  Preparar la propuesta en IA; coordinar su conexión al llegar a FASE 5.
- **B05 MSI:** acceso/ejecución para CUDA y mediciones. Pospuesto por decisión
  de Brandon; no bloquea el desarrollo local ni exige otra aprobación de T02.

Los criterios de aceptación se basan en comportamiento probado, no en un porcentaje
estimado de avance. Ninguna fase del servidor se marca completa por reorganizarla.
