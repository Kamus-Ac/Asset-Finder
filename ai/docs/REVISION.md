# Propuesta de revisión — flujo visual CPU y ranking externo

El backend ya obtiene modelos por texto, pero aún no compara sus imágenes con
el objeto seleccionado. Este cambio entrega en `ai/` segmentación SAM Tiny,
preparación RGB, DINOv2 ViT-S/14 y ranking coseno con una mejor vista por asset.
`candidates_from_export` consume el JSON existente y miniaturas decodificadas;
`run_search` devuelve máscara, recorte, resultados serializables y tiempos.

Incluye cachés por contenido/modelo/preprocesado sin reutilizar metadatos o
rankings antiguos, persistencia NPZ sin pickle, recursos fijados con SHA-256,
errores explícitos y comandos de reproducción. La demo en localhost permite
subir una foto, dibujar el rectángulo y comparar con un lote real de prueba.
El módulo no duplica la búsqueda HTTP del backend ni limita sus candidatos a la muestra.

## Validación local

- Compilación y suite: **56 pruebas y 13 subtests aprobados**; inferencia SAM/DINO
  real, validación, cachés, datos incompatibles, transporte HTTP y conteos del evaluador.
- JavaScript de la demo validado con `node --check`; HTTP localhost comprobado
  con selección nueva, máscara/recorte PNG y cinco enlaces reales; selección inválida 422.
  No hubo automatización visual de navegador en esta sesión.
- Benchmark CPU: carga separada, calentamiento, tres repeticiones y medidas por
  etapa en [MEDICIONES.md](MEDICIONES.md). No acredita CUDA.
- Procedencia, licencias conocidas y hashes de ocho miniaturas de prueba en
  `ai/manifests/demo_manifest.json`; pesos, imágenes, cachés y resultados fuera de Git.

## Pendientes para aceptar la integración

Manuel confirma tipos y conecta descarga de miniaturas, API, tareas, archivos y
clientes. Ángel valida el entorno/inferencia CUDA y VRAM en la MSI. T20 necesita
consultas independientes etiquetadas; el ejecutor ya está listo y los ensayos de
funcionamiento no se presentan como precisión. Reproducción por otro integrante,
red y revisión del PR se conservan pendientes. SAM 3D sigue no disponible.

Para integrar a main: preparar una rama con los cambios de IA revisados, excluyendo
`graphify-out/` y sin sobrescribir archivos compartidos. Comprobar el diff del PR;
esta rama de desarrollo conserva el grafo por indicación de Brandon.
Descripción preparada; no se abrió ni integró un PR desde esta sesión.
