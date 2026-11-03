from pathlib import Path
import time

import numpy as np
import torch
from PIL import Image

from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor


BASE = Path(__file__).resolve().parent
REPO = BASE / "sam2"

# Abrir la imagen y reducirla para esta prueba en CPU.
image = Image.open(BASE / "prueba.jpeg").convert("RGB")
image.thumbnail((1024, 1024))

pixels = np.array(image)
width, height = image.size

print(f"Imagen de prueba: {width} × {height}")
print("Cargando SAM 2...")

model = build_sam2(
    "configs/sam2.1/sam2.1_hiera_t.yaml",
    str(REPO / "checkpoints/sam2.1_hiera_tiny.pt"),
    device="cpu",
    apply_postprocessing=False,
)

predictor = SAM2ImagePredictor(model)

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

with torch.inference_mode():
    predictor.set_image(pixels)

    masks, scores, _ = predictor.predict(
    box=box,
    multimask_output=False,
)

elapsed = time.perf_counter() - start

# Elegir la máscara con mayor puntuación del modelo.
mask = masks[int(np.argmax(scores))].astype(bool)


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

print(f"Tiempo de segmentación: {elapsed:.2f} segundos")
print("Resultados guardados en:", BASE)
print("- mascara.png")
print("- silla_transparente.png")
print("- seleccion.png")