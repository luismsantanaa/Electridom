import { calculationFixtures } from './calculation-payloads';

export const projectFixtures = {
  // Proyectos válidos
  valid: {
    minimal: {
      projectName: 'Proyecto Test Mínimo',
      description: 'Proyecto de prueba con datos mínimos',
      superficies: [{ ambiente: 'Sala', areaM2: 18.5 }],
      consumos: [{ nombre: 'Televisor', ambiente: 'Sala', watts: 120 }],
      opciones: { tensionV: 120, monofasico: true },
      computeNow: true,
    },
    complete: {
      projectName: 'Residencia Completa',
      description: 'Proyecto residencial completo con múltiples ambientes',
      superficies: [
        { ambiente: 'Sala', areaM2: 25.0 },
        { ambiente: 'Cocina', areaM2: 15.0 },
        { ambiente: 'Dormitorio 1', areaM2: 12.0 },
        { ambiente: 'Dormitorio 2', areaM2: 10.0 },
        { ambiente: 'Baño', areaM2: 6.0 },
      ],
      consumos: [
        { nombre: 'Televisor', ambiente: 'Sala', watts: 120 },
        { nombre: 'Lámpara', ambiente: 'Sala', watts: 60 },
        { nombre: 'Refrigerador', ambiente: 'Cocina', watts: 800 },
        { nombre: 'Microondas', ambiente: 'Cocina', watts: 1200 },
        { nombre: 'Lámpara', ambiente: 'Dormitorio 1', watts: 60 },
        { nombre: 'Ventilador', ambiente: 'Dormitorio 1', watts: 80 },
        { nombre: 'Lámpara', ambiente: 'Dormitorio 2', watts: 60 },
        { nombre: 'Secador', ambiente: 'Baño', watts: 1500 },
      ],
      opciones: { tensionV: 120, monofasico: true },
      computeNow: true,
    },
    withoutCalculation: {
      projectName: 'Proyecto Sin Cálculo',
      description: 'Proyecto creado sin cálculo inicial',
      superficies: [],
      consumos: [],
      computeNow: false,
    },
  },

  // Proyectos inválidos
  invalid: {
    emptyName: {
      projectName: '',
      description: 'Proyecto con nombre vacío',
      superficies: [{ ambiente: 'Sala', areaM2: 18.5 }],
      consumos: [{ nombre: 'Televisor', ambiente: 'Sala', watts: 120 }],
      opciones: { tensionV: 120, monofasico: true },
      computeNow: true,
    },
    missingName: {
      description: 'Proyecto sin nombre',
      superficies: [{ ambiente: 'Sala', areaM2: 18.5 }],
      consumos: [{ nombre: 'Televisor', ambiente: 'Sala', watts: 120 }],
      opciones: { tensionV: 120, monofasico: true },
      computeNow: true,
    },
    invalidCalculationData: {
      projectName: 'Proyecto Datos Inválidos',
      description: 'Proyecto con datos de cálculo inválidos',
      superficies: [{ ambiente: 'Sala', areaM2: -10 }], // Área negativa
      consumos: [{ nombre: 'Televisor', ambiente: 'Sala', watts: -100 }], // Watts negativos
      opciones: { tensionV: 120, monofasico: true },
      computeNow: true,
    },
  },

  // Datos para versiones
  versions: {
    version1: {
      superficies: [
        { ambiente: 'Sala', areaM2: 20.0 },
        { ambiente: 'Cocina', areaM2: 12.0 },
      ],
      consumos: [
        { nombre: 'Televisor', ambiente: 'Sala', watts: 120 },
        { nombre: 'Refrigerador', ambiente: 'Cocina', watts: 800 },
      ],
      opciones: { tensionV: 120, monofasico: true },
    },
    version2: {
      superficies: [
        { ambiente: 'Sala', areaM2: 20.0 },
        { ambiente: 'Cocina', areaM2: 12.0 },
        { ambiente: 'Dormitorio', areaM2: 15.0 }, // Nuevo ambiente
      ],
      consumos: [
        { nombre: 'Televisor', ambiente: 'Sala', watts: 120 },
        { nombre: 'Refrigerador', ambiente: 'Cocina', watts: 800 },
        { nombre: 'Lámpara', ambiente: 'Dormitorio', watts: 60 }, // Nuevo consumo
      ],
      opciones: { tensionV: 120, monofasico: true },
    },
    version3: {
      superficies: [
        { ambiente: 'Sala', areaM2: 22.0 }, // Área modificada
        { ambiente: 'Cocina', areaM2: 12.0 },
        { ambiente: 'Dormitorio', areaM2: 15.0 },
      ],
      consumos: [
        { nombre: 'Televisor', ambiente: 'Sala', watts: 150 }, // Watts modificados
        { nombre: 'Refrigerador', ambiente: 'Cocina', watts: 800 },
        { nombre: 'Lámpara', ambiente: 'Dormitorio', watts: 60 },
      ],
      opciones: { tensionV: 120, monofasico: true },
    },
  },

  // Datos para actualización de proyectos
  updates: {
    nameOnly: {
      projectName: 'Proyecto Actualizado',
    },
    descriptionOnly: {
      description: 'Descripción actualizada del proyecto',
    },
    statusOnly: {
      status: 'ARCHIVED',
    },
    complete: {
      projectName: 'Proyecto Completamente Actualizado',
      description: 'Descripción completamente actualizada',
      status: 'ACTIVE',
    },
  },
};

// Datos de usuario para tests
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
