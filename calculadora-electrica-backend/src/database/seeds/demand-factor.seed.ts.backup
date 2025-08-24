import { DataSource } from 'typeorm';
import { DemandFactor } from '../../modules/calculos/entities/demand-factor.entity';

export const demandFactorSeed = async (
  dataSource: DataSource,
): Promise<void> => {
  const demandFactorRepository = dataSource.getRepository(DemandFactor);

  // Verificar si ya existen datos
  const existingCount = await demandFactorRepository.count();
  if (existingCount > 0) {
    console.log('Factores de demanda ya existen, saltando seed...');
    return;
  }

  const demandFactors = [
    // Iluminación general
    {
      category: 'lighting_general',
      rangeMin: 0,
      rangeMax: 999999,
      factor: 1.0,
      notes: 'TODO_RIE: Factor base para iluminación general',
      usrCreate: 'SEED',
      usrUpdate: 'SEED',
      active: true,
    },

    // Tomacorrientes generales
    {
      category: 'tomas_generales',
      rangeMin: 0,
      rangeMax: 999999,
      factor: 1.0,
      notes: 'TODO_RIE: Factor base para tomacorrientes generales',
      usrCreate: 'SEED',
      usrUpdate: 'SEED',
      active: true,
    },

    // Electrodomésticos fijos
    {
      category: 'electrodomesticos',
      rangeMin: 0,
      rangeMax: 999999,
      factor: 0.85,
      notes: 'TODO_RIE: Factor típico para electrodomésticos no simultáneos',
      usrCreate: 'SEED',
      usrUpdate: 'SEED',
      active: true,
    },

    // Climatización
    {
      category: 'climatizacion',
      rangeMin: 0,
      rangeMax: 999999,
      factor: 1.0,
      notes: 'TODO_RIE: Factor base para climatización - revisar según RIE',
      usrCreate: 'SEED',
      usrUpdate: 'SEED',
      active: true,
    },

    // Cargas especiales
    {
      category: 'especiales',
      rangeMin: 0,
      rangeMax: 999999,
      factor: 1.0,
      notes: 'TODO_RIE: Factor base para cargas especiales',
      usrCreate: 'SEED',
      usrUpdate: 'SEED',
      active: true,
    },
  ];

  // Insertar factores de demanda
  for (const factor of demandFactors) {
    const demandFactor = demandFactorRepository.create(factor);
    await demandFactorRepository.save(demandFactor);
  }

  console.log(
    `✅ Factores de demanda cargados: ${demandFactors.length} registros`,
  );
};
