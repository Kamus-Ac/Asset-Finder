# Propuesta para ejecutar el frontend oficial de Ángel

Solicitud de Brandon: integrar la prueba visual y controlar candidatos/resultados
desde frontend/. Aprobación npm ci recibida de Brandon el 10 de noviembre de 2026.
Se conserva el diseño y el catálogo Three.js existente.

Al preparar la propuesta no existía frontend/node_modules. Se aprobó y ejecutó
`npm ci --no-audit --no-fund` el 10 de noviembre, con caché temporal, instalando
exactamente el lockfile ya existente,
sin actualizar package.json ni package-lock.json ni instalar Node globalmente.
La prueba local usa un proxy Vite a ai.demo; la integración definitiva de FastAPI
continúa con Manuel. Los cambios quedaron incluidos en el commit compartido
366aec5. Para integrar a main se preparará una revisión separada del frontend
para Ángel, excluyendo Graphify; no se reescribe ese historial publicado.

## Versiones directas registradas

| Paquete | Versión exacta del lock |
| --- | --- |
| @tailwindcss/vite | 4.3.4 |
| react | 19.3.1 |
| react-dom | 19.3.1 |
| tailwindcss | 4.3.4 |
| three | 0.187.0 |
| @eslint/js | 10.0.1 |
| @types/node | 24.19.2 |
| @types/react | 19.3.0 |
| @types/react-dom | 19.3.0 |
| @types/three | 0.187.0 |
| @vitejs/plugin-react | 6.2.1 |
| eslint | 10.14.0 |
| eslint-plugin-react-hooks | 7.1.1 |
| eslint-plugin-react-refresh | 0.5.7 |
| globals | 17.14.0 |
| typescript | 5.9.3 |
| typescript-eslint | 8.72.1 |
| vite | 8.3.5 |

Lockfile: 220 entradas de paquetes (incluye variantes de plataforma).
SHA-256: `ca9b1b9b5002b4507f5ad3b4e7bf500c3123695c5e0ffac138762e6567bcde45`.

Regla aplicable: ai/TASKS.md, Regla 4: presentar versiones y obtener aprobación
antes de instalar paquetes. Esta propuesta no autoriza actualizar dependencias de Ángel.

## Controles propuestos

- Candidatos a comparar: cantidad que realmente entra a DINO/ranking. En modo
  muestra se limita a los 24 disponibles y se informa el número efectivo.
- Resultados a mostrar: top-k, limitado por los candidatos comparados.
- Fuente en vivo: la API actual fija count=10. Para aumentar esa consulta se
  prepara una propuesta separada para Manuel; por encima de 24 hace falta
  paginación según la documentación oficial de Sketchfab. No se simulan más assets.

Fuentes: https://docs.npmjs.com/cli/v11/commands/npm-ci/
y https://docs.sketchfab.com/data-api/v3/index.html

## Estado revisado el 11 de noviembre de 2026

VisualSearch está integrado en el frontend oficial; conserva el catálogo Three.js
como ejemplo desplegable. Build/lint y proxy local probados. La captura permite
elegir de 1 a 24 candidatos y un top-k independiente; sigue sin ser búsqueda en
vivo. Aumentar la fuente requiere la propuesta API_CANTIDADES_P3.md con Manuel.
