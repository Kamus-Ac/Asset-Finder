---
type: "query"
date: "2026-11-11T16:58:36.250901+00:00"
question: "Qué archivos de ai conviene agrupar sin cambiar las entradas públicas"
contributor: "graphify"
outcome: "useful"
source_nodes: ["service.py", "pipeline.py", "resources.py"]
---

# Q: Qué archivos de ai conviene agrupar sin cambiar las entradas públicas

## Answer

Tokens del vocabulario consultados: service pipeline resources diagnostico benchmark evaluate manifest preparar gpu prueba. El grafo anterior ubica service.py, pipeline.py y resources.py como entradas del flujo, y diagnostico_servidor.py, preparar_gpu.sh y prueba_embeddings.py como herramientas o ejemplos. Verificación directa posterior: se conservan módulos públicos y comandos principales; 25 archivos pasan a docs, scripts, examples y manifests. El grafo describe rutas previas a R04 y necesita regeneración.

## Outcome

- Signal: useful

## Source Nodes

- service.py
- pipeline.py
- resources.py