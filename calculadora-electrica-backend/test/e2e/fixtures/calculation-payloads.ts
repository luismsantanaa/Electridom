export const calculationFixtures = {
  // Payload mínimo (1 environment, 1 load)
  minimal: {
    surfaces: [{ environment: 'Sala', areaM2: 18.5 }],
    consumptions: [{ name: 'Televisor', environment: 'Sala', watts: 120 }],
    opciones: { tensionV: 120, monofasico: true },
  },

  // Payload mediano (5 environments, 10 loads)
  medium: {
    surfaces: [
      { environment: 'Sala', areaM2: 18.5 },
      { environment: 'Dormitorio 1', areaM2: 12.0 },
      { environment: 'Dormitorio 2', areaM2: 10.5 },
      { environment: 'Cocina', areaM2: 15.0 },
      { environment: 'Baño', areaM2: 8.0 },
    ],
    consumptions: [
      { name: 'Televisor', environment: 'Sala', watts: 120 },
      { name: 'Lámpara', environment: 'Sala', watts: 60 },
      { name: 'Lámpara', environment: 'Dormitorio 1', watts: 60 },
      { name: 'Ventilador', environment: 'Dormitorio 1', watts: 80 },
      { name: 'Lámpara', environment: 'Dormitorio 2', watts: 60 },
      { name: 'Refrigerador', environment: 'Cocina', watts: 150 },
      { name: 'Microondas', environment: 'Cocina', watts: 1000 },
      { name: 'Lámpara', environment: 'Cocina', watts: 60 },
      { name: 'Secador', environment: 'Baño', watts: 1800 },
      { name: 'Lámpara', environment: 'Baño', watts: 40 },
    ],
    opciones: { tensionV: 120, monofasico: true },
  },

  // Payload grande (20+ environments, 50+ loads)
  large: {
    surfaces: [
      { environment: 'Sala', areaM2: 25.0 },
      { environment: 'Comedor', areaM2: 15.0 },
      { environment: 'Cocina', areaM2: 20.0 },
      { environment: 'Dormitorio Principal', areaM2: 18.0 },
      { environment: 'Dormitorio 1', areaM2: 12.0 },
      { environment: 'Dormitorio 2', areaM2: 12.0 },
      { environment: 'Dormitorio 3', areaM2: 10.0 },
      { environment: 'Baño Principal', areaM2: 8.0 },
      { environment: 'Baño 1', areaM2: 6.0 },
      { environment: 'Baño 2', areaM2: 6.0 },
      { environment: 'Lavandería', areaM2: 8.0 },
      { environment: 'Oficina', areaM2: 12.0 },
      { environment: 'Sala de TV', areaM2: 16.0 },
      { environment: 'Habitación de Servicio', areaM2: 8.0 },
      { environment: 'Closet Principal', areaM2: 6.0 },
      { environment: 'Closet 1', areaM2: 4.0 },
      { environment: 'Closet 2', areaM2: 4.0 },
      { environment: 'Closet 3', areaM2: 4.0 },
      { environment: 'Pasillo', areaM2: 10.0 },
      { environment: 'Terraza', areaM2: 15.0 },
      { environment: 'Garaje', areaM2: 25.0 },
    ],
    consumptions: [
      // Sala
      { name: 'TV LED 55"', environment: 'Sala', watts: 150 },
      { name: 'Lámpara Principal', environment: 'Sala', watts: 100 },
      { name: 'Lámpara Secundaria', environment: 'Sala', watts: 60 },
      { name: 'Ventilador Techo', environment: 'Sala', watts: 80 },
      { name: 'Aire Acondicionado', environment: 'Sala', watts: 1500 },

      // Comedor
      { name: 'Lámpara Comedor', environment: 'Comedor', watts: 80 },
      { name: 'Ventilador Comedor', environment: 'Comedor', watts: 60 },

      // Cocina
      { name: 'Refrigerador', environment: 'Cocina', watts: 200 },
      { name: 'Microondas', environment: 'Cocina', watts: 1200 },
      { name: 'Licuadora', environment: 'Cocina', watts: 300 },
      { name: 'Cafetera', environment: 'Cocina', watts: 900 },
      { name: 'Lámpara Cocina', environment: 'Cocina', watts: 100 },
      { name: 'Extractor', environment: 'Cocina', watts: 150 },

      // Dormitorio Principal
      { name: 'TV 32"', environment: 'Dormitorio Principal', watts: 80 },
      {
        name: 'Lámpara Principal',
        environment: 'Dormitorio Principal',
        watts: 60,
      },
      { name: 'Lámpara Mesa', environment: 'Dormitorio Principal', watts: 40 },
      {
        name: 'Aire Acondicionado',
        environment: 'Dormitorio Principal',
        watts: 1200,
      },
      { name: 'Ventilador', environment: 'Dormitorio Principal', watts: 60 },

      // Dormitorio 1
      { name: 'Lámpara Principal', environment: 'Dormitorio 1', watts: 60 },
      { name: 'Lámpara Mesa', environment: 'Dormitorio 1', watts: 40 },
      { name: 'Ventilador', environment: 'Dormitorio 1', watts: 60 },

      // Dormitorio 2
      { name: 'Lámpara Principal', environment: 'Dormitorio 2', watts: 60 },
      { name: 'Lámpara Mesa', environment: 'Dormitorio 2', watts: 40 },
      { name: 'Ventilador', environment: 'Dormitorio 2', watts: 60 },

      // Dormitorio 3
      { name: 'Lámpara Principal', environment: 'Dormitorio 3', watts: 60 },
      { name: 'Lámpara Mesa', environment: 'Dormitorio 3', watts: 40 },

      // Baños
      { name: 'Secador Cabello', environment: 'Baño Principal', watts: 1800 },
      { name: 'Lámpara Baño', environment: 'Baño Principal', watts: 40 },
      { name: 'Lámpara Baño', environment: 'Baño 1', watts: 40 },
      { name: 'Lámpara Baño', environment: 'Baño 2', watts: 40 },

      // Lavandería
      { name: 'Lavadora', environment: 'Lavandería', watts: 500 },
      { name: 'Secadora', environment: 'Lavandería', watts: 3000 },
      { name: 'Lámpara Lavandería', environment: 'Lavandería', watts: 60 },

      // Oficina
      { name: 'Computadora', environment: 'Oficina', watts: 300 },
      { name: 'Monitor', environment: 'Oficina', watts: 50 },
      { name: 'Impresora', environment: 'Oficina', watts: 100 },
      { name: 'Lámpara Oficina', environment: 'Oficina', watts: 60 },

      // Sala de TV
      { name: 'TV LED 65"', environment: 'Sala de TV', watts: 200 },
      { name: 'system de Sonido', environment: 'Sala de TV', watts: 150 },
      { name: 'Lámpara Sala TV', environment: 'Sala de TV', watts: 80 },

      // Otros
      {
        name: 'Lámpara Servicio',
        environment: 'Habitación de Servicio',
        watts: 60,
      },
      { name: 'Lámpara Closet', environment: 'Closet Principal', watts: 40 },
      { name: 'Lámpara Pasillo', environment: 'Pasillo', watts: 60 },
      { name: 'Lámpara Terraza', environment: 'Terraza', watts: 100 },
      { name: 'Lámpara Garaje', environment: 'Garaje', watts: 120 },
    ],
    opciones: { tensionV: 120, monofasico: true },
  },

  // Payloads inválidos para testing de errores
  invalid: {
    emptySuperficies: {
      surfaces: [],
      consumptions: [{ name: 'Test', environment: 'Sala', watts: 100 }],
      opciones: { tensionV: 120, monofasico: true },
    },

    negativeArea: {
      surfaces: [{ environment: 'Sala', areaM2: -10 }],
      consumptions: [{ name: 'Test', environment: 'Sala', watts: 100 }],
      opciones: { tensionV: 120, monofasico: true },
    },

    negativeWatts: {
      surfaces: [{ environment: 'Sala', areaM2: 10 }],
      consumptions: [{ name: 'Test', environment: 'Sala', watts: -100 }],
      opciones: { tensionV: 120, monofasico: true },
    },

    duplicateEnvironment: {
      surfaces: [
        { environment: 'Sala', areaM2: 10 },
        { environment: 'Sala', areaM2: 15 },
      ],
      consumptions: [{ name: 'Test', environment: 'Sala', watts: 100 }],
      opciones: { tensionV: 120, monofasico: true },
    },

    consumptionInNonExistentEnvironment: {
      surfaces: [{ environment: 'Sala', areaM2: 10 }],
      consumptions: [{ name: 'Test', environment: 'Cocina', watts: 100 }],
      opciones: { tensionV: 120, monofasico: true },
    },

    invalidTension: {
      surfaces: [{ environment: 'Sala', areaM2: 10 }],
      consumptions: [{ name: 'Test', environment: 'Sala', watts: 100 }],
      opciones: { tensionV: 0, monofasico: true },
    },

    missingRequiredFields: {
      surfaces: [{ environment: 'Sala' }], // Falta areaM2
      consumptions: [{ name: 'Test', environment: 'Sala' }], // Falta watts
      opciones: { tensionV: 120 }, // Falta monofasico
    },
  },
};
