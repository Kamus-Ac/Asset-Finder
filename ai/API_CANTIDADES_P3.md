# F03 — Cantidad de candidatos: propuesta para Manuel

Estado al **11 de noviembre de 2026**: controles locales implementados; cambio
de FastAPI pendiente de revisión de P3. No se ha modificado `backend/`.

## Comportamiento propuesto

Conservar `GET /catalog/search?q=chair` y su respuesta actual. Añadir un parámetro
`candidate_limit`, con valor por defecto 10 para preservar a los clientes actuales.
El máximo será configurable por P3; 100 puede servir como límite inicial de prueba,
no como una garantía de disponibilidad o velocidad.

Ejemplo de solicitud: `/catalog/search?q=chair&candidate_limit=30`.
La comparación recibe aparte `k=5`: obtener 30 candidatos y mostrar los cinco más
similares son operaciones distintas. IA ya admite ambos argumentos en `run_search`.

La documentación de Sketchfab consultada describe un máximo de 24 elementos por
página. Para solicitar más, el conector debe recorrer la paginación por cursor,
deduplicar `asset_id` y detenerse al alcanzar la cantidad pedida, agotar resultados
o recibir un error de fuente. Nunca duplicar assets para completar el número.
Fuente: [documentación oficial, paginación](https://docs.sketchfab.com/data-api/v3/index.html).

P3 conserva la obtención/validación de URLs, descarga de miniaturas, límites de
llamadas y tratamiento de errores. `candidates_from_export` ya adapta el JSON
actual y el mapa de imágenes RGB por asset_id a la entrada del módulo de IA.

## Información para el cliente

El reporte de IA ya incluye `comparison` con `requested`, `available`, `selected`,
`compared`, `views`, `requested_results` y `returned_results`. La API debe conservar
esas diferencias cuando la fuente devuelva menos candidatos o alguna imagen falle.
Un resultado parcial debe informar su causa; no presentarse como si se hubiera
comparado con toda la cantidad solicitada.

## Aceptación para F03

- Mantener el comportamiento anterior sin el parámetro; rechazar cantidades inválidas.
- Verificar solicitudes dentro de una página y solicitudes que necesiten varias.
- No repetir IDs, respetar el límite y registrar final de páginas/errores de fuente.
- Pasar imágenes decodificadas y el límite al módulo; comprobar cantidades reales.
- Actualizar el contrato y conectar el frontend oficial, sustituyendo el proxy de prueba.

La muestra local de 24 imágenes permite probar controles e inferencia sin depender
de la búsqueda en vivo. No cierra esta tarea ni reemplaza la API de Manuel.
