"""Preparación RGB determinista, compartida por consultas y candidatos."""

import math
from numbers import Integral, Real


PREPROCESS = {
    "version": 1,
    "background": [255, 255, 255],
    "padding_fraction": 0.1,
    "crop": "mask_bounds_or_full_image",
    "canvas": "square_preserve_aspect",
}


def rgb_pixels(image):
    from PIL import Image
    import numpy as np

    if isinstance(image, Image.Image):
        if image.mode != "RGB":
            raise ValueError("imagen: se requiere RGB")
        image = np.asarray(image)
    if (not isinstance(image, np.ndarray) or image.dtype != np.uint8
            or image.ndim != 3 or image.shape[2] != 3 or 0 in image.shape):
        raise ValueError("imagen: se requiere RGB uint8 H×W×3 no vacía")
    return np.array(image, copy=True)


def prepare_image(image, mask=None, *, background=(255, 255, 255), padding=0.1):
    """Recorta a la máscara (o usa imagen completa), sin deformar ni mutar entradas.

    Devuelve PIL RGB cuadrada, con margen proporcional y fondo uniforme.
    Máscaras: ndarray bool H×W del tamaño original; una vacía se rechaza.
    No aplica EXIF: las coordenadas deben corresponder a la imagen recibida.
    """
    import numpy as np
    from PIL import Image

    pixels = rgb_pixels(image)
    if (not isinstance(background, (list, tuple)) or len(background) != 3
            or any(isinstance(x, bool) or not isinstance(x, Integral)
                   or not 0 <= x <= 255 for x in background)):
        raise ValueError("background: se requieren tres enteros RGB 0..255")
    if (isinstance(padding, bool) or not isinstance(padding, Real)
            or not math.isfinite(padding) or not 0 <= padding <= 1):
        raise ValueError("padding: se requiere fracción finita 0..1")
    if mask is not None:
        if (not isinstance(mask, np.ndarray) or mask.dtype != np.bool_
                or mask.shape != pixels.shape[:2]):
            raise ValueError("mask: se requiere bool H×W del tamaño de la imagen")
        ys, xs = np.nonzero(mask)
        if not len(xs):
            raise ValueError("mask: selección vacía")
        pixels[~mask] = background
        pixels = pixels[ys.min():ys.max()+1, xs.min():xs.max()+1]
    height, width = pixels.shape[:2]
    margin = math.ceil(max(height, width) * padding)
    side = max(height, width) + 2 * margin
    output = Image.new("RGB", (side, side), tuple(int(x) for x in background))
    output.paste(Image.fromarray(pixels), ((side-width)//2, (side-height)//2))
    return output
