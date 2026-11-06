"""Segmentación SAM 2.1 Tiny reutilizable, sin guardar archivos ni redimensionar."""

from pathlib import Path
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


def segment(image, box_xyxy=None, points=None, *, device="cpu", checkpoint=None):
    """Devuelve (máscara bool H×W, puntuación float) sin modificar la imagen.

    image: imagen RGB PIL o ndarray; box_xyxy: píxeles [x1,y1,x2,y2];
    points: lista de {x, y, label}, donde label es 1/0. El modelo se conserva
    por dispositivo/ruta durante el proceso. La validación exhaustiva es T07.
    """
    if device not in ("cpu", "cuda"):
        raise ValueError("device debe ser cpu o cuda")
    try:
        import numpy as np
        import torch
    except ImportError as error:
        raise ServiceUnavailableError("servicio no disponible: faltan NumPy/PyTorch") from error

    checkpoint = Path(checkpoint).resolve() if checkpoint is not None else _CHECKPOINT
    predictor, lock = _get_predictor(device, checkpoint)
    coords = np.array([(p["x"], p["y"]) for p in points], dtype=np.float32) if points else None
    labels = np.array([p["label"] for p in points], dtype=np.int32) if points else None
    box = np.asarray(box_xyxy, dtype=np.float32) if box_xyxy is not None else None
    # set_image/predict comparten estado mutable: cada selección es atómica.
    with lock, torch.inference_mode():
        predictor.set_image(np.array(image, copy=True))
        masks, scores, _ = predictor.predict(
            point_coords=coords, point_labels=labels, box=box, multimask_output=False,
        )
        best = int(np.argmax(scores))
        return masks[best].astype(bool), float(scores[best])
