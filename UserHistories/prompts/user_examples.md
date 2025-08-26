# Ejemplos de Usuario - Eléctridom

## Ejemplo 1: Análisis de Alimentador

**Pregunta**: "Explica por qué el alimentador recomendado es #6 AWG con 20% más de longitud."

**Respuesta esperada**:

```json
{
	"summary": "El alimentador #6 AWG se selecciona basado en la corriente calculada y factores de corrección por temperatura y agrupación.",
	"recommendations": [
		{
			"title": "Verificación de capacidad del conductor",
			"description": "El conductor #6 AWG tiene capacidad de 65A a 75°C. Para 50A de carga, proporciona un margen de seguridad del 30%.",
			"priority": "medium",
			"category": "safety"
		},
		{
			"title": "Optimización de longitud",
			"description": "La longitud adicional del 20% considera rutas alternativas y futuras expansiones. Verificar que no exceda caída de tensión del 3%.",
			"priority": "low",
			"category": "efficiency"
		}
	]
}
```

## Ejemplo 2: Análisis de Demanda

**Pregunta**: "¿Es correcto el factor de demanda aplicado para esta instalación residencial?"

**Respuesta esperada**:

```json
{
	"summary": "El factor de demanda del 85% es apropiado para instalaciones residenciales según RIE RD Artículo 220.42.",
	"recommendations": [
		{
			"title": "Verificación de cargas especiales",
			"description": "Considerar cargas especiales como aires acondicionados, calentadores de agua y cocinas eléctricas que pueden requerir factores diferentes.",
			"priority": "high",
			"category": "compliance"
		}
	]
}
```

## Ejemplo 3: Selección de Protecciones

**Pregunta**: "¿Qué tipo de interruptor automático es más adecuado para esta aplicación?"

**Respuesta esperada**:

```json
{
	"summary": "Para cargas residenciales mixtas, se recomienda un interruptor termomagnético con características de disparo tipo C.",
	"recommendations": [
		{
			"title": "Protección contra sobrecorriente",
			"description": "El interruptor debe tener capacidad de interrupción mínima de 10kA según RIE RD. Verificar coordinación con interruptor principal.",
			"priority": "high",
			"category": "safety"
		}
	]
}
```

## Ejemplo 4: Puesta a Tierra

**Pregunta**: "¿La resistencia de tierra calculada cumple con las normativas?"

**Respuesta esperada**:

```json
{
	"summary": "La resistencia de tierra de 25 ohmios cumple con RIE RD que requiere máximo 25 ohmios para sistemas residenciales.",
	"recommendations": [
		{
			"title": "Monitoreo de resistencia",
			"description": "Implementar mediciones periódicas de resistencia de tierra, especialmente en épocas de sequía.",
			"priority": "medium",
			"category": "safety"
		}
	]
}
```

## Restricciones de Respuesta

- **Alcance**: Solo responder preguntas relacionadas con instalaciones eléctricas
- **Concisión**: Proporcionar respuestas directas y esenciales
- **Optimización**: Minimizar uso de tokens manteniendo claridad técnica
- **Enfoque**: Priorizar información relevante sobre explicaciones extensas
