"""YOLOv8 Training Script — trains a model for architectural space detection.

Usage:
    python scripts/train_yolov8.py --data models/training/dataset/dataset.yaml

Requirements:
    pip install ultralytics
    GPU with 4GB+ VRAM recommended
"""

import argparse
import sys
from pathlib import Path

# Our 15 target classes
CLASS_NAMES = [
    "dormitorio",    # 0 - bedroom
    "bano",          # 1 - bathroom
    "cocina",        # 2 - kitchen
    "sala",          # 3 - living_room
    "comedor",       # 4 - dining_room
    "pasillo",       # 5 - hallway
    "garaje",        # 6 - garage
    "lavanderia",    # 7 - laundry
    "oficina",       # 8 - office
    "almacen",       # 9 - storage
    "balcon",        # 10 - balcony
    "escaleras",     # 11 - stairs
    "panel_electrico", # 12 - electrical_panel
    "ventana",       # 13 - window
    "puerta",        # 14 - door
]


def train_yolov8(
    data_yaml: str,
    model_size: str = "n",
    epochs: int = 100,
    imgsz: int = 640,
    batch: int = 16,
    device: str = "0",
    project: str = "models/training/runs",
    name: str = "yolov8_spaces",
):
    """Train YOLOv8 model for architectural space detection."""
    try:
        from ultralytics import YOLO
    except ImportError:
        print("Error: ultralytics not installed. Run: pip install ultralytics")
        return None

    print(f"\n{'='*60}")
    print("YOLOv8 Training — Architectural Space Detection")
    print(f"{'='*60}")
    print(f"  Data:      {data_yaml}")
    print(f"  Model:     YOLOv8{model_size}")
    print(f"  Epochs:    {epochs}")
    print(f"  Image:     {imgsz}x{imgsz}")
    print(f"  Batch:     {batch}")
    print(f"  Device:    {device}")
    print(f"  Classes:   {len(CLASS_NAMES)}")
    print(f"{'='*60}\n")

    # Load pretrained model
    model_name = f"yolov8{model_size}.pt"
    print(f"Loading pretrained model: {model_name}")
    model = YOLO(model_name)

    # Train
    print("\nStarting training...\n")
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        device=device,
        project=project,
        name=name,
        exist_ok=True,
        pretrained=True,
        optimizer="auto",
        verbose=True,
        seed=42,
        # Augmentation
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=10.0,
        translate=0.1,
        scale=0.5,
        flipud=0.5,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.2,
    )

    print(f"\n{'='*60}")
    print("Training Complete!")
    print(f"{'='*60}")
    print(f"  Results: {project}/{name}")
    print(f"  Best weights: {project}/{name}/weights/best.pt")
    print(f"  Last weights: {project}/{name}/weights/last.pt")
    print(f"{'='*60}")

    return results


def validate_model(model_path: str, data_yaml: str, device: str = "0"):
    """Validate trained model on validation set."""
    try:
        from ultralytics import YOLO
    except ImportError:
        print("Error: ultralytics not installed")
        return None

    print(f"\nValidating model: {model_path}")
    model = YOLO(model_path)
    results = model.val(data=data_yaml, device=device)

    print(f"\nValidation Results:")
    print(f"  mAP50:    {results.box.map50:.4f}")
    print(f"  mAP50-95: {results.box.map:.4f}")

    return results


def main():
    parser = argparse.ArgumentParser(
        description="Train YOLOv8 for architectural space detection"
    )
    parser.add_argument(
        "--data",
        required=True,
        help="Path to dataset.yaml",
    )
    parser.add_argument(
        "--model-size",
        default="n",
        choices=["n", "s", "m", "l", "x"],
        help="YOLOv8 model size (n=nano, s=small, m=medium, l=large, x=xlarge)",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=100,
        help="Number of training epochs",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=640,
        help="Input image size",
    )
    parser.add_argument(
        "--batch",
        type=int,
        default=16,
        help="Batch size (reduce if GPU OOM)",
    )
    parser.add_argument(
        "--device",
        default="0",
        help="Device (0 for GPU, cpu for CPU)",
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Run validation after training",
    )

    args = parser.parse_args()

    # Train
    results = train_yolov8(
        data_yaml=args.data,
        model_size=args.model_size,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
    )

    if results and args.validate:
        best_model = f"models/training/runs/yolov8_spaces/weights/best.pt"
        if Path(best_model).exists():
            validate_model(best_model, args.data, args.device)


if __name__ == "__main__":
    main()
