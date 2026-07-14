# Shared Code - Calculadora Eléctrica RD

Este directorio contiene código compartido entre los diferentes servicios del monorepo.

## Estructura

```
shared/
├── types/       # Tipos TypeScript compartidos (interfaces, DTOs)
├── utils/       # Funciones utilitarias compartidas
└── configs/     # Configuraciones compartidas
```

## Estado Actual

**⚠️ En construcción**: Actualmente los servicios mantienen sus propios tipos y utilidades.
La migración de código compartido a este directorio está planificada para futuras iteraciones.

## Próximos Pasos

1. **Fase 1**: Identificar tipos duplicados entre backend y frontend
2. **Fase 2**: Crear paquetes npm compartidos con TypeScript
3. **Fase 3**: Configurar imports entre servicios usando workspaces
4. **Fase 4**: Migrar gradualmente tipos comunes (User, Project, Calculation, etc.)

## Tipos Candidatos para Compartir

- `User` - Definido en ambos servicios
- `Project` - Definido en ambos servicios  
- `Calculation` - Tipos de cálculos eléctricos
- `Auth` - Interfaces de autenticación
- `Plan` - Tipos relacionados con planos

## Consideraciones Técnicas

- Requiere configurar npm/yarn workspaces
- Necesita compilación TypeScript compartida
- Debe mantener compatibilidad con Python (plan-service)
- Considerar usar un paquete separado por dominio
