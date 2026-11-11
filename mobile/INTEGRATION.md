# Integración móvil con los servicios existentes

Los cambios de esta entrega están únicamente en `mobile/`. No se modificaron el backend, IA, frontend web ni los contratos compartidos.

## Ejecutar en desarrollo

Desde la raíz, arrancar la API existente con su entorno preparado:

```bash
backend/.venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

En otra terminal, opcionalmente arrancar la comparación CPU cuando sus recursos estén verificados:

```bash
ai/.venv-sam2/bin/python -m ai.demo
```

En la terminal móvil:

```bash
cd mobile
cp .env.example .env.local
npm install
npx expo start --clear
```

Para probar desde el teléfono se puede usar el túnel Expo ya documentado: `npx expo start --tunnel ngrok`. `expo-image-manipulator` está incluido en Expo Go para este SDK. Reiniciar Metro tras instalar el módulo y cargar las nuevas rutas.

El cliente usa rutas relativas de Expo Router; en desarrollo también funcionan desde Expo Go mediante el origen del servidor de desarrollo. **El teléfono no debe usar `localhost:8000`.** Las rutas de servidor de `mobile/src/app/api/` llaman a Python desde el host de Expo, con estas variables solo de servidor:

- `ASSET_FINDER_API_TARGET`: FastAPI, por defecto `http://127.0.0.1:8000`.
- `ASSET_FINDER_AI_TARGET`: demo visual existente, por defecto `http://127.0.0.1:8765`.

Se pueden cambiar por las direcciones accesibles de los servidores del equipo. Para producción hay que desplegar el servidor Expo y configurar `EXPO_PUBLIC_GATEWAY_URL` con su URL pública si el cliente se distribuye por separado. Exportar/instalar solamente el APK no despliega estas rutas. Los targets Python no se incluyen como configuración pública del cliente.

## Qué está conectado

| Ruta del adaptador móvil | Servicio existente |
| --- | --- |
| `GET /api/backend/health` | `GET /health` de FastAPI |
| `GET /api/backend/catalog/search?q=...` | Búsqueda textual viva de Sketchfab |
| `POST /api/backend/media` | `POST /media`, multipart con campo `file` |
| `GET /api/backend/media/{id}` | Metadatos de la referencia normalizada |
| `GET /api/backend/media/{id}/file` | PNG normalizado del servidor |
| `GET /api/visual` | `/sample` de `ai.demo`; devuelve solo capacidad de la muestra |
| `POST /api/visual` | Recupera la referencia en FastAPI y llama `/run` de `ai.demo` |

El adaptador permite únicamente las rutas anteriores, no reenvía cookies/credenciales ni acepta una URL de destino enviada por el cliente. Mantiene errores HTTP, límites de subida, tiempos de espera y escritura desde el mismo origen. Resuelve el acceso web sin cambiar CORS del backend. La configuración y uso siguen siendo para las pruebas privadas del equipo, igual que los servicios actuales.

El adaptador visual es una conexión provisional desde el área móvil al servicio de pruebas existente; **no es la implementación de `/searches` o `/segmentations` de FastAPI**. La comparación usa la muestra de modelos reales preparada por IA, no la consulta viva de Sketchfab. La integración definitiva de candidatos externos en FastAPI queda con Manuel/Brandon.

## Recorrido móvil

1. Buscar desde Inicio consulta Sketchfab y muestra las miniaturas y enlaces proporcionados por el backend. No se asigna una puntuación a la búsqueda textual ni se inventan licencias, formatos o archivos descargables.
2. Capturar/elegir una imagen mantiene la referencia local. **Enviar y seleccionar objeto** crea una copia PNG con lado mayor de hasta 1024 px y la envía a FastAPI; el servidor normaliza orientación y RGB y devuelve ID/dimensiones.
3. Selección usa la imagen normalizada. Convierte el rectángulo/puntos desde la región visible de `contain` a píxeles de esa imagen; ignora márgenes. Permite elegir candidatos y resultados, con validación de cantidades.
4. Si IA está disponible, el adaptador envía esa referencia y selección al servicio existente. Se muestran máscara, recorte, conteos, tiempo, avisos y puntuaciones de la respuesta real. Cancelar espera cancela la espera del cliente; no garantiza interrumpir una inferencia que ya corre en Python.
5. Si un servicio falla, se conserva un error con reintento y no se sustituye por el catálogo de ejemplo. Desde selección se puede pasar a búsqueda por nombre cuando IA no está disponible.
6. Los modelos recuperados se pueden guardar en colecciones locales de la sesión. Los metadatos se conservan al navegar; recargar reinicia esas colecciones. No se afirma persistencia remota.

## Límites actuales

El backend inspeccionado no ofrece proyectos/escenas compartidos, tareas, detalle de assets, generación 3D ni video/fotogramas. No se llamaron rutas propuestas que aún no existen. El detalle usa los metadatos ya recibidos y abre el enlace original; no fabrica un GLB a partir de una miniatura. Reconstrucción permanece deshabilitada y se retiraron los estados ficticios de generación.

En este entorno, FastAPI requirió un entorno temporal de pruebas con FastAPI, Uvicorn, Pillow, HTTPX y python-multipart. El entorno backend existente no tenía HTTPX; no se modificaron sus dependencias ni su requirements. La copia local de SAM no contiene `ai/sam2/LICENSE` y la verificación oficial de recursos se detiene sin sobrescribirla. Por eso no se declaró una inferencia real validada. Preparar/completar esos entornos corresponde a sus dueños; ver los README de raíz e IA.

## Validación

```bash
npm run test:integration
npm run lint
npx tsc --noEmit
npx expo export --platform android --platform web --max-workers 1 --output-dir /tmp/asset-finder-mobile-integration-export
```

Las nueve pruebas automatizadas usan los servicios/adaptadores TypeScript reales con HTTP controlado: contratos, errores, multipart, límites, coordenadas, cancelación, rutas permitidas y enlace al contrato IA. No ejecutan SAM/DINO.

La prueba interactiva en navegador sí consultó Sketchfab mediante FastAPI: diez modelos reales, ficha y guardado local. También normalizó/subió una imagen 1280×640 y recuperó el PNG 1024×512 del servidor. La disponibilidad negativa de IA y su bloqueo en UI se comprobaron contra el servicio ausente. Las respuestas de comparación, puntuaciones y errores de fuente se probaron por separado con contratos simulados, identificados como tales. No se probó en teléfono físico.
