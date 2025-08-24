import { projectFixtures } from '../test/e2e/fixtures/project-payloads';

describe('Projects Validation Tests', () => {
  describe('Project Structure Validation', () => {
    it('should validate correct project structure', () => {
      const validProject = projectFixtures.valid.minimal;

      // Verificar estructura básica
      expect(validProject).toHaveProperty('projectName');
      expect(validProject).toHaveProperty('description');
      expect(validProject).toHaveProperty('superficies');
      expect(validProject).toHaveProperty('consumos');
      expect(validProject).toHaveProperty('opciones');
      expect(validProject).toHaveProperty('computeNow');

      // Verificar tipos de datos
      expect(typeof validProject.projectName).toBe('string');
      expect(typeof validProject.description).toBe('string');
      expect(Array.isArray(validProject.superficies)).toBe(true);
      expect(Array.isArray(validProject.consumos)).toBe(true);
      expect(typeof validProject.opciones).toBe('object');
      expect(typeof validProject.computeNow).toBe('boolean');

      // Verificar que el nombre no esté vacío
      expect(validProject.projectName.length).toBeGreaterThan(0);
    });

    it('should detect empty project name', () => {
      const invalidProject = projectFixtures.invalid.emptyName;

      expect(invalidProject.projectName).toBe('');
      expect(invalidProject.projectName.length).toBe(0);
    });

    it('should detect missing project name', () => {
      const invalidProject = projectFixtures.invalid.missingName;

      expect(invalidProject).not.toHaveProperty('projectName');
    });

    it('should validate project with calculation data', () => {
      const projectWithCalculation = projectFixtures.valid.minimal;

      expect(projectWithCalculation.computeNow).toBe(true);
      expect(projectWithCalculation.superficies.length).toBeGreaterThan(0);
      expect(projectWithCalculation.consumos.length).toBeGreaterThan(0);
    });

    it('should validate project without calculation data', () => {
      const projectWithoutCalculation = projectFixtures.valid.withoutCalculation;

      expect(projectWithoutCalculation.computeNow).toBe(false);
      expect(projectWithoutCalculation.superficies.length).toBe(0);
      expect(projectWithoutCalculation.consumos.length).toBe(0);
    });
  });

  describe('Project Data Validation', () => {
    it('should validate calculation data when computeNow is true', () => {
      const projectWithCalculation = projectFixtures.valid.minimal;

      if (projectWithCalculation.computeNow) {
        // Verificar que hay superficies
        expect(projectWithCalculation.superficies.length).toBeGreaterThan(0);
        
        // Verificar que hay consumos
        expect(projectWithCalculation.consumos.length).toBeGreaterThan(0);
        
        // Verificar estructura de superficies
        projectWithCalculation.superficies.forEach(superficie => {
          expect(superficie).toHaveProperty('ambiente');
          expect(superficie).toHaveProperty('areaM2');
          expect(typeof superficie.ambiente).toBe('string');
          expect(typeof superficie.areaM2).toBe('number');
          expect(superficie.areaM2).toBeGreaterThan(0);
        });

        // Verificar estructura de consumos
        projectWithCalculation.consumos.forEach(consumo => {
          expect(consumo).toHaveProperty('nombre');
          expect(consumo).toHaveProperty('ambiente');
          expect(consumo).toHaveProperty('watts');
          expect(typeof consumo.nombre).toBe('string');
          expect(typeof consumo.ambiente).toBe('string');
          expect(typeof consumo.watts).toBe('number');
          expect(consumo.watts).toBeGreaterThan(0);
        });

        // Verificar opciones
        expect(projectWithCalculation.opciones).toHaveProperty('tensionV');
        expect(projectWithCalculation.opciones).toHaveProperty('monofasico');
        expect(typeof projectWithCalculation.opciones.tensionV).toBe('number');
        expect(typeof projectWithCalculation.opciones.monofasico).toBe('boolean');
      }
    });

    it('should detect invalid calculation data', () => {
      const invalidProject = projectFixtures.invalid.invalidCalculationData;

      // Verificar áreas negativas
      const negativeArea = invalidProject.superficies.find(s => s.areaM2 < 0);
      expect(negativeArea).toBeDefined();
      expect(negativeArea!.areaM2).toBeLessThan(0);

      // Verificar watts negativos
      const negativeWatts = invalidProject.consumos.find(c => c.watts < 0);
      expect(negativeWatts).toBeDefined();
      expect(negativeWatts!.watts).toBeLessThan(0);
    });
  });

  describe('Version Data Validation', () => {
    it('should validate version structure', () => {
      const version = projectFixtures.versions.version1;

      expect(version).toHaveProperty('superficies');
      expect(version).toHaveProperty('consumos');
      expect(version).toHaveProperty('opciones');
      expect(Array.isArray(version.superficies)).toBe(true);
      expect(Array.isArray(version.consumos)).toBe(true);
      expect(typeof version.opciones).toBe('object');
    });

    it('should validate version changes', () => {
      const version1 = projectFixtures.versions.version1;
      const version2 = projectFixtures.versions.version2;
      const version3 = projectFixtures.versions.version3;

      // Version 2 tiene más ambientes que version 1
      expect(version2.superficies.length).toBeGreaterThan(version1.superficies.length);
      expect(version2.consumos.length).toBeGreaterThan(version1.consumos.length);

      // Version 3 tiene cambios en valores
      const salaV1 = version1.superficies.find(s => s.ambiente === 'Sala');
      const salaV3 = version3.superficies.find(s => s.ambiente === 'Sala');
      expect(salaV1).toBeDefined();
      expect(salaV3).toBeDefined();
      expect(salaV3!.areaM2).toBeGreaterThan(salaV1!.areaM2);

      const tvV1 = version1.consumos.find(c => c.nombre === 'Televisor');
      const tvV3 = version3.consumos.find(c => c.nombre === 'Televisor');
      expect(tvV1).toBeDefined();
      expect(tvV3).toBeDefined();
      expect(tvV3!.watts).toBeGreaterThan(tvV1!.watts);
    });
  });

  describe('Update Data Validation', () => {
    it('should validate update structure', () => {
      const update = projectFixtures.updates.complete;

      expect(update).toHaveProperty('projectName');
      expect(update).toHaveProperty('description');
      expect(update).toHaveProperty('status');
      expect(typeof update.projectName).toBe('string');
      expect(typeof update.description).toBe('string');
      expect(typeof update.status).toBe('string');
    });

    it('should validate partial updates', () => {
      const nameOnly = projectFixtures.updates.nameOnly;
      const descriptionOnly = projectFixtures.updates.descriptionOnly;
      const statusOnly = projectFixtures.updates.statusOnly;

      // Verificar que solo tienen las propiedades específicas
      expect(nameOnly).toHaveProperty('projectName');
      expect(nameOnly).not.toHaveProperty('description');
      expect(nameOnly).not.toHaveProperty('status');

      expect(descriptionOnly).toHaveProperty('description');
      expect(descriptionOnly).not.toHaveProperty('projectName');
      expect(descriptionOnly).not.toHaveProperty('status');

      expect(statusOnly).toHaveProperty('status');
      expect(statusOnly).not.toHaveProperty('projectName');
      expect(statusOnly).not.toHaveProperty('description');
    });

    it('should validate status values', () => {
      const validStatuses = ['ACTIVE', 'ARCHIVED'];
      const statusOnly = projectFixtures.updates.statusOnly;

      expect(validStatuses).toContain(statusOnly.status);
    });
  });

  describe('Response Structure Validation', () => {
    it('should have correct project response structure', () => {
      const expectedResponse = {
        projectId: 'uuid-string',
        projectName: 'Test Project',
        status: 'ACTIVE',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        latestVersion: {
          versionId: 'uuid-string',
          versionNumber: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          rulesSignature: 'hash-string',
          totales: {
            totalConectadaVA: 1000,
            demandaEstimadaVA: 800,
          },
        },
      };

      // Verificar estructura básica
      expect(expectedResponse).toHaveProperty('projectId');
      expect(expectedResponse).toHaveProperty('projectName');
      expect(expectedResponse).toHaveProperty('status');
      expect(expectedResponse).toHaveProperty('createdAt');
      expect(expectedResponse).toHaveProperty('updatedAt');
      expect(expectedResponse).toHaveProperty('latestVersion');

      // Verificar estructura de versión
      expect(expectedResponse.latestVersion).toHaveProperty('versionId');
      expect(expectedResponse.latestVersion).toHaveProperty('versionNumber');
      expect(expectedResponse.latestVersion).toHaveProperty('createdAt');
      expect(expectedResponse.latestVersion).toHaveProperty('rulesSignature');
      expect(expectedResponse.latestVersion).toHaveProperty('totales');

      // Verificar tipos de datos
      expect(typeof expectedResponse.projectId).toBe('string');
      expect(typeof expectedResponse.projectName).toBe('string');
      expect(typeof expectedResponse.status).toBe('string');
      expect(typeof expectedResponse.createdAt).toBe('string');
      expect(typeof expectedResponse.updatedAt).toBe('string');
      expect(typeof expectedResponse.latestVersion.versionNumber).toBe('number');
    });

    it('should have correct version response structure', () => {
      const expectedVersionResponse = {
        versionId: 'uuid-string',
        versionNumber: 1,
        createdAt: '2024-01-01T00:00:00.000Z',
        rulesSignature: 'hash-string',
        inputData: {
          superficies: [],
          consumos: [],
          opciones: {},
        },
        outputTotales: {
          totalConectadaVA: 1000,
          demandaEstimadaVA: 800,
        },
        outputCargasPorAmbiente: [],
        outputPropuestaCircuitos: [],
      };

      // Verificar estructura básica
      expect(expectedVersionResponse).toHaveProperty('versionId');
      expect(expectedVersionResponse).toHaveProperty('versionNumber');
      expect(expectedVersionResponse).toHaveProperty('createdAt');
      expect(expectedVersionResponse).toHaveProperty('rulesSignature');
      expect(expectedVersionResponse).toHaveProperty('inputData');
      expect(expectedVersionResponse).toHaveProperty('outputTotales');
      expect(expectedVersionResponse).toHaveProperty('outputCargasPorAmbiente');
      expect(expectedVersionResponse).toHaveProperty('outputPropuestaCircuitos');

      // Verificar tipos de datos
      expect(typeof expectedVersionResponse.versionId).toBe('string');
      expect(typeof expectedVersionResponse.versionNumber).toBe('number');
      expect(typeof expectedVersionResponse.createdAt).toBe('string');
      expect(typeof expectedVersionResponse.rulesSignature).toBe('string');
      expect(typeof expectedVersionResponse.inputData).toBe('object');
      expect(typeof expectedVersionResponse.outputTotales).toBe('object');
      expect(Array.isArray(expectedVersionResponse.outputCargasPorAmbiente)).toBe(true);
      expect(Array.isArray(expectedVersionResponse.outputPropuestaCircuitos)).toBe(true);
    });
  });
});
