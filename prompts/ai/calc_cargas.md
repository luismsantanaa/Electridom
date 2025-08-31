# Plantilla: Cálculo de Cargas Eléctricas

## Contexto
Analiza los datos de carga eléctrica proporcionados y realiza los cálculos correspondientes según las normativas RIE-DO y NEC 2023.

## Datos de Entrada
- Configuración del sistema (tensión, fases, frecuencia)
- Lista de ambientes con áreas y tipos
- Lista de consumos con potencias y tipos

## Cálculos Requeridos

### 1. Demanda por Ambiente
- Carga unitaria según tipo de ambiente (VA/m²)
- Carga total por ambiente
- Factor de demanda aplicable

### 2. Demanda Total
- Suma de cargas diversificadas
- Factor de simultaneidad
- Demanda máxima probable

### 3. Corriente de Diseño
- Corriente calculada (A)
- Factor de corrección por temperatura
- Factor de agrupamiento si aplica

### 4. Selección de Conductores
- Sección mínima según corriente
- Caída de tensión máxima permitida
- Capacidad de corriente del conductor

### 5. Protecciones
- Interruptor principal
- Interruptores de circuito
- Coordinación de protecciones

## Formato de Respuesta JSON

```json
{
  "summary": "Análisis de cargas para instalación [tipo]",
  "calculations": {
    "demand": {
      "total_va": "Demanda total en VA",
      "diversified_va": "Demanda diversificada en VA",
      "current_a": "Corriente calculada en A"
    },
    "conductors": {
      "main_feeder": "Sección del alimentador principal",
      "branch_circuits": "Secciones de circuitos derivados"
    },
    "protections": {
      "main_breaker": "Interruptor principal",
      "branch_breakers": "Interruptores de circuito"
    }
  },
  "compliance": {
    "status": "compliant|non_compliant|warning",
    "issues": [
      "Problema 1: descripción",
      "Problema 2: descripción"
    ],
    "recommendations": [
      "Recomendación 1",
      "Recomendación 2"
    ]
  },
  "safety": {
    "level": "high|medium|low",
    "concerns": [
      "Preocupación de seguridad 1",
      "Preocupación de seguridad 2"
    ]
  },
  "references": {
    "normative": "RIE-DO Artículo X, NEC 2023 Artículo Y",
    "tables": "Tablas utilizadas para los cálculos"
  }
}
```

## Criterios de Evaluación

### Cumplimiento Normativo
- Verificar límites de corriente según tabla 310.16(B)(16)
- Validar caída de tensión máxima (3% para circuitos derivados, 2% para alimentadores)
- Confirmar capacidad de interruptores según 240.6(A)

### Seguridad
- Evaluar protección contra sobrecorriente
- Verificar coordinación de protecciones
- Analizar puesta a tierra del sistema

### Eficiencia
- Optimizar factor de demanda
- Minimizar pérdidas de energía
- Considerar expansión futura

## Notas Importantes

1. **Precisión**: Todos los cálculos deben ser verificables y seguir las metodologías establecidas
2. **Conservador**: En caso de duda, usar valores más conservadores
3. **Documentación**: Incluir referencias específicas a normativas y tablas utilizadas
4. **Recomendaciones**: Proporcionar sugerencias prácticas de mejora
