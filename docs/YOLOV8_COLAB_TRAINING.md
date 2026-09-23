# 🚀 Guía de Entrenamiento YOLOv8 en Google Colab

## 📋 Resumen

Esta guía te paso a paso cómo entrenar el modelo YOLOv8 para detección de espacios arquitectónicos usando **Google Colab con GPU gratuita**.

**Tiempo estimado:** 30-45 minutos

---

## 🎯 Requisitos

- ✅ Cuenta de Google (Gmail)
- ✅ Dataset FloorPlanCAD descargado (ya lo tienes en `models/training/FloorPlanCAD/`)
- ✅ Navegador web moderno

---

## 📦 Paso 1: Preparar el Dataset

### 1.1 Comprimir el dataset

El dataset está en `models/training/FloorPlanCAD/FloorPlanCAD_YOLOv8_Full/` con esta estructura:

```
FloorPlanCAD_YOLOv8_Full/
├── images/     ← 15,285 imágenes PNG
└── labels/     ← 15,285 archivos TXT (formato YOLO)
```

**En tu terminal (Windows PowerShell):**

```powershell
# Navegar al directorio del proyecto
cd "D:\My Repos\Git Repos\CalculadoraElectricaRD"

# Comprimir el dataset (crea un ZIP)
Compress-Archive -Path "models\training\FloorPlanCAD\FloorPlanCAD_YOLOv8_Full" -DestinationPath "models\training\FloorPlanCAD_YOLOv8_Full.zip" -Force
```

### 1.2 Verificar el ZIP

```powershell
# Verificar que el ZIP se creó correctamente
Get-Item "models\training\FloorPlanCAD_YOLOv8_Full.zip" | Select-Object Name, Length, LastWriteTime
```

Deberías ver un archivo de aproximadamente **600MB**.

---

## ☁️ Paso 2: Subir Dataset a Google Drive

### 2.1 Abrir Google Drive

1. Ve a [drive.google.com](https://drive.google.com)
2. Inicia sesión con tu cuenta de Google

### 2.2 Crear carpeta para el proyecto

1. Clic derecho → **Nueva carpeta**
2. Nombre: `YOLOv8-Training`
3. Dentro de esa carpeta, crea otra: `datasets`

### 2.3 Subir el dataset ZIP

1. Entra a la carpeta `datasets`
2. **Arrastra** el archivo `FloorPlanCAD_YOLOv8_Full.zip` desde tu explorador de archivos
3. Espera a que termine de subir (~5-10 minutos dependiendo de tu conexión)

### 2.4 Verificar la subida

Deberías tener:
```
YOLOv8-Training/
└── datasets/
    └── FloorPlanCAD_YOLOv8_Full.zip  ← ~600MB
```

---

## 📓 Paso 3: Crear Notebook en Google Colab

### 3.1 Abrir Google Colab

1. Ve a [colab.research.google.com](https://colab.research.google.com)
2. Clic en **"Nuevo notebook"** (New Notebook)

### 3.2 Configurar GPU

1. En el menú superior: **Entorno de ejecución** → **Cambiar tipo de entorno de ejecución**
2. En **Acelerador de hardware** selecciona: **T4 GPU**
3. Clic en **Guardar**

### 3.3 Renombrar el notebook

1. Clic en el título (arriba a la izquierda, dice "Sin título.ipynb")
2. Renombra a: `YOLOv8_Entrenamiento.ipynb`

---

## 🧪 Paso 4: Código del Notebook

Copia y pega cada bloque de código en **celdas separadas** del notebook.

### Celda 1: Verificar GPU

```python
# 🔍 Verificar que la GPU está disponible
import torch

print("=" * 50)
print("VERIFICACIÓN DE GPU")
print("=" * 50)
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")

if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_mem / 1024**3:.1f} GB")
    print("✅ GPU lista para entrenamiento")
else:
    print("❌ GPU NO disponible")
    print("Ve a: Entorno de ejecución → Cambiar tipo de entorno de ejecución → T4 GPU")
```

**Ejecuta esta celda** (Shift + Enter). Deberías ver algo como:
```
PyTorch version: 2.x.x
CUDA available: True
GPU: Tesla T4
Memory: 15.8 GB
✅ GPU lista para entrenamiento
```

### Celda 2: Instalar dependencias

```python
# 📦 Instalar YOLOv8 (Ultralytics)
!pip install ultralytics -q

import ultralytics
ultralytics.checks()
```

### Celda 3: Montar Google Drive

```python
# 💾 Montar Google Drive para acceder al dataset
from google.colab import drive
drive.mount('/content/drive')

import os

# Verificar que el dataset existe
dataset_zip = '/content/drive/MyDrive/YOLOv8-Training/datasets/FloorPlanCAD_YOLOv8_Full.zip'

if os.path.exists(dataset_zip):
    size_mb = os.path.getsize(dataset_zip) / (1024 * 1024)
    print(f"✅ Dataset encontrado: {size_mb:.1f} MB")
else:
    print(f"❌ Dataset NO encontrado en: {dataset_zip}")
    print("Verifica que el archivo ZIP está en la ruta correcta de Google Drive")
```

### Celda 4: Descomprimir dataset

```python
# 📂 Descomprimir dataset
import zipfile
import shutil

dataset_dir = '/content/dataset'

# Limpiar si existe
if os.path.exists(dataset_dir):
    shutil.rmtree(dataset_dir)

# Descomprimir
print("Descomprimiendo dataset...")
with zipfile.ZipFile(dataset_zip, 'r') as zip_ref:
    zip_ref.extractall('/content/')

# Renombrar para facilitar acceso
os.rename('/content/FloorPlanCAD_YOLOv8_Full', dataset_dir)

# Verificar estructura
images_dir = os.path.join(dataset_dir, 'images')
labels_dir = os.path.join(dataset_dir, 'labels')

n_images = len(os.listdir(images_dir))
n_labels = len(os.listdir(labels_dir))

print(f"✅ Dataset descomprimido:")
print(f"   Imágenes: {n_images}")
print(f"   Labels: {n_labels}")
print(f"   Directorio: {dataset_dir}")
```

### Celda 5: Crear configuración del dataset

```python
# 📝 Crear dataset.yaml para YOLOv8
import yaml

dataset_config = {
    'path': dataset_dir,
    'train': 'images',
    'val': 'images',
    'names': {
        0: 'single_door',
        1: 'double_door',
        2: 'sliding_door',
        3: 'window',
        4: 'bay_window',
        5: 'blind_window',
        6: 'opening_symbol',
        7: 'stair',
        8: 'gas_stove',
        9: 'refrigerator',
        10: 'washing_machine',
        11: 'sofa',
        12: 'bed',
        13: 'chair',
        14: 'table',
        15: 'bedside_cupboard',
        16: 'tv_cabinet',
        17: 'half_height_cabinet',
        18: 'high_cabinet',
        19: 'wardrobe',
        20: 'sink',
        21: 'bath',
        22: 'bath_tub',
        23: 'squat_toilet',
        24: 'urinal',
        25: 'toilet',
        26: 'elevator',
        27: 'escalator',
    }
}

yaml_path = '/content/dataset.yaml'
with open(yaml_path, 'w') as f:
    yaml.dump(dataset_config, f, default_flow_style=False, sort_keys=False)

print(f"✅ Configuración creada: {yaml_path}")
print(f"   Clases: {len(dataset_config['names'])}")
```

### Celda 6: Entrenar modelo YOLOv8

```python
# 🏋️ Entrenar YOLOv8n (Nano - ligero y rápido)
from ultralytics import YOLO

# Cargar modelo pre-entrenado
model = YOLO('yolov8n.pt')

# Entrenar
results = model.train(
    data=yaml_path,
    epochs=50,           # 50 epochs para buen balance tiempo/calidad
    imgsz=640,           # Tamaño de imagen
    batch=16,            # Batch size (T4 aguanta 16-32)
    device=0,            # GPU 0
    project='/content/runs',
    name='yolov8_spaces',
    exist_ok=True,
    pretrained=True,
    optimizer='auto',
    verbose=True,
    seed=42,
    # Augmentación de datos
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

print("\n✅ Entrenamiento completado!")
print(f"Resultados en: /content/runs/yolov8_spaces")
```

**Tiempo estimado:** 20-30 minutos con GPU T4

### Celda 7: Evaluar modelo

```python
# 📊 Evaluar modelo en el dataset de validación
from ultralytics import YOLO

# Cargar el mejor modelo entrenado
best_model = YOLO('/content/runs/yolov8_spaces/weights/best.pt')

# Evaluar
metrics = best_model.val(data=yaml_path)

print("\n" + "=" * 50)
print("RESULTADOS DE VALIDACIÓN")
print("=" * 50)
print(f"mAP50:    {metrics.box.map50:.4f}")
print(f"mAP50-95: {metrics.box.map:.4f}")
print("=" * 50)
```

### Celda 8: Probar con imagen de ejemplo

```python
# 🖼️ Probar detección con una imagen del dataset
import random
from PIL import Image
import matplotlib.pyplot as plt

# Seleccionar imagen aleatoria
images = os.listdir(images_dir)
random_img = random.choice(images)
img_path = os.path.join(images_dir, random_img)

# Ejecutar detección
results = best_model(img_path)

# Mostrar resultado
for r in results:
    im_array = r.plot()  # BGR
    im_array = im_array[:, :, ::-1]  # RGB
    
    plt.figure(figsize=(12, 8))
    plt.imshow(im_array)
    plt.title(f'Detección: {random_img}')
    plt.axis('off')
    plt.show()

    # Mostrar objetos detectados
    print(f"\nObjetos detectados en {random_img}:")
    for box in r.boxes:
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        name = dataset_config['names'][cls]
        print(f"  - {name}: {conf:.2%}")
```

### Celda 9: Copiar modelo a Google Drive

```python
# 💾 Guardar modelo en Google Drive
import shutil

# Crear directorio de modelos en Drive
models_dir = '/content/drive/MyDrive/YOLOv8-Training/models'
os.makedirs(models_dir, exist_ok=True)

# Copiar mejores pesos
src = '/content/runs/yolov8_spaces/weights/best.pt'
dst = os.path.join(models_dir, 'yolov8n_spaces.pt')

shutil.copy2(src, dst)

size_mb = os.path.getsize(dst) / (1024 * 1024)
print(f"✅ Modelo guardado en Google Drive:")
print(f"   Ruta: {dst}")
print(f"   Tamaño: {size_mb:.1f} MB")
print(f"\nPara usarlo en tu proyecto, copia este archivo a:")
print(f"   D:\\My Repos\\Git Repos\\CalculadoraElectricaRD\\models\\yolov8n_spaces.pt")
```

### Celda 10: Exportar resultados

```python
# 📦 Exportar todos los resultados a Google Drive
import shutil

results_src = '/content/runs/yolov8_spaces'
results_dst = '/content/drive/MyDrive/YOLOv8-Training/results'

if os.path.exists(results_dst):
    shutil.rmtree(results_dst)

shutil.copytree(results_src, results_dst)

print(f"✅ Resultados exportados a:")
print(f"   {results_dst}")
print(f"\nArchivos incluidos:")
for item in os.listdir(results_dst):
    print(f"   - {item}")
```

---

## 📥 Paso 5: Descargar el Modelo

### 5.1 Desde Google Drive

1. Ve a [drive.google.com](https://drive.google.com)
2. Navega a `YOLOv8-Training/models/`
3. Clic derecho en `yolov8n_spaces.pt` → **Descargar**

### 5.2 Copiar al proyecto

1. Copia el archivo descargado a:
   ```
   D:\My Repos\Git Repos\CalculadoraElectricaRD\models\yolov8n_spaces.pt
   ```

2. Actualiza la configuración en `plan-service/.env`:
   ```env
   YOLOV8_ENABLED=true
   YOLOV8_MODEL_PATH=models/yolov8n_spaces.pt
   ```

---

## 🧪 Paso 6: Probar en tu Proyecto

### 6.1 Verificar que el modelo carga

```python
# En tu plan-service, el orchestrator ya detectará el modelo automáticamente
# Solo verifica que el archivo existe:
import os
model_path = "models/yolov8n_spaces.pt"
print(f"Modelo: {'✅ Encontrado' if os.path.exists(model_path) else '❌ No encontrado'}")
```

### 6.2 Probar con un plano

El modelo se integrará automáticamente con el pipeline existente:

```
Plano → OpenCV (heurístico) + YOLOv8 (ML) → Espacios detectados
```

---

## ❓ Preguntas Frecuentes

### ¿Cuánto tiempo toma el entrenamiento?

- **Con GPU T4:** 20-30 minutos para 50 epochs
- **Con CPU:** 10-15 horas (no recomendado)

### ¿Qué pasa si se acaba el tiempo de Colab?

- Colab desconecta después de 12 horas o inactividad
- Los resultados se guardan en Google Drive (Paso 9)
- Puedes reconectar y continuar desde el último checkpoint

### ¿Puedo usar un modelo más grande?

Sí, pero consume más VRAM:
- `yolov8n.pt` - 6MB, ~2GB VRAM ✅ (recomendado para T4)
- `yolov8s.pt` - 22MB, ~4GB VRAM
- `yolov8m.pt` - 52MB, ~8GB VRAM

### ¿Cómo mejoro la precisión?

1. **Más epochs:** Cambia `epochs=50` a `epochs=100`
2. **Más datos:** Agrega tus propios planos etiquetados
3. **Modelo más grande:** Usa `yolov8s.pt` o `yolov8m.pt`
4. **Fine-tuning:** Re-entrena con tus planos específicos

---

## 📊 Referencia de Clases

El modelo detecta 28 tipos de objetos arquitectónicos:

| ID | Clase (EN) | Clase (ES) | Categoría |
|----|------------|------------|-----------|
| 0 | single_door | puerta_simple | Puerta |
| 1 | double_door | puerta_doble | Puerta |
| 2 | sliding_door | puerta_corredera | Puerta |
| 3 | window | ventana | Ventana |
| 4 | bay_window | ventana_bahía | Ventana |
| 5 | blind_window | ventana_persiana | Ventana |
| 6 | opening_symbol | simbolo_apertura | Apertura |
| 7 | stair | escalera | Escalera |
| 8 | gas_stove | estufa_gas | Cocina |
| 9 | refrigerator | refrigerador | Cocina |
| 10 | washing_machine | lavadora | Lavandería |
| 11 | sofa | sofá | Sala |
| 12 | bed | cama | Dormitorio |
| 13 | chair | silla | Mobiliario |
| 14 | table | mesa | Mobiliario |
| 15 | bedside_cupboard | mesa_noche | Dormitorio |
| 16 | tv_cabinet | mueble_tv | Sala |
| 17 | half_height_cabinet | gabinete_bajo | Almacén |
| 18 | high_cabinet | gabinete_alto | Almacén |
| 19 | wardrobe | armario | Dormitorio |
| 20 | sink | lavamanos | Baño/Cocina |
| 21 | bath | bañera | Baño |
| 22 | bath_tub | tina | Baño |
| 23 | squat_toilet | inodoro_chino | Baño |
| 24 | urinal | urinario | Baño |
| 25 | toilet | inodoro | Baño |
| 26 | elevator | elevador | Vertical |
| 27 | escalator | escalera_eléctrica | Vertical |

---

## 🔗 Enlaces Útiles

- [Google Colab](https://colab.research.google.com)
- [Google Drive](https://drive.google.com)
- [Ultralytics YOLOv8 Docs](https://docs.ultralytics.com)
- [FloorPlanCAD Dataset](https://www.kaggle.com/datasets/samirshabani/architecture)

---

**¡Éxito con el entrenamiento!** 🎉

Si tienes dudas, revisa las celdas de verificación (Celdas 1 y 7) para diagnosticar problemas.
