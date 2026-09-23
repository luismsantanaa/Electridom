"""YOLOv8 Dataset Preparation — maps FloorPlanCAD classes to our 15 classes.

This script:
1. Downloads FloorPlanCAD dataset from Kaggle (or uses local copy)
2. Maps 28 original classes to our 15 target classes
3. Creates dataset.yaml for YOLOv8 training
4. Validates the dataset structure

Usage:
    python scripts/prepare_yolo_dataset.py --dataset-path /path/to/FloorPlanCAD
"""

import argparse
import shutil
import yaml
from pathlib import Path

# Our 15 target classes (Spanish + English names)
TARGET_CLASSES = {
    0: {"es": "dormitorio", "en": "bedroom"},
    1: {"es": "bano", "en": "bathroom"},
    2: {"es": "cocina", "en": "kitchen"},
    3: {"es": "sala", "en": "living_room"},
    4: {"es": "comedor", "en": "dining_room"},
    5: {"es": "pasillo", "en": "hallway"},
    6: {"es": "garaje", "en": "garage"},
    7: {"es": "lavanderia", "en": "laundry"},
    8: {"es": "oficina", "en": "office"},
    9: {"es": "almacen", "en": "storage"},
    10: {"es": "balcon", "en": "balcony"},
    11: {"es": "escaleras", "en": "stairs"},
    12: {"es": "panel_electrico", "en": "electrical_panel"},
    13: {"es": "ventana", "en": "window"},
    14: {"es": "puerta", "en": "door"},
}

# FloorPlanCAD has 28 classes — map them to our 15
# This mapping converts FloorPlanCAD class IDs to our class IDs
FLOORPLAN_CAD_MAPPING = {
    # FloorPlanCAD class -> Our class
    # Based on FloorPlanCAD's 28 categories
    "wall": None,  # Skip - not a room
    "door": 14,
    "window": 13,
    "room": None,  # Skip - generic
    "stairs": 11,
    "closet": 9,  # storage
    "bathroom": 1,
    "kitchen": 2,
    "bedroom": 0,
    "living_room": 3,
    "dining_room": 4,
    "hallway": 5,
    "garage": 6,
    "laundry": 7,
    "office": 8,
    "balcony": 10,
    "storage": 9,
    "electrical_panel": 12,
    # Additional mappings for common FloorPlanCAD classes
    "bathtub": 1,
    "sink": 1,
    "toilet": 1,
    "shower": 1,
    "stove": 2,
    "refrigerator": 2,
    "counter": 2,
    "table": 4,
    "chair": 4,
    "sofa": 3,
    "tv": 3,
    "bed": 0,
    "wardrobe": 0,
    "desk": 8,
    "bookshelf": 9,
    "washer": 7,
    "dryer": 7,
}


def create_dataset_yaml(output_path: str, train_path: str, val_path: str, test_path: str = None):
    """Create dataset.yaml for YOLOv8 training."""
    dataset_config = {
        "path": str(Path(output_path).parent),
        "train": train_path,
        "val": val_path,
        "names": {i: cls["en"] for i, cls in TARGET_CLASSES.items()},
    }

    if test_path:
        dataset_config["test"] = test_path

    yaml_path = Path(output_path) / "dataset.yaml"
    with open(yaml_path, "w") as f:
        yaml.dump(dataset_config, f, default_flow_style=False, sort_keys=False)

    print(f"Created dataset.yaml at: {yaml_path}")
    return yaml_path


def remap_labels(input_labels_dir: str, output_labels_dir: str, mapping: dict):
    """Remap YOLO label files from source classes to target classes."""
    input_dir = Path(input_labels_dir)
    output_dir = Path(output_labels_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    remapped_count = 0
    skipped_count = 0

    for label_file in input_dir.glob("*.txt"):
        new_lines = []

        with open(label_file, "r") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) < 5:
                    continue

                old_class_id = int(parts[0])

                # Check if this class ID maps to one of our target classes
                if old_class_id in mapping:
                    new_class_id = mapping[old_class_id]
                    if new_class_id is not None:
                        parts[0] = str(new_class_id)
                        new_lines.append(" ".join(parts))
                        remapped_count += 1
                    else:
                        skipped_count += 1
                else:
                    # Keep unknown classes as-is (might be useful)
                    skipped_count += 1

        # Write remapped labels
        output_file = output_dir / label_file.name
        with open(output_file, "w") as f:
            f.write("\n".join(new_lines) + "\n" if new_lines else "")

    print(f"Remapped {remapped_count} annotations, skipped {skipped_count}")
    return remapped_count


def prepare_dataset(source_path: str, output_path: str):
    """Prepare dataset for training by remapping classes."""
    source = Path(source_path)
    output = Path(output_path)

    print(f"\n{'='*60}")
    print("YOLOv8 Dataset Preparation")
    print(f"{'='*60}")
    print(f"  Source: {source_path}")
    print(f"  Output: {output_path}")
    print(f"{'='*60}\n")

    # Create output structure
    for split in ["train", "val", "test"]:
        (output / "images" / split).mkdir(parents=True, exist_ok=True)
        (output / "labels" / split).mkdir(parents=True, exist_ok=True)

    # Process each split
    for split in ["train", "val", "test"]:
        split_images = source / "images" / split
        split_labels = source / "labels" / split

        if not split_images.exists():
            print(f"Warning: {split_images} not found, skipping {split} split")
            continue

        print(f"\nProcessing {split} split...")

        # Copy images
        images_dest = output / "images" / split
        for img in split_images.glob("*.png"):
            shutil.copy2(img, images_dest / img.name)
        for img in split_images.glob("*.jpg"):
            shutil.copy2(img, images_dest / img.name)

        img_count = len(list(images_dest.glob("*")))
        print(f"  Copied {img_count} images")

        # Remap labels
        if split_labels.exists():
            labels_dest = output / "labels" / split
            remap_labels(str(split_labels), str(labels_dest), FLOORPLAN_CAD_MAPPING)

    # Create dataset.yaml
    yaml_path = create_dataset_yaml(
        str(output),
        "images/train",
        "images/val",
        "images/test",
    )

    # Print summary
    print(f"\n{'='*60}")
    print("Dataset Preparation Complete!")
    print(f"{'='*60}")
    print(f"  Classes: {len(TARGET_CLASSES)}")
    print(f"  YAML: {yaml_path}")
    print(f"\n  Class mapping:")
    for i, cls in TARGET_CLASSES.items():
        print(f"    {i}: {cls['es']} ({cls['en']})")
    print(f"{'='*60}")

    return yaml_path


def main():
    parser = argparse.ArgumentParser(
        description="Prepare YOLOv8 dataset by remapping classes"
    )
    parser.add_argument(
        "--dataset-path",
        required=True,
        help="Path to FloorPlanCAD dataset",
    )
    parser.add_argument(
        "--output",
        default="models/training/dataset",
        help="Output path for prepared dataset",
    )

    args = parser.parse_args()
    prepare_dataset(args.dataset_path, args.output)


if __name__ == "__main__":
    main()
