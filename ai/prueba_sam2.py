from pathlib import Path
import time
import importlib.util

import numpy as np
from PIL import Image


BASE = Path(__file__).resolve().parent

# Cargar el módulo hermano por ruta mantiene el comando -I sin añadir ai/ a
# sys.path (ai/sam2/ podría ocultar el paquete SAM instalado).
spec = importlib.util.spec_from_file_location("asset_finder_segmentation", BASE / "segmentation.py")
segmentation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(segmentation)

# Abrir la imagen y reducirla para esta prueba en CPU.
image = Image.open(BASE / "prueba.jpeg").convert("RGB")
image.thumbnail((1024, 1024))

pixels = np.array(image)
width, height = image.size

print(f"Imagen de prueba: {width} × {height}")
# Rectángulo: izquierda, arriba, derecha, abajo.
# Estos valores sirven si la silla está centrada
# y ocupa casi toda la imagen.
box = np.array([
    width * 0.10,
    height * 0.05,
    width * 0.90,
    height * 0.95,
])

print("Seleccionando el objeto en el rectángulo...")
start = time.perf_counter()

mask, score = segmentation.segment(image, box_xyxy=box, device="cpu")

elapsed = time.perf_counter() - start

# Guardar máscara en blanco y negro.
Image.fromarray(
    (mask.astype(np.uint8) * 255)
).save(BASE / "mascara.png")

# Guardar el objeto con fondo transparente.
cutout = image.convert("RGBA")
cutout.putalpha(Image.fromarray(mask.astype(np.uint8) * 255))
cutout.save(BASE / "silla_transparente.png")

# Guardar una vista de la selección sobre la foto.
overlay = pixels.copy()
color = np.array([30, 200, 100])
overlay[mask] = (
    pixels[mask] * 0.5 + color * 0.5
).astype(np.uint8)

Image.fromarray(overlay).save(BASE / "seleccion.png")

print(f"Tiempo de llamada (incluye primera carga): {elapsed:.2f} segundos")
print(f"Puntuación del modelo: {score:.4f}")
print("Resultados guardados en:", BASE)
print("- mascara.png")
print("- silla_transparente.png")
print("- seleccion.png")
