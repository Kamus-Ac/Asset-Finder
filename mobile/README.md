# Assets Finder · Mobile

Expo SDK 58, React Native, Expo Router, TypeScript, NativeWind, LINE Seed JP y Lucide. Diseño compartido con Inicio: degradados suaves, tarjetas discretas, renders decorativos y navegación flotante.

## Ejecutar

```bash
cd mobile
npm install
npx expo start --clear
```

Guía de servidores, variables, Expo Go y límites: [INTEGRATION.md](INTEGRATION.md). El backend debe estar funcionando para buscar y enviar referencias; no hay un reemplazo silencioso con datos de ejemplo.

## Recorridos

- **Inicio:** buscar modelos externos, abrir archivo de imagen, capturar y crear una colección local.
- **Resultados:** búsqueda textual real de Sketchfab o resultados de comparación visual; filtros y orden. Miniaturas/enlaces reales; puntuación solo si la respuesta incluye similitud.
- **Referencia:** foto/galería reales y video local. El envío explícito normaliza la imagen a hasta 1024 px y usa `POST /media`.
- **Selección:** rectángulo/puntos sobre la imagen normalizada, coordenadas sin márgenes, cantidades y comparación con el servicio visual existente cuando esté disponible.
- **Modelo:** miniatura de la fuente, enlace original, información disponible y guardado en una colección local. No se ofrece un archivo 3D si el servidor no proporciona una URL verificada.
- **Proyectos y entorno:** colecciones de los modelos consultados, conservadas durante esta sesión. Aún no hay persistencia común con web.
- **Ajustes:** claro/oscuro/sistema y comprobación separada del backend y de IA.
- **Perfil:** estado sin sesión y resumen de colecciones locales.
- **Reconstrucción:** deshabilitada hasta que exista el servicio; no muestra estados de éxito ficticios.

## Estructura

- `src/app/api/`: adaptadores de servidor Expo para los endpoints Python actuales.
- `src/server/`: transporte hacia los servicios; nunca importado por componentes cliente.
- `src/services/`: cliente HTTP, contratos y validación/adaptación de respuestas.
- `src/media/`: selector/cámara, normalización, subida y geometría de selección.
- `src/session/`: caché de metadatos consultados y colecciones locales de sesión.
- `src/components/ui/kit.tsx`: controles, campos, estados, modales y contenedor.
- `src/theme/`, `src/components/app-backdrop.tsx`: tipografía, paletas y fondos compartidos.
- `src/mocks/`: ejemplos históricos; no son un fallback de los recorridos conectados.

## Validación

```bash
npm run test:integration
npm run lint
npx tsc --noEmit
npx expo export --platform android --platform web --max-workers 1 --output-dir /tmp/asset-finder-mobile-integration-export
```

Ver [VALIDATION.md](VALIDATION.md). Las pruebas en navegador y las exportaciones no sustituyen comprobar cámara, permisos, áreas seguras y conexión en un teléfono físico.
