"""YOLOv8-based architectural space detector for electrical plans.

This module provides an optional ML-powered detector that uses YOLOv8 to
identify architectural spaces (rooms, areas) in electrical plan images.

The detector gracefully degrades when:
- The `ultralytics` package is not installed
- No trained model weights file is found at the configured path
- The model fails to load or run inference

In all degradation cases, the caller should fall back to the existing
OpenCV + heuristic-based detection pipeline.

## Training requirements

To use this detector, you need a trained YOLOv8 model (.pt file) that
recognizes architectural spaces in electrical plans. The expected classes
are defined in ``EXPECTED_CLASSES`` below.

### Dataset preparation

1. Collect electrical plan images (PDF pages rendered as images at 300 DPI)
2. Label spaces using a tool like LabelImg, Roboflow, or CVAT
3. Export in YOLOv8 format (images + labels in YOLO txt format)
4. Split into train/val/test (recommended: 70/20/10)

### Expected classes

The model should be trained to detect these architectural space types:

| Class ID | Name              | Description                          |
|----------|-------------------|--------------------------------------|
| 0        | bedroom           | Dormitorio / habitación              |
| 1        | bathroom          | Baño                                 |
| 2        | kitchen           | Cocina                               |
| 3        | living_room       | Sala / estar                         |
| 4        | dining_room       | Comedor                              |
| 5        | hallway           | Pasillo / distribución               |
| 6        | garage            | Garaje                               |
| 7        | laundry           | Lavandería / área de lavado          |
| 8        | office            | Oficina / estudio                    |
| 9        | storage           | Almacén / depósito                   |
| 10       | balcony           | Balcón / terraza                     |
| 11       | stairs            | Escaleras                            |
| 12       | electrical_panel  | Panel eléctrico / tablero            |
| 13       | window            | Ventana                              |
| 14       | door              | Puerta                               |

### Training command

```bash
yolo task=detect mode=train model=yolov8n.pt data=dataset.yaml epochs=100 imgsz=640
```

### dataset.yaml example

```yaml
path: /path/to/dataset
train: images/train
val: images/val
test: images/test

names:
  0: bedroom
  1: bathroom
  2: kitchen
  3: living_room
  4: dining_room
  5: hallway
  6: garage
  7: laundry
  8: office
  9: storage
  10: balcony
  11: stairs
  12: electrical_panel
  13: window
  14: door
```
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

EXPECTED_CLASSES: list[str] = [
    "bedroom",
    "bathroom",
    "kitchen",
    "living_room",
    "dining_room",
    "hallway",
    "garage",
    "laundry",
    "office",
    "storage",
    "balcony",
    "stairs",
    "electrical_panel",
    "window",
    "door",
]


@dataclass
class Detection:
    """A single detected object in an image."""

    class_id: int
    class_name: str
    confidence: float
    bbox: tuple[float, float, float, float]  # x1, y1, x2, y2 in pixels
    area_px: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "class_id": self.class_id,
            "class_name": self.class_name,
            "confidence": round(self.confidence, 4),
            "bbox": {
                "x1": round(self.bbox[0], 2),
                "y1": round(self.bbox[1], 2),
                "x2": round(self.bbox[2], 2),
                "y2": round(self.bbox[3], 2),
            },
            "area_px": round(self.area_px, 2),
        }


@dataclass
class DetectionResult:
    """Result from a YOLOv8 inference run."""

    detections: list[Detection] = field(default_factory=list)
    image_width: int = 0
    image_height: int = 0
    model_name: str = ""
    inference_time_ms: float = 0.0

    @property
    def spaces(self) -> list[Detection]:
        """Return only space-type detections (rooms/areas)."""
        space_classes = {
            "bedroom",
            "bathroom",
            "kitchen",
            "living_room",
            "dining_room",
            "hallway",
            "garage",
            "laundry",
            "office",
            "storage",
            "balcony",
            "stairs",
        }
        return [d for d in self.detections if d.class_name in space_classes]

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "detections": [d.to_dict() for d in self.detections],
            "spaces": [d.to_dict() for d in self.spaces],
            "image_width": self.image_width,
            "image_height": self.image_height,
            "model_name": self.model_name,
            "inference_time_ms": round(self.inference_time_ms, 2),
            "total_detections": len(self.detections),
            "total_spaces": len(self.spaces),
        }


class YOLOv8Detector:
    """Optional YOLOv8-based detector for architectural spaces.

    This detector gracefully degrades when the model or dependencies
    are not available. Use ``is_available`` to check before use.

    Args:
        model_path: Path to the trained YOLOv8 .pt weights file.
        confidence_threshold: Minimum confidence to accept a detection.
        device: Device to run inference on ('cpu', 'cuda:0', etc.).
    """

    def __init__(
        self,
        model_path: str | None = None,
        confidence_threshold: float = 0.5,
        device: str = "cpu",
    ) -> None:
        self._model_path = model_path
        self._confidence_threshold = confidence_threshold
        self._device = device
        self._model: Any = None
        self._available: bool | None = None

    @property
    def is_available(self) -> bool:
        """Check if YOLOv8 detection is available.

        Returns True only when:
        - The ``ultralytics`` package is installed
        - A model weights file exists at the configured path
        - The model loads successfully
        """
        if self._available is not None:
            return self._available

        # Check ultralytics is installed
        try:
            from ultralytics import YOLO  # noqa: F401
        except ImportError:
            logger.info(
                "ultralytics package not installed — YOLOv8 detector disabled. "
                "Install with: pip install ultralytics"
            )
            self._available = False
            return False

        # Check model file exists
        if not self._model_path:
            logger.info("No YOLOv8 model path configured — detector disabled")
            self._available = False
            return False

        model_file = Path(self._model_path)
        if not model_file.exists():
            logger.info(
                "YOLOv8 model file not found at %s — detector disabled. "
                "Train a model and place it at this path.",
                self._model_path,
            )
            self._available = False
            return False

        # Try to load the model
        try:
            from ultralytics import YOLO

            self._model = YOLO(str(model_file))
            self._available = True
            logger.info(
                "YOLOv8 detector loaded successfully from %s", self._model_path
            )
            return True
        except Exception as e:
            logger.warning(
                "Failed to load YOLOv8 model from %s: %s", self._model_path, e
            )
            self._available = False
            return False

    def detect(self, image_path: str) -> DetectionResult | None:
        """Run detection on an image file.

        Args:
            image_path: Path to the image file (PNG, JPG, etc.).

        Returns:
            DetectionResult with detected objects, or None if the detector
            is not available.
        """
        if not self.is_available:
            return None

        import time

        start = time.monotonic()

        try:
            results = self._model(
                image_path,
                conf=self._confidence_threshold,
                device=self._device,
                verbose=False,
            )
        except Exception as e:
            logger.error("YOLOv8 inference failed: %s", e)
            return None

        elapsed_ms = (time.monotonic() - start) * 1000

        detections: list[Detection] = []
        img_w, img_h = 0, 0

        for result in results:
            img_w = result.orig_shape[1] if result.orig_shape else 0
            img_h = result.orig_shape[0] if result.orig_shape else 0

            if result.boxes is None:
                continue

            for box in result.boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                area = (x2 - x1) * (y2 - y1)

                class_name = (
                    EXPECTED_CLASSES[cls_id]
                    if cls_id < len(EXPECTED_CLASSES)
                    else f"class_{cls_id}"
                )

                detections.append(
                    Detection(
                        class_id=cls_id,
                        class_name=class_name,
                        confidence=conf,
                        bbox=(x1, y1, x2, y2),
                        area_px=area,
                    )
                )

        return DetectionResult(
            detections=detections,
            image_width=img_w,
            image_height=img_h,
            model_name=self._model_path or "unknown",
            inference_time_ms=elapsed_ms,
        )
