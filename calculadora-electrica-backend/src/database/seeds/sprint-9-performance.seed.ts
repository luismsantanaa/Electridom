import { DataSource } from 'typeorm';
import {
  Project,
  ProjectStatus,
} from '../../modules/projects/entities/project.entity';
import { ProjectVersion } from '../../modules/projects/entities/project-version.entity';

export class Sprint9PerformanceSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    console.log('🌱 Ejecutando Sprint 9 Performance Seed...');

    const projectRepository = this.dataSource.getRepository(Project);
    const versionRepository = this.dataSource.getRepository(ProjectVersion);

    // Generar 1000 proyectos de prueba para performance
    const projects: Partial<Project>[] = [];
    const versions: Partial<ProjectVersion>[] = [];

    for (let i = 1; i <= 1000; i++) {
      const project = {
        name: `Proyecto Performance ${i}`,
        description: `Descripción del proyecto de prueba ${i} para testing de performance`,
        status: 'ACTIVE' as ProjectStatus,
        metadata: {
          owner: `Propietario ${(i % 10) + 1}`,
          location: `Ubicación ${(i % 20) + 1}`,
          voltage: 120 + (i % 3) * 60, // 120, 180, 240
          frequency: 60,
        },
      };

      projects.push(project);
    }

    // Insertar proyectos en lotes
    const savedProjects = await projectRepository.save(projects);
    console.log(`✅ ${savedProjects.length} proyectos creados`);

    // Generar versiones para cada proyecto (1-3 versiones por proyecto)
    for (const project of savedProjects) {
      const numVersions = Math.floor(Math.random() * 3) + 1;

      for (let v = 1; v <= numVersions; v++) {
        const version = {
          project: project,
          versionNumber: v,
          inputSuperficies: [
            { environment: 'Sala', areaM2: 18.5 + Math.random() * 10 },
            { environment: 'Cocina', areaM2: 12.0 + Math.random() * 5 },
          ],
          inputConsumos: [
            {
              name: 'Televisor',
              environment: 'Sala',
              watts: 120 + Math.random() * 50,
            },
            {
              name: 'Refrigerador',
              environment: 'Cocina',
              watts: 800 + Math.random() * 200,
            },
          ],
          inputOpciones: {
            tensionV: 120 + Math.floor(Math.random() * 3) * 60,
            monofasico: Math.random() > 0.5,
          },
          outputCargasPorAmbiente: {
            Sala: { potenciaTotal: 150 + Math.random() * 100 },
            Cocina: { potenciaTotal: 900 + Math.random() * 300 },
          },
          outputTotales: {
            potenciaTotal: 1050 + Math.random() * 400,
            corrienteTotal: 8.75 + Math.random() * 3.33,
          },
          outputPropuestaCircuitos: [
            { nombre: 'Circuito 1', potencia: 150 + Math.random() * 100 },
            { nombre: 'Circuito 2', potencia: 900 + Math.random() * 300 },
          ],
          outputWarnings: ['Proyecto de prueba para performance'],
          rulesSignature: 'mock-signature-sprint9',
          note: `Versión ${v} del proyecto de prueba`,
        };

        versions.push(version);
      }
    }

    // Insertar versiones en lotes
    const savedVersions = await versionRepository.save(versions);
    console.log(`✅ ${savedVersions.length} versiones creadas`);

    console.log('🎯 Sprint 9 Performance Seed completado');
    console.log(
      `📊 Total: ${savedProjects.length} proyectos, ${savedVersions.length} versiones`,
    );
  }
}
