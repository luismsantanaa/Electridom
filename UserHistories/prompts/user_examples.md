# Ejemplos de Análisis de Cálculos Eléctricos

## Ejemplo 1: Análisis de Factor de Demanda

**Entrada:**
```json
{
  "input": {
    "cargas_por_categoria": [
      { "categoria": "iluminacion_general", "carga_bruta_va": 1200 },
      { "categoria": "tomacorrientes", "carga_bruta_va": 3000 }
    ],
    "parametros": { "tipo_instalacion": "residencial" }
  },
  "output": {
    "cargas_diversificadas": [
      { "categoria": "iluminacion_general", "carga_diversificada_va": 1200 },
      { "categoria": "tomacorrientes", "carga_diversificada_va": 1500 }
    ],
    "total_diversificado_va": 2700,
    "ahorro_va": 1500
  }
}
```

**Respuesta Esperada:**
```json
{
  "summary": "El factor de demanda aplicado es correcto para una instalación residencial. Se aplicó 100% para iluminación general y 50% para tomacorrientes, resultando en un ahorro de 1500 VA.",
  "recommendations": [
    {
      "priority": "medium",
      "category": "efficiency",
      "title": "Verificar factor de demanda para tomacorrientes",
      "description": "El factor de 50% para tomacorrientes es apropiado para residencial, pero verificar si hay cargas especiales que requieran consideración adicional.",
      "action": "Revisar si hay equipos de alta potencia que puedan operar simultáneamente",
      "reference": "NEC 220.53"
    }
  ]
}
```

## Ejemplo 2: Análisis de Caída de Tensión

**Entrada:**
```json
{
  "input": {
    "circuitos_ramales": [
      { "id": "CIRC-001", "corriente_a": 15, "longitud_m": 25, "conductor": "Cu 14 AWG" }
    ],
    "sistema": { "tension_v": 120, "phases": 1 }
  },
  "output": {
    "analisis_caida": [
      {
        "id": "CIRC-001",
        "caida_porcentual": 2.8,
        "limite_porcentual": 3.0,
        "cumple_limite": true
      }
    ]
  }
}
```

**Respuesta Esperada:**
```json
{
  "summary": "La caída de tensión del 2.8% está dentro del límite del 3% para circuitos ramales. El conductor Cu 14 AWG es apropiado para la corriente y longitud especificadas.",
  "recommendations": [
    {
      "priority": "low",
      "category": "efficiency",
      "title": "Considerar optimización de conductor",
      "description": "Aunque cumple con el límite, se podría considerar Cu 12 AWG para mayor margen de seguridad y mejor eficiencia.",
      "action": "Evaluar costo-beneficio de usar conductor de mayor calibre",
      "reference": "NEC 210.19(A)(1)"
    }
  ]
}
```

## Ejemplo 3: Análisis de Puesta a Tierra

**Entrada:**
```json
{
  "input": {
    "sistema": { "tension_v": 120, "phases": 1 },
    "alimentador": { "corriente_a": 100, "seccion_mm2": 35 },
    "parametros": { "main_breaker_amp": 150, "tipo_instalacion": "comercial" }
  },
  "output": {
    "dimensionamiento": {
      "conductor_egc": "Cu 8 AWG",
      "conductor_gec": "Cu 6 AWG",
      "resistencia_maxima": 25,
      "cumple_requisitos": true
    }
  }
}
```

**Respuesta Esperada:**
```json
{
  "summary": "El dimensionamiento de puesta a tierra es correcto. Cu 8 AWG para EGC y Cu 6 AWG para GEC cumplen con los requisitos para un breaker principal de 150A.",
  "recommendations": [
    {
      "priority": "high",
      "category": "safety",
      "title": "Verificar resistencia de tierra",
      "description": "Asegurar que la resistencia de tierra no exceda 25 ohmios según NEC 250.56.",
      "action": "Realizar medición de resistencia de tierra en campo",
      "reference": "NEC 250.56"
    }
  ]
}
```
