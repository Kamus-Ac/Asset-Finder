# Evaluación visual — estado al 10 de noviembre de 2026

**T20 pendiente de un conjunto etiquetado del equipo.** No se declara precisión
de búsqueda de assets con las pruebas de funcionamiento disponibles.

## Evidencia disponible

- T13: dos regiones reales de la misma cama, procedentes de fotogramas de un
  video, frente a la silla de la referencia. Coseno 0.95553565 / 0.34461749.
  Son vistas correlacionadas, no consultas independientes de assets 3D.
- Captura pública Sketchfab `chair`: ocho modelos con miniaturas reales, enlace
  de origen y SHA-256 de los archivos. Se registra en `demo_manifest.json`;
  imágenes fuera de Git. La licencia conocida se conserva; desconocida es null.
- La demo comparará selecciones reales contra ese lote. Que una miniatura se
  recupere a sí misma no se contará como relevancia en fotos nuevas.

## Para cerrar T20 con Manuel/equipo

1. 10–15 fotos de consulta con IDs relevantes conocidos en sus lotes candidatos.
2. 3–5 consultas sin coincidencia clara y anotación de esa condición.
3. Procedencia de imágenes, separación entre referencia y miniaturas y registro
   de los candidatos reales disponibles para cada consulta.
4. Registrar top-1/top-5 como conteos, tiempos y errores, incluidos resultados
   que no cumplan lo esperado. Coseno no es porcentaje de acierto ni prueba de
   que un modelo esté disponible para descarga.

Esto no bloquea terminar el módulo CPU ni ensayarlo con el lote de prueba.
No están medidas la API desplegada, GPU ni recuperación desde clientes.

## Ensayo inicial real contra ocho candidatos

Referencia: silla amarilla de `prueba.jpeg`, caja [222,355,430,562] sobre imagen
normalizada a 1024×631. SAM: 0.878883; selección e imágenes reales, sin stubs.
Primeros resultados del ranking DINO CPU:

| Candidato | Coseno |
| --- | --- |
| Froggy Chairs | 0.36499119 |
| Chairs Pack / Chair Collection | 0.34008162 |
| chair | 0.32888782 |

No consta que la silla exacta esté en esta muestra: no hay top-1/top-5 de
relevancia que acreditar. Los valores son bajos y el ensayo solo confirma el
recorrido real. JSON completo en `ai/resultados/preview/ranking.json` (ignorado).
