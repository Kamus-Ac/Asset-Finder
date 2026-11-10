# Candidatos externos — propuesta interna para Manuel

P3 conserva búsqueda en fuentes, descarga y decodificación. IA recibe una lista
de objetos en memoria; no realiza HTTP. Formato propuesto (imagen no es JSON):

```python
{
    "asset_id": "id_estable_de_la_fuente",
    "name": "Nombre o None",
    "source": "sketchfab",
    "source_url": "https://pagina-del-modelo",
    "thumbnail_url": "https://miniatura",  # o None
    "license": None,
    "model_available": False,
    "views": [{"view_id": "thumbnail", "image": imagen_RGB}],
}
```

`image`: PIL RGB o ndarray uint8 H×W×3. Campos desconocidos `None`, nunca textos
inventados. Varias vistas pueden pertenecer al mismo asset. Los IDs de asset
son únicos en el lote; los de vista dentro del asset. Vistas inválidas se informan
por separado; el ranking solo usa las válidas. Un lote sin imágenes válidas
no se presenta como búsqueda con coincidencias.

Para afirmar archivo 3D disponible P3 debe enviar `model_available=True`,
`model_verified=True` y `model_url` accesible para clientes. `model_verified`
es una confirmación interna del backend, no un campo a confiar al cliente.
Una miniatura, enlace externo o similitud alta no acredita ese archivo.

El exportador actual entrega JSON con `query`/`results` y URLs, sin imágenes.
Falta acordar su descarga/decodificación antes de llamar IA. La demo local puede
recibir un manifiesto explícito de imágenes ya disponibles para probar el módulo;
esto no implementa una búsqueda de carpetas ni reemplaza el conector de fuentes.

Estado: propuesta validada dentro de IA; aceptación conjunta pendiente en T09-P.
