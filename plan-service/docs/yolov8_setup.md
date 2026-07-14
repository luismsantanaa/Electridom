# YOLOv8 Space Detector — Setup Guide

## Overview

The plan-service includes an optional YOLOv8-based detector for identifying architectural spaces in electrical plan images. This detector works alongside the existing OpenCV + heuristic pipeline as an ML-powered enrichment layer.

**Current status**: The detector scaffold is complete and integrated. To activate it, you need to:
1. Install the `ultralytics` package
2. Train a YOLOv8 model on labeled electrical plan data
3. Configure the model path in environment variables

## Architecture

```
PDF/DXF Input
     │
     ▼
┌─────────────────────┐
│  Type Detection      │  (vectorial / raster / mixed)
└─────────┬───────────┘
          │
     ┌────┴────┐
     ▼         ▼
┌────────┐ ┌──────────┐
│ Vector │ │  Raster   │
│ Parser │ │  Parser   │
└───┬────┘ └────┬─────┘
    │           │
    └─────┬─────┘
          ▼
┌─────────────────────┐
│  Space Classification│  (OpenCV + heuristics)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  YOLOv8 Enrichment   │  (optional — if model available)
│  Adds ML detections  │
│  to metadata         │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Vision API Fallback │  (optional — if confidence low)
└─────────────────────┘
```

## Setup Steps

### 1. Install Dependencies

```bash
cd plan-service
pip install ultralytics
```

Add to `requirements/base.txt`:
```
ultralytics>=8.1.0
```

### 2. Prepare Training Dataset

#### Collect Images
- Export electrical plan PDF pages as images at 300 DPI
- Target: 500+ images for reasonable accuracy
- Include variety: different scales, orientations, plan styles

#### Label Spaces
Use one of these labeling tools:
- [Roboflow](https://roboflow.com/) (recommended — easiest)
- [LabelImg](https://github.com/HumanSignal/labelImg)
- [CVAT](https://cvat.ai/)

#### Expected Classes

| Class ID | Name              | Description                     |
|----------|-------------------|---------------------------------|
| 0        | bedroom           | Dormitorio / habitación         |
| 1        | bathroom          | Baño                            |
| 2        | kitchen           | Cocina                          |
| 3        | living_room       | Sala / estar                    |
| 4        | dining_room       | Comedor                         |
| 5        | hallway           | Pasillo / distribución          |
| 6        | garage            | Garaje                          |
| 7        | laundry           | Lavandería                      |
| 8        | office            | Oficina / estudio               |
| 9        | storage           | Almacén / depósito              |
| 10       | balcony           | Balcón / terraza                |
| 11       | stairs            | Escaleras                       |
| 12       | electrical_panel  | Panel eléctrico / tablero       |
| 13       | window            | Ventana                         |
| 14       | door              | Puerta                          |

#### Export Format
Export in **YOLOv8 format** (images + labels as `.txt` files):
```
dataset/
├── images/
│   ├── train/
│   │   ├── plan_001.png
│   │   └── ...
│   ├── val/
│   │   ├── plan_071.png
│   │   └── ...
│   └── test/
│       ├── plan_091.png
│       └── ...
├── labels/
│   ├── train/
│   │   ├── plan_001.txt
│   │   └── ...
│   ├── val/
│   └── test/
└── dataset.yaml
```

#### dataset.yaml
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

### 3. Train the Model

```bash
# Basic training (recommended starting point)
yolo task=detect mode=train model=yolov8n.pt data=dataset.yaml epochs=100 imgsz=640 batch=16

# With augmentation for better generalization
yolo task=detect mode=train model=yolov8s.pt data=dataset.yaml \
  epochs=150 imgsz=640 batch=16 \
  augment=True \
  hsv_h=0.015 hsv_s=0.7 hsv_v=0.4 \
  degrees=10 translate=0.1 scale=0.5 \
  flipud=0.5 fliplr=0.5

# Export to ONNX for production (optional)
yolo export model=runs/detect/train/weights/best.pt format=onnx imgsz=640
```

### 4. Deploy the Model

Copy the trained model to the plan-service:

```bash
mkdir -p plan-service/models
cp runs/detect/train/weights/best.pt plan-service/models/yolov8_spaces.pt
```

### 5. Configure Environment

Add to `plan-service/.env`:

```env
YOLOV8_ENABLED=true
YOLOV8_MODEL_PATH=models/yolov8_spaces.pt
YOLOV8_CONFIDENCE_THRESHOLD=0.5
YOLOV8_DEVICE=cpu  # or 'cuda:0' for GPU
```

### 6. Verify

```python
from app.services.detection.yolov8_detector import YOLOv8Detector

detector = YOLOv8Detector(
    model_path="models/yolov8_spaces.pt",
    confidence_threshold=0.5,
)

print(f"Detector available: {detector.is_available}")

result = detector.detect("test_plan.png")
if result:
    print(f"Detected {len(result.spaces)} spaces")
    for space in result.spaces:
        print(f"  - {space.class_name} ({space.confidence:.2%})")
```

## Graceful Degradation

The detector is designed to fail gracefully:

| Condition | Behavior |
|-----------|----------|
| `ultralytics` not installed | Detector disabled, logs info message |
| Model file not found | Detector disabled, logs info message |
| Model fails to load | Detector disabled, logs warning |
| Inference fails | Returns None, logs error, pipeline continues |

The existing OpenCV + heuristic pipeline always runs regardless of YOLOv8 status.

## Performance Notes

- **Inference time**: ~50-200ms per image on CPU (yolov8n), ~10-30ms on GPU
- **Memory**: ~50MB RAM for model loading
- **Recommended model sizes**:
  - `yolov8n.pt` — fastest, good for development (3.2M params)
  - `yolov8s.pt` — balanced speed/accuracy (11.2M params)
  - `yolov8m.pt` — best accuracy, slower (25.9M params)

## Future Improvements

- [ ] Fine-tune on Dominican electrical plan styles
- [ ] Add detection of electrical symbols (outlets, switches, breakers)
- [ ] Integration with DXF pipeline for cross-validation
- [ ] Batch processing for multi-page plans
- [ ] Model versioning and A/B testing infrastructure
