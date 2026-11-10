# Asset Finder — resumen para Brandon

Estado: **10 de noviembre de 2026**.

## Proyecto y responsabilidades

Buscador visual de modelos 3D en páginas externas. SAM separa el objeto de una
foto y DINO compara su apariencia con imágenes de candidatos; devuelve enlaces.
Archivo 3D disponible y similitud visual son cosas distintas.

```text
Asset-Finder/
├── ai/          Brandon: SAM, recorte, DINO, ranking y pruebas
├── backend/     Manuel: API, fuentes externas, archivos, tareas y servidor
├── frontend/    Ángel: web, resultados y escena 3D
└── mobile/      Luis: captura/selección e integración móvil
```

## Dónde estamos

- **IA CPU:** flujo completo implementado y probado con imágenes reales; caché,
  validación, errores, mediciones y comandos reproducibles. DINO de 384 componentes.
- **Prueba disponible:** `ai/.venv-sam2/bin/python -m ai.demo`; abrir
  http://127.0.0.1:8765. Subir foto, marcar objeto y comparar. Muestra de ocho modelos
  reales; no garantiza que contenga el objeto exacto ni mide precisión.
- **Backend existente:** búsqueda textual `/catalog/search`, referencias `/media`
  y exportador JSON. Aún no llama SAM/DINO en el código remoto inspeccionado.
- **Pendiente Manuel/equipo:** aceptar tipos, conectar candidatos/imágenes y API,
  aportar consultas etiquetadas para T20, probar clientes y revisar/reproducir.
- **Pendiente Ángel/MSI:** T03–T05 y mediciones CUDA reales. RTX 4070 de 8188 MiB
  detectada en WSL; todavía no acredita PyTorch CUDA ni inferencia GPU.
- **SAM 3D:** investigación terminada; generación no disponible. Requiere resolver
  viabilidad/hardware por separado. Video opcional, fuera del cierre local de imagen.

## Entrega de P4

El módulo recibe imágenes/candidatos en memoria; no busca carpetas del usuario
ni duplica el conector de Manuel. La demo usa una captura externa para repetir
pruebas, no limita el producto a un catálogo manual. En producción la IA corre
centralizada en servidor, aunque se haya desarrollado en CPU local.

Guías: [README](README.md) · [TASKS](TASKS.md) · [Plan](PLAN_P4_IA.md) ·
[Entrega al equipo](ENTREGA_EQUIPO.md) · [Evaluación pendiente](EVALUACION.md).
