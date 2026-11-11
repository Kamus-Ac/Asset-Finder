# Ejemplos manuales

Desde la raíz, con el entorno CPU existente y los recursos preparados:

```bash
ai/.venv-sam2/bin/python -I ai/examples/prueba_sam2.py
ai/.venv-sam2/bin/python -I ai/examples/prueba_seleccion.py
ai/.venv-sam2/bin/python -m ai.examples.prueba_embeddings
```

`prueba.jpeg` es la foto de referencia incluida. El primer script guarda máscara,
recorte y selección en `ai/resultados/prueba_sam2/`; el segundo usa
`ai/resultados/T08/`; el tercero usa `ai/resultados/T13/` y requiere los fotogramas
de ejemplo del checkout SAM. Los resultados permanecen fuera de Git.

Para probar el flujo actual, usar `python -m ai.pipeline` o el
[frontend oficial](../README.md). Estos ejemplos no miden precisión de búsqueda.
