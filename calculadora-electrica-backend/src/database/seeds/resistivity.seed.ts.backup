import { DataSource } from 'typeorm';
import { Resistivity } from '../../modules/calculos/entities/resistivity.entity';

export async function seedResistivity(dataSource: DataSource): Promise<void> {
  const resistivityRepository = dataSource.getRepository(Resistivity);

  // Verificar si ya existen datos
  const existingCount = await resistivityRepository.count();
  if (existingCount > 0) {
    console.log('✅ Datos de resistividad ya existen, saltando seed...');
    return;
  }

  const resistividades = [
    // Cobre (Cu)
    {
      material: 'Cu',
      seccionMm2: 2.5,
      ohmKm: 7.41,
      notes: 'Cable de cobre 2.5mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 4,
      ohmKm: 4.61,
      notes: 'Cable de cobre 4mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 6,
      ohmKm: 3.08,
      notes: 'Cable de cobre 6mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 10,
      ohmKm: 1.83,
      notes: 'Cable de cobre 10mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 16,
      ohmKm: 1.15,
      notes: 'Cable de cobre 16mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 25,
      ohmKm: 0.727,
      notes: 'Cable de cobre 25mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 35,
      ohmKm: 0.524,
      notes: 'Cable de cobre 35mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 50,
      ohmKm: 0.387,
      notes: 'Cable de cobre 50mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 70,
      ohmKm: 0.268,
      notes: 'Cable de cobre 70mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 95,
      ohmKm: 0.193,
      notes: 'Cable de cobre 95mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 120,
      ohmKm: 0.153,
      notes: 'Cable de cobre 120mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 150,
      ohmKm: 0.124,
      notes: 'Cable de cobre 150mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 185,
      ohmKm: 0.0991,
      notes: 'Cable de cobre 185mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 240,
      ohmKm: 0.0754,
      notes: 'Cable de cobre 240mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 300,
      ohmKm: 0.0601,
      notes: 'Cable de cobre 300mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 400,
      ohmKm: 0.0470,
      notes: 'Cable de cobre 400mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 500,
      ohmKm: 0.0366,
      notes: 'Cable de cobre 500mm² - Resistividad estándar',
    },
    {
      material: 'Cu',
      seccionMm2: 630,
      ohmKm: 0.0283,
      notes: 'Cable de cobre 630mm² - Resistividad estándar',
    },
    // Aluminio (Al)
    {
      material: 'Al',
      seccionMm2: 6,
      ohmKm: 4.84,
      notes: 'Cable de aluminio 6mm² - Resistividad estándar',
    },
    {
      material: 'Al',
      seccionMm2: 10,
      ohmKm: 2.90,
      notes: 'Cable de aluminio 10mm² - Resistividad estándar',
    },
    {
      material: 'Al',
      seccionMm2: 16,
      ohmKm: 1.91,
      notes: 'Cable de aluminio 16mm² - Resistividad estándar',
    },
    {
      material: 'Al',
      seccionMm2: 25,
      ohmKm: 1.20,
      notes: 'Cable de aluminio 25mm² - Resistividad estándar',
    },
    {
      material: 'Al',
      seccionMm2: 35,
      ohmKm: 0.868,
      notes: 'Cable de aluminio 35mm² - Resistividad estándar',
    },
    {
      material: 'Al',
      seccionMm2: 50,
      ohmKm: 0.641,
      notes: 'Cable de aluminio 50mm² - Resistividad estándar',
    },
    {
      material: 'Al',
      seccionMm2: 70,
      ohmKm: 0.443,
      notes: 'Cable de aluminio 70mm² - Resistividad estándar',
    },
    {
      material: 'Al',
      seccionMm2: 95,
      ohmKm: 0.320,
      notes: 'Cable de aluminio 95mm² - Resistividad estándar',
    },
    {
      material: 'Al',
      seccionMm2: 120,
      ohmKm: 0.253,
      notes: 'Cable de aluminio 120mm² - Resistividad estándar',
    },
    {
      material: 'Al',
      seccionMm2: 150,
      ohmKm: 0.206,
      notes: 'Cable de aluminio 150mm² - Resistividad estándar',
    },
    {
      material: 'Al',
      seccionMm2: 185,
      ohmKm: 0.164,
      notes: 'Cable de aluminio 185mm² - Resistividad estándar',
    },
    {
      material: 'Al',
      seccionMm2: 240,
      ohmKm: 0.125,
      notes: 'Cable de aluminio 240mm² - Resistividad estándar',
    },
    {
      material: 'Al',
      seccionMm2: 300,
      ohmKm: 0.100,
      notes: 'Cable de aluminio 300mm² - Resistividad estándar',
    },
    {
      material: 'Al',
      seccionMm2: 400,
      ohmKm: 0.0778,
      notes: 'Cable de aluminio 400mm² - Resistividad estándar',
    },
    {
      material: 'Al',
      seccionMm2: 500,
      ohmKm: 0.0607,
      notes: 'Cable de aluminio 500mm² - Resistividad estándar',
    },
    {
      material: 'Al',
      seccionMm2: 630,
      ohmKm: 0.0469,
      notes: 'Cable de aluminio 630mm² - Resistividad estándar',
    },
  ];

  const entities = resistividades.map((resistividad) => {
    const entity = new Resistivity();
    entity.material = resistividad.material;
    entity.seccionMm2 = resistividad.seccionMm2;
    entity.ohmKm = resistividad.ohmKm;
    entity.notes = resistividad.notes;
    entity.usrCreate = 'system';
    entity.active = true;
    return entity;
  });

  await resistivityRepository.save(entities);
  console.log(`✅ ${entities.length} registros de resistividad insertados`);
}
