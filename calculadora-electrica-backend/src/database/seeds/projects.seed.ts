import { DataSource } from 'typeorm';
import {
  Project,
  ProjectStatus,
} from '../../modules/projects/entities/project.entity';
import { ProjectVersion } from '../../modules/projects/entities/project-version.entity';

export class ProjectsSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const projectRepository = this.dataSource.getRepository(Project);
    const versionRepository = this.dataSource.getRepository(ProjectVersion);

    // Verificar si ya existen proyectos
    const existingProjects = await projectRepository.count();
    if (existingProjects > 0) {
      console.log('Proyectos ya existen, saltando semillas...');
      return;
    }

    console.log('Creando semillas de proyectos...');

    const projects = [
      {
        name: 'Residencial Alba I',
        description: 'Propietario A',
        status: ProjectStatus.ACTIVE,
        apparentPowerKVA: 12.5,
        circuits: 14,
      },
      {
        name: 'Residencial Alba II',
        description: 'Propietario B',
        status: ProjectStatus.ACTIVE,
        apparentPowerKVA: 9.8,
        circuits: 10,
      },
      {
        name: 'Comercial Centro Plaza',
        description: 'Centro Comercial ABC',
        status: ProjectStatus.ACTIVE,
        apparentPowerKVA: 45.2,
        circuits: 28,
      },
      {
        name: 'Oficinas Corporativas',
        description: 'Empresa XYZ',
        status: ProjectStatus.ACTIVE,
        apparentPowerKVA: 32.1,
        circuits: 22,
      },
      {
        name: 'Restaurante El Sabor',
        description: 'Restaurante Familiar',
        status: ProjectStatus.ACTIVE,
        apparentPowerKVA: 18.7,
        circuits: 16,
      },
      {
        name: 'Clínica Médica',
        description: 'Dr. Juan Pérez',
        status: ProjectStatus.ACTIVE,
        apparentPowerKVA: 25.3,
        circuits: 20,
      },
      {
        name: 'Escuela Primaria',
        description: 'Ministerio de Educación',
        status: ProjectStatus.ACTIVE,
        apparentPowerKVA: 38.9,
        circuits: 25,
      },
      {
        name: 'Hotel Playa Dorada',
        description: 'Cadena Hotelera',
        status: ProjectStatus.ACTIVE,
        apparentPowerKVA: 67.4,
        circuits: 42,
      },
      {
        name: 'Farmacia 24/7',
        description: 'Farmacia Central',
        status: ProjectStatus.ACTIVE,
        apparentPowerKVA: 8.2,
        circuits: 8,
      },
      {
        name: 'Gimnasio Fitness',
        description: 'Centro Deportivo',
        status: ProjectStatus.ACTIVE,
        apparentPowerKVA: 22.6,
        circuits: 18,
      },
      {
        name: 'Proyecto Futuro I',
        description: 'Desarrollador Inmobiliario',
        status: ProjectStatus.DRAFT,
        apparentPowerKVA: 15.3,
        circuits: 12,
      },
      {
        name: 'Proyecto Futuro II',
        description: 'Desarrollador Inmobiliario',
        status: ProjectStatus.DRAFT,
        apparentPowerKVA: 28.7,
        circuits: 24,
      },
      {
        name: 'Proyecto Archivado I',
        description: 'Cliente Anterior',
        status: ProjectStatus.ARCHIVED,
        apparentPowerKVA: 11.2,
        circuits: 9,
      },
      {
        name: 'Proyecto Archivado II',
        description: 'Cliente Anterior',
        status: ProjectStatus.ARCHIVED,
        apparentPowerKVA: 19.8,
        circuits: 15,
      },
      {
        name: 'Residencial Los Pinos',
        description: 'Familia Rodríguez',
        status: ProjectStatus.ACTIVE,
        apparentPowerKVA: 14.6,
        circuits: 13,
      },
      {
        name: 'Tienda de Conveniencia',
        description: 'Cadena de Tiendas',
        status: ProjectStatus.ACTIVE,
        apparentPowerKVA: 6.8,
        circuits: 6,
      },
      {
        name: 'Taller Mecánico',
        description: 'Taller Automotriz',
        status: ProjectStatus.ACTIVE,
        apparentPowerKVA: 16.4,
        circuits: 14,
      },
      {
        name: 'Salón de Belleza',
        description: 'Salón de Belleza',
        status: ProjectStatus.ACTIVE,
        apparentPowerKVA: 7.9,
        circuits: 7,
      },
      {
        name: 'Lavandería Express',
        description: 'Lavandería Industrial',
        status: ProjectStatus.ACTIVE,
        apparentPowerKVA: 29.1,
        circuits: 21,
      },
      {
        name: 'Panadería Artesanal',
        description: 'Panadería Familiar',
        status: ProjectStatus.ACTIVE,
        apparentPowerKVA: 13.7,
        circuits: 11,
      },
    ];

    for (const projectData of projects) {
      // Crear proyecto
      const project = projectRepository.create({
        name: projectData.name,
        description: projectData.description,
        status: projectData.status,
        creationDate: new Date(),
        updateDate: new Date(),
      });

      const savedProject = await projectRepository.save(project);

      // Crear versión mock para el proyecto
      const version = versionRepository.create({
        project: savedProject,
        versionNumber: 1,
        rulesSignature: 'mock-signature-v1',
        creationDate: new Date(),
        outputTotales: {
          demanda: {
            totalDemand: projectData.apparentPowerKVA,
          },
          circuitos: {
            totalCircuits: projectData.circuits,
          },
        },
      });

      await versionRepository.save(version);
    }

    console.log(`✅ ${projects.length} proyectos creados exitosamente`);
  }
}
