"""DINOv2 ViT-S/14 oficial, local y sin descargas implícitas."""

import importlib.util
import json
import os
import sys
import threading

from .preprocess import PREPROCESS, prepare_image
from . import resources
from .segmentation import ServiceUnavailableError


TRANSFORM = {"resize": [224, 224], "interpolation": "PIL_bicubic",
             "mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]}
_CACHE = {}
_LOCK = threading.RLock()


def model_identity():
    info = resources.dino_manifest()
    return {"model": "dinov2_vits14", "dimension": 384,
            "revision": info["revision"], "weights_sha256": info["weights"]["sha256"],
            "source_sha256": info["source"]["tree_sha256"],
            "prepare": json.loads(json.dumps(PREPROCESS)), "transform": json.loads(json.dumps(TRANSFORM))}


def _get_model(device):
    import torch

    source, weights = resources.DINO_SOURCE, resources.DINO_WEIGHTS
    if not source.is_dir() or not weights.is_file():
        raise ServiceUnavailableError("servicio no disponible: faltan código/pesos DINO; ejecutar python -m ai.resources")
    if device == "cuda" and not torch.cuda.is_available():
        raise ServiceUnavailableError("servicio no disponible: CUDA no accesible")
    stat = weights.stat()
    key = (device, str(weights.resolve()), stat.st_size, stat.st_mtime_ns)
    with _LOCK:
        if key not in _CACHE:
            info = resources.dino_manifest()
            if (resources.sha256(weights) != info["weights"]["sha256"]
                    or resources.source_digest(source) != info["source"]["tree_sha256"]):
                raise ServiceUnavailableError("servicio no disponible: recursos DINO incompatibles")
            package = source / "dinov2/__init__.py"
            if "dinov2" in sys.modules:
                if sys.modules["dinov2"].__file__ != str(package):
                    raise ServiceUnavailableError("servicio no disponible: otro paquete dinov2 está cargado")
            else:
                spec = importlib.util.spec_from_file_location("dinov2", package,
                    submodule_search_locations=[str(package.parent)])
                module = importlib.util.module_from_spec(spec)
                sys.modules["dinov2"] = module
                spec.loader.exec_module(module)
            os.environ["XFORMERS_DISABLED"] = "1"
            from dinov2.hub.backbones import dinov2_vits14
            model = dinov2_vits14(pretrained=False)
            model.load_state_dict(torch.load(weights, map_location="cpu", weights_only=True), strict=True)
            model.eval().requires_grad_(False).to(device)
            _CACHE[key] = (model, threading.RLock())
        return _CACHE[key]


def embed(image, *, mask=None, device="cpu"):
    """RGB y máscara opcional → ndarray float32 normalizado de 384 componentes."""
    if device not in ("cpu", "cuda"):
        raise ValueError("device debe ser cpu o cuda")
    try:
        import numpy as np
        from PIL import Image
        import torch
    except ImportError as error:
        raise ServiceUnavailableError("servicio no disponible: faltan dependencias DINO") from error
    prepared = prepare_image(image, mask)
    pixels = np.asarray(prepared.resize((224, 224), Image.Resampling.BICUBIC), dtype=np.float32) / 255
    tensor = torch.from_numpy(np.moveaxis(pixels, -1, 0).copy())
    tensor = (tensor - torch.tensor(TRANSFORM["mean"])[:, None, None]) / torch.tensor(TRANSFORM["std"])[:, None, None]
    model, lock = _get_model(device)
    with lock, torch.inference_mode():
        vector = model(tensor.unsqueeze(0).to(device))[0].float().cpu().numpy().copy()
    norm = float(np.linalg.norm(vector))
    if vector.shape != (384,) or not np.isfinite(vector).all() or not np.isfinite(norm) or norm <= 0:
        raise RuntimeError("DINO devolvió un vector inválido")
    return (vector / norm).astype(np.float32)
