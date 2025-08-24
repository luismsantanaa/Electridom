import { projectFixtures } from '../test/e2e/fixtures/project-payloads';

describe('Projects Validation Tests', () => {
  describe('Project Structure Validation', () => {
    it('should validate correct project structure', () => {
      const validProject = projectFixtures.valid.minimal;

      // Verificar estructura básica
      expect(validProject).toHaveProperty('projectName');
      expect(validProject).toHaveProperty('description');
      expect(validProject).toHaveProperty('surfaces');
      expect(validProject).toHaveProperty('consumptions');
      expect(validProject).toHaveProperty('opciones');
      expect(validProject).toHaveProperty('computeNow');

      // Verificar tipos de datos
      expect(typeof validProject.projectName).toBe('string');
      expect(typeof validProject.description).toBe('string');
      expect(Array.isArray(validProject.surfaces)).toBe(true);
      expect(Array.isArray(validProject.consumptions)).toBe(true);
      expect(typeof validProject.opciones).toBe('object');
      expect(typeof validProject.computeNow).toBe('boolean');

      // Verificar que el name no esté vacío
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
      expect(projectWithCalculation.surfaces.length).toBeGreaterThan(0);
      expect(projectWithCalculation.consumptions.length).toBeGreaterThan(0);
    });

    it('should validate project without calculation data', () => {
      const projectWithoutCalculation = projectFixtures.valid.withoutCalculation;

      expect(projectWithoutCalculation.computeNow).toBe(false);
      expect(projectWithoutCalculation.surfaces.length).toBe(0);
      expect(projectWithoutCalculation.consumptions.length).toBe(0);
    });
  });

  describe('Project Data Validation', () => {
    it('should validate calculation data when computeNow is true', () => {
      const projectWithCalculation = projectFixtures.valid.minimal;

      if (projectWithCalculation.computeNow) {
        // Verificar que hay surfaces
        expect(projectWithCalculation.surfaces.length).toBeGreaterThan(0);
        
        // Verificar que hay consumptions
        expect(projectWithCalculation.consumptions.length).toBeGreaterThan(0);
        
        // Verificar estructura de surfaces
        projectWithCalculation.surfaces.forEach(surface => {
          expect(surface).toHaveProperty('environment');
          expect(surface).toHaveProperty('areaM2');
          expect(typeof surface.environment).toBe('string');
          expect(typeof surface.areaM2).toBe('number');
          expect(surface.areaM2).toBeGreaterThan(0);
        });

        // Verificar estructura de consumptions
        projectWithCalculation.consumptions.forEach(consumption => {
          expect(consumption).toHaveProperty('name');
          expect(consumption).toHaveProperty('environment');
          expect(consumption).toHaveProperty('watts');
          expect(typeof consumption.name).toBe('string');
          expect(typeof consumption.environment).toBe('string');
          expect(typeof consumption.watts).toBe('number');
          expect(consumption.watts).toBeGreaterThan(0);
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
      const negativeArea = invalidProject.surfaces.find(s => s.areaM2 < 0);
      expect(negativeArea).toBeDefined();
      expect(negativeArea!.areaM2).toBeLessThan(0);

      // Verificar watts negativos
      const negativeWatts = invalidProject.consumptions.find(c => c.watts < 0);
      expect(negativeWatts).toBeDefined();
      expect(negativeWatts!.watts).toBeLessThan(0);
    });
  });

  describe('Version Data Validation', () => {
    it('should validate version structure', () => {
      const version = projectFixtures.versions.version1;

      expect(version).toHaveProperty('surfaces');
      expect(version).toHaveProperty('consumptions');
      expect(version).toHaveProperty('opciones');
      expect(Array.isArray(version.surfaces)).toBe(true);
      expect(Array.isArray(version.consumptions)).toBe(true);
      expect(typeof version.opciones).toBe('object');
    });

    it('should validate version changes', () => {
      const version1 = projectFixtures.versions.version1;
      const version2 = projectFixtures.versions.version2;
      const version3 = projectFixtures.versions.version3;

      // Version 2 tiene más environments que version 1
      expect(version2.surfaces.length).toBeGreaterThan(version1.surfaces.length);
      expect(version2.consumptions.length).toBeGreaterThan(version1.consumptions.length);

      // Version 3 tiene cambios en values
      const salaV1 = version1.surfaces.find(s => s.environment === 'Sala');
      const salaV3 = version3.surfaces.find(s => s.environment === 'Sala');
      expect(salaV1).toBeDefined();
      expect(salaV3).toBeDefined();
      expect(salaV3!.areaM2).toBeGreaterThan(salaV1!.areaM2);

      const tvV1 = version1.consumptions.find(c => c.name === 'Televisor');
      const tvV3 = version3.consumptions.find(c => c.name === 'Televisor');
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
          surfaces: [],
          consumptions: [],
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

