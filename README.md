Asset Finder
Plataforma web y móvil para encontrar modelos 3D en distintas páginas a partir de una referencia visual y colocarlos, cuando su archivo esté disponible, en una escena web.
Flujo objetivo
Foto o archivo → selección del objeto → máscara SAM → obtención de candidatos externos → comparación visual DINO → resultados con enlaces a su origen → elección y escena web.

La app captura fotos/video; la web recibe archivos. El video se resolverá inicialmente mediante un fotograma si el plazo lo permite. La reconstrucción con SAM 3D Objects es un objetivo condicionado a pruebas de hardware, no una función operativa confirmada.
Estado
- SAM 2.1 Tiny probado en CPU con una silla.
- Backend con /health y búsqueda textual de candidatos en Sketchfab, confirmada por Manuel.
- Conector subido a feature/backend, commit 0d299da; comprobar si ya está integrado en main.
- Frontend del ZIP revisado: plantilla React/Vite.
- Móvil, ranking DINO integrado, escena, Tailscale y despliegue GPU: no confirmados.