# Plan personal P4 — IA y catálogo (Brandon)

Carpeta propia: `ai/`. Rama por tarea: `feature/ai-<tarea>`. Calendario alineado con `PLAN_EQUIPO.md` (día 1 = jue 5 nov).

## Meta final (lo que debes entregar)
1. `segment(image, box, points)` → máscara del objeto (SAM 2.1 Tiny, en GPU).
2. `embed(image)` → vector visual normalizado (DINOv2 ViT-S/14).
3. Catálogo de 20–30 modelos indexado (vectores + metadatos).
4. `search(vector, k)` → resultados agrupados por asset, ordenados por similitud.
5. Medición (tiempo y VRAM) y una evaluación simple de relevancia.
6. Conclusión escrita sobre SAM 3D (viable o no con 8 GB).

## Regla de oro: no bloquear a Manuel (P3)
Manuel necesita **firmas de funciones desde el día 2**, no la IA terminada. Publica pronto `ai/service.py` con funciones que **ya existan pero devuelvan datos falsos claramente marcados** (`"stub": true`); luego las reemplazas por la lógica real sin cambiar la firma.

## Orden de trabajo

### Paso 0 — Entorno en el servidor (día 1, ~2–3 h)
- Confirmar dónde corre todo (WSL2/Ubuntu o Windows) y que `nvidia-smi` ve la RTX 4070.
- Crear un entorno **nuevo** para GPU. No reutilizar `requirements-sam2.txt` tal cual: fija PyTorch CPU.
- Instalar PyTorch con CUDA desde https://pytorch.org/get-started/locally/ y comprobar `torch.cuda.is_available()`.
- Instalar lo que falta (numpy, Pillow) y descargar los pesos de SAM 2.1 Tiny desde el repo oficial. Pesos fuera de Git.
- **Listo cuando:** `prueba_sam2.py` corre y da la máscara de la silla, primero en CPU (línea base) y luego en CUDA.
- Anota tiempos y VRAM en `ai/MEDICIONES.md`.

### Paso 1 — `segment()` reutilizable (día 2)
- Archivo `ai/segmentation.py`: carga el modelo **una sola vez**; recibe imagen, `box_xyxy` y `points` (`label` 1/0); devuelve máscara + puntuación.
- Probar con `prueba.jpeg` (rectángulo y con puntos; recuerda que un punto central solo tomó una tabla del respaldo).
- Publicar el stub de `ai/service.py` a Manuel y acordar tipos de entrada/salida (rutas de archivo o bytes; máscara como PNG).
- **Listo cuando:** una función se invoca desde otro script sin copiar código.

### Paso 1b — Investigación SAM 3D (día 2, máximo 2 h)
- Releer https://github.com/facebookresearch/sam-3d-objects/blob/main/doc/setup.md y licencias actuales.
- Documentar en `ai/NOTAS_SAM3D.md`: requisitos, si hay modo de menos memoria, conclusión. No instalar si pide ≥32 GB sin alternativa.
- Resultado esperado y válido: “no viable con 8 GB, servicio no disponible”.

### Paso 2 — Preparación del recorte + `embed()` (día 3)
- `ai/preprocess.py`: aplicar máscara, recortar al objeto y componer sobre fondo RGB uniforme.
- `ai/embedding.py`: DINOv2 ViT-S/14, vector normalizado. Guardar modelo y configuración de preprocesado junto al índice.
- **Prueba de cordura:** dos fotos de la misma silla deben salir más parecidas entre sí que contra una mesa.

### Paso 3 — Catálogo e índice (día 3–4)
- Reunir 20–30 assets (idealmente GLB). Si hay GLB: renderizar 4–6 vistas con Blender (fondo y encuadre consistentes). Si no: usar miniaturas y marcar `model_available: false`.
- `ai/index_catalog.py`: embedding por vista, guardar en `.npy` + metadatos JSON (asset_id, nombre, origen, licencia, `model_available`, versión de índice).
- `model_available` lo determinas tú al indexar: `true` solo si el archivo existe de verdad.

### Paso 4 — `search()` + evaluación (día 4)
- Similitud coseno con NumPy; agrupar vistas por asset (tomar la mejor vista); devolver top-k con la forma de `CONTRATOS_API.md`.
- Evaluación: 10–15 consultas con respuesta conocida y 3–5 sin coincidencia clara. Medir si el asset correcto cae en top-1 / top-5. Es un ranking, no un “porcentaje de acierto”.

### Paso 5 — Integración con Manuel (día 5)
- Reemplazar los stubs de `service.py` por la lógica real. Probar con Manuel el flujo: imagen → máscara → resultados.
- Caché del embedding de la consulta (opcional). Si sobra tiempo: fotograma de video con FFmpeg.

### Paso 6 — Cierre (día 6–7)
- Medición final (tiempo por etapa, VRAM pico) en `MEDICIONES.md`; instrucciones de arranque y prueba en `ai/README.md`; ensayo de demo.

## Reglas para ti
- Solo tocas `ai/`. Si necesitas `.gitignore` o algo de la raíz, pídeselo a Manuel (p. ej. ignorar `graphify-out/` y los pesos).
- No hagas commit de `graphify-out/`, pesos, `.venv*` ni imágenes privadas.
- Un PR pequeño por paso. Corre la prueba del módulo antes de abrir el PR.
- Ejecuta scripts desde la carpeta correcta con `python -P` si vuelve el conflicto de importación con el repo de SAM.

## Prompts sugeridos para Codex
**Paso 0:** “Lee `AGENTS.md` y `ai/PLAN_P4.md`. Eres P4, solo trabajas en `ai/`. Verifica GPU y PyTorch CUDA en este equipo y dime los comandos exactos antes de instalar nada. No modifiques `requirements-sam2.txt`; crea uno nuevo para GPU.”

**Paso 1:** “Extrae de `prueba_sam2.py` una función `segment(image, box_xyxy, points)` en `ai/segmentation.py` que cargue el modelo una vez y devuelva máscara y puntuación. Añade un script de prueba con `prueba.jpeg`. No cambies otras carpetas.”

**Paso 2–4:** “Implementa `embed`, el indexador y `search` según `ai/PLAN_P4.md`, con prueba de cordura y medición de tiempos/VRAM. Guarda modelo, pesos y configuración de preprocesado junto al índice.”
