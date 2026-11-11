"""Segmentación SAM 2.1 Tiny reutilizable, sin guardar archivos ni redimensionar."""

from pathlib import Path
from collections.abc import Mapping
import math
from numbers import Integral, Real
import threading


class ServiceUnavailableError(RuntimeError):
    """El modelo o dispositivo requerido no está disponible."""


_BASE = Path(__file__).resolve().parent
_CHECKPOINT = _BASE / "sam2/checkpoints/sam2.1_hiera_tiny.pt"
_CONFIG = "configs/sam2.1/sam2.1_hiera_t.yaml"
_CACHE = {}
_CACHE_LOCK = threading.RLock()


def _build_predictor(device, checkpoint):
    try:
        import torch
        from sam2.build_sam import build_sam2
        from sam2.sam2_image_predictor import SAM2ImagePredictor
    except ImportError as error:
        raise ServiceUnavailableError("servicio no disponible: faltan dependencias SAM") from error
    if not checkpoint.is_file():
        raise ServiceUnavailableError(f"servicio no disponible: pesos ausentes en {checkpoint}")
    if device == "cuda" and not torch.cuda.is_available():
        raise ServiceUnavailableError("servicio no disponible: CUDA no accesible")
    model = build_sam2(_CONFIG, str(checkpoint), device=device, apply_postprocessing=False)
    return SAM2ImagePredictor(model)


def _get_predictor(device, checkpoint):
    # El candado incluye la primera carga: llamadas simultáneas no duplican pesos.
    key = (device, str(checkpoint))
    with _CACHE_LOCK:
        if key not in _CACHE:
            _CACHE[key] = (_build_predictor(device, checkpoint), threading.RLock())
        return _CACHE[key]


def _coordinate(value, field):
    if isinstance(value, bool) or not isinstance(value, Real):
        raise ValueError(f"{field}: se requiere una coordenada numérica")
    try:
        result = float(value)
    except OverflowError as error:
        raise ValueError(f"{field}: la coordenada debe ser finita") from error
    if not math.isfinite(result):
        raise ValueError(f"{field}: la coordenada debe ser finita")
    return result


def _validate_inputs(image, box_xyxy, points, np):
    try:
        from PIL import Image
    except ImportError as error:
        raise ServiceUnavailableError("servicio no disponible: falta Pillow") from error
    if isinstance(image, Image.Image):
        if image.mode != "RGB":
            raise ValueError("imagen: se requiere modo RGB; no se convierte automáticamente")
        pixels = np.asarray(image)
    elif isinstance(image, np.ndarray):
        pixels = image
    else:
        raise ValueError("imagen: se requiere una imagen PIL RGB o ndarray RGB uint8")
    if pixels.ndim != 3 or pixels.shape[2] != 3 or pixels.dtype != np.uint8:
        raise ValueError("imagen: se requiere RGB uint8 con forma H×W×3")
    height, width = pixels.shape[:2]
    if height == 0 or width == 0:
        raise ValueError("imagen: ancho y alto deben ser mayores que cero")

    box = None
    if box_xyxy is not None:
        try:
            values = np.asarray(box_xyxy, dtype=object)
        except (TypeError, ValueError) as error:
            raise ValueError("box_xyxy: se requieren cuatro coordenadas") from error
        if values.shape != (4,):
            raise ValueError("box_xyxy: se requieren cuatro coordenadas")
        x1, y1, x2, y2 = [_coordinate(v, "box_xyxy") for v in values]
        if not (0 <= x1 < x2 <= width and 0 <= y1 < y2 <= height):
            raise ValueError("box_xyxy: se requiere 0<=x1<x2<=ancho y 0<=y1<y2<=alto")
        box = np.array([x1, y1, x2, y2], dtype=np.float32)

    if points is not None and not isinstance(points, (list, tuple)):
        raise ValueError("points: se requiere una lista de puntos {x, y, label}")
    coords, labels = [], []
    for index, point in enumerate(points or []):
        field = f"points[{index}]"
        if not isinstance(point, Mapping) or not {"x", "y", "label"} <= point.keys():
            raise ValueError(f"{field}: se requieren x, y y label")
        x, y = (_coordinate(point[key], f"{field}.{key}") for key in ("x", "y"))
        if not (0 <= x < width and 0 <= y < height):
            raise ValueError(f"{field}: coordenadas fuera de la imagen")
        label = point["label"]
        if isinstance(label, bool) or not isinstance(label, Integral) or label not in (0, 1):
            raise ValueError(f"{field}.label: se requiere un entero 0 o 1")
        coords.append([x, y])
        labels.append(label)
    if box is None and not coords:
        raise ValueError("selección vacía: proporciona box_xyxy o al menos un punto")
    return (np.array(pixels, copy=True), box,
            np.array(coords, dtype=np.float32) if coords else None,
            np.array(labels, dtype=np.int32) if labels else None)


def segment(image, box_xyxy=None, points=None, *, device="cpu", checkpoint=None):
    """Devuelve (máscara bool H×W, puntuación float) sin modificar la imagen.

    image: imagen RGB PIL o ndarray; box_xyxy: píxeles [x1,y1,x2,y2];
    points: lista de {x, y, label}, donde label es el entero 1/0. Debe haber
    caja válida o puntos; puntos vacíos son opcionales si hay caja. Las entradas
    inválidas lanzan ValueError antes de cargar SAM. ndarray debe ser uint8.
    """
    if device not in ("cpu", "cuda"):
        raise ValueError("device debe ser cpu o cuda")
    try:
        import numpy as np
    except ImportError as error:
        raise ServiceUnavailableError("servicio no disponible: falta NumPy") from error

    pixels, box, coords, labels = _validate_inputs(image, box_xyxy, points, np)
    try:
        import torch
    except ImportError as error:
        raise ServiceUnavailableError("servicio no disponible: falta PyTorch") from error

    checkpoint = Path(checkpoint).resolve() if checkpoint is not None else _CHECKPOINT
    predictor, lock = _get_predictor(device, checkpoint)
    # set_image/predict comparten estado mutable: cada selección es atómica.
    with lock, torch.inference_mode():
        predictor.set_image(pixels)
        masks, scores, _ = predictor.predict(
            point_coords=coords, point_labels=labels, box=box, multimask_output=False,
        )
        best = int(np.argmax(scores))
        return masks[best].astype(bool), float(scores[best])
