import { calculationFixtures } from './calculation-payloads';

export const projectFixtures = {
  // projects válidos
  valid: {
    minimal: {
      projectName: 'project Test Mínimo',
      description: 'project de prueba con datos mínimos',
      surfaces: [{ environment: 'Sala', areaM2: 18.5 }],
      consumptions: [{ name: 'Televisor', environment: 'Sala', watts: 120 }],
      opciones: { tensionV: 120, monofasico: true },
      computeNow: true,
    },
    complete: {
      projectName: 'Residencia Completa',
      description: 'project residencial completo con múltiples environments',
      surfaces: [
        { environment: 'Sala', areaM2: 25.0 },
        { environment: 'Cocina', areaM2: 15.0 },
        { environment: 'Dormitorio 1', areaM2: 12.0 },
        { environment: 'Dormitorio 2', areaM2: 10.0 },
        { environment: 'Baño', areaM2: 6.0 },
      ],
      consumptions: [
        { name: 'Televisor', environment: 'Sala', watts: 120 },
        { name: 'Lámpara', environment: 'Sala', watts: 60 },
        { name: 'Refrigerador', environment: 'Cocina', watts: 800 },
        { name: 'Microondas', environment: 'Cocina', watts: 1200 },
        { name: 'Lámpara', environment: 'Dormitorio 1', watts: 60 },
        { name: 'Ventilador', environment: 'Dormitorio 1', watts: 80 },
        { name: 'Lámpara', environment: 'Dormitorio 2', watts: 60 },
        { name: 'Secador', environment: 'Baño', watts: 1500 },
      ],
      opciones: { tensionV: 120, monofasico: true },
      computeNow: true,
    },
    withoutCalculation: {
      projectName: 'project Sin Cálculo',
      description: 'project creado sin cálculo inicial',
      surfaces: [],
      consumptions: [],
      computeNow: false,
    },
  },

  // projects inválidos
  invalid: {
    emptyName: {
      projectName: '',
      description: 'project con name vacío',
      surfaces: [{ environment: 'Sala', areaM2: 18.5 }],
      consumptions: [{ name: 'Televisor', environment: 'Sala', watts: 120 }],
      opciones: { tensionV: 120, monofasico: true },
      computeNow: true,
    },
    missingName: {
      description: 'project sin name',
      surfaces: [{ environment: 'Sala', areaM2: 18.5 }],
      consumptions: [{ name: 'Televisor', environment: 'Sala', watts: 120 }],
      opciones: { tensionV: 120, monofasico: true },
      computeNow: true,
    },
    invalidCalculationData: {
      projectName: 'project Datos Inválidos',
      description: 'project con datos de cálculo inválidos',
      surfaces: [{ environment: 'Sala', areaM2: -10 }], // Área negativa
      consumptions: [{ name: 'Televisor', environment: 'Sala', watts: -100 }], // Watts negativos
      opciones: { tensionV: 120, monofasico: true },
      computeNow: true,
    },
  },

  // Datos para versiones
  versions: {
    version1: {
      surfaces: [
        { environment: 'Sala', areaM2: 20.0 },
        { environment: 'Cocina', areaM2: 12.0 },
      ],
      consumptions: [
        { name: 'Televisor', environment: 'Sala', watts: 120 },
        { name: 'Refrigerador', environment: 'Cocina', watts: 800 },
      ],
      opciones: { tensionV: 120, monofasico: true },
    },
    version2: {
      surfaces: [
        { environment: 'Sala', areaM2: 20.0 },
        { environment: 'Cocina', areaM2: 12.0 },
        { environment: 'Dormitorio', areaM2: 15.0 }, // Nuevo environment
      ],
      consumptions: [
        { name: 'Televisor', environment: 'Sala', watts: 120 },
        { name: 'Refrigerador', environment: 'Cocina', watts: 800 },
        { name: 'Lámpara', environment: 'Dormitorio', watts: 60 }, // Nuevo consumption
      ],
      opciones: { tensionV: 120, monofasico: true },
    },
    version3: {
      surfaces: [
        { environment: 'Sala', areaM2: 22.0 }, // Área modificada
        { environment: 'Cocina', areaM2: 12.0 },
        { environment: 'Dormitorio', areaM2: 15.0 },
      ],
      consumptions: [
        { name: 'Televisor', environment: 'Sala', watts: 150 }, // Watts modificados
        { name: 'Refrigerador', environment: 'Cocina', watts: 800 },
        { name: 'Lámpara', environment: 'Dormitorio', watts: 60 },
      ],
      opciones: { tensionV: 120, monofasico: true },
    },
  },

  // Datos para actualización de projects
  updates: {
    nameOnly: {
      projectName: 'project Actualizado',
    },
    descriptionOnly: {
      description: 'Descripción actualizada del project',
    },
    statusOnly: {
      status: 'ARCHIVED',
    },
    complete: {
      projectName: 'project Completamente Actualizado',
      description: 'Descripción completamente actualizada',
      status: 'ACTIVE',
    },
  },
};

// Datos de user para tests
export const userFixtures = {
  testUser: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  },
  adminUser: {
    username: 'admin',
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    firstName: 'Admin',
    lastName: 'User',
  },
};

// Datos de autenticación
export const authFixtures = {
  loginData: {
    username: 'testuser',
    password: 'TestPassword123!',
  },
  adminLoginData: {
    username: 'admin',
    password: 'AdminPassword123!',
  },
};
