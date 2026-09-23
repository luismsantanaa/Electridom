"""Dataset class mapping — FloorPlanCAD 28 classes to our 15 space classes.

FloorPlanCAD detects objects (doors, windows, furniture), not rooms directly.
We map objects to the rooms they belong to:

- Objects found in bathrooms → bathroom class
- Objects found in kitchens → kitchen class
- Objects found in bedrooms → bedroom class
- etc.

For YOLOv8 training, we'll use the original 28 object classes for detection,
then infer room types from detected objects in a post-processing step.

This file defines both mappings for reference.
"""

# FloorPlanCAD original 28 classes
FLOORPLAN_CAD_CLASSES = {
    0: "single_door",
    1: "double_door",
    2: "sliding_door",
    3: "window",
    4: "bay_window",
    5: "blind_window",
    6: "opening_symbol",
    7: "stair",
    8: "gas_stove",
    9: "refrigerator",
    10: "washing_machine",
    11: "sofa",
    12: "bed",
    13: "chair",
    14: "table",
    15: "bedside_cupboard",
    16: "tv_cabinet",
    17: "half_height_cabinet",
    18: "high_cabinet",
    19: "wardrobe",
    20: "sink",
    21: "bath",
    22: "bath_tub",
    23: "squat_toilet",
    24: "urinal",
    25: "toilet",
    26: "elevator",
    27: "escalator",
}

# Our 15 target classes (Spanish + English)
TARGET_CLASSES = {
    0: {"es": "dormitorio", "en": "bedroom", "objects": [12, 15, 19, 3, 4, 5]},
    1: {"es": "bano", "en": "bathroom", "objects": [20, 21, 22, 23, 24, 25, 3]},
    2: {"es": "cocina", "en": "kitchen", "objects": [8, 9, 20, 17, 18]},
    3: {"es": "sala", "en": "living_room", "objects": [11, 16, 13, 14, 3]},
    4: {"es": "comedor", "en": "dining_room", "objects": [14, 13, 3]},
    5: {"es": "pasillo", "en": "hallway", "objects": [0, 1, 2]},
    6: {"es": "garaje", "en": "garage", "objects": []},
    7: {"es": "lavanderia", "en": "laundry", "objects": [10, 20]},
    8: {"es": "oficina", "en": "office", "objects": [13, 14, 18]},
    9: {"es": "almacen", "en": "storage", "objects": [17, 18, 19]},
    10: {"es": "balcon", "en": "balcony", "objects": [3, 4]},
    11: {"es": "escaleras", "en": "stairs", "objects": [7, 27]},
    12: {"es": "panel_electrico", "en": "electrical_panel", "objects": []},
    13: {"es": "ventana", "en": "window", "objects": [3, 4, 5]},
    14: {"es": "puerta", "en": "door", "objects": [0, 1, 2]},
}

# Object-to-room inference rules
# When these objects are detected, infer the presence of these room types
OBJECT_TO_ROOM_INFERENCE = {
    # Bathroom indicators
    20: "bano",       # sink (could be kitchen too)
    21: "bano",       # bath
    22: "bano",       # bath_tub
    23: "bano",       # squat_toilet
    24: "bano",       # urinal
    25: "bano",       # toilet
    # Bedroom indicators
    12: "dormitorio", # bed
    15: "dormitorio", # bedside_cupboard
    19: "dormitorio", # wardrobe
    # Kitchen indicators
    8: "cocina",      # gas_stove
    9: "cocina",      # refrigerator
    # Living room indicators
    11: "sala",       # sofa
    16: "sala",       # tv_cabinet
    # Laundry indicators
    10: "lavanderia", # washing_machine
    # Stairs
    7: "escaleras",   # stair
    27: "escaleras",  # escalator
}


def get_dataset_yaml_content():
    """Generate dataset.yaml content for YOLOv8 training with original 28 classes."""
    return {
        "path": "models/training/FloorPlanCAD/FloorPlanCAD_YOLOv8_Full",
        "train": "images",
        "val": "images",
        "names": FLOORPLAN_CAD_CLASSES,
    }


def get_target_dataset_yaml_content():
    """Generate dataset.yaml content for YOLOv8 training with our 15 classes."""
    return {
        "path": "models/training/dataset",
        "train": "images/train",
        "val": "images/val",
        "names": {i: cls["en"] for i, cls in TARGET_CLASSES.items()},
    }
