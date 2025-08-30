import { DataSource } from 'typeorm';
import { DemandFactor } from '../../modules/calculations/entities/demand-factor.entity';

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
      notes:
        'RIE RD Art. 220.12: Factor de demanda para iluminación general - 100%',
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
      notes:
        'RIE RD Art. 220.14: Factor de demanda para tomacorrientes generales - 100%',
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
      notes:
        'RIE RD Art. 220.53: Factor de demanda para electrodomésticos - 85% (máximo 4)',
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
      notes: 'RIE RD Art. 220.82: Factor de demanda para climatización - 100%',
      usrCreate: 'SEED',
      usrUpdate: 'SEED',
      active: true,
    },

    // loads especiales
    {
      category: 'especiales',
      rangeMin: 0,
      rangeMax: 999999,
      factor: 1.0,
      notes:
        'RIE RD Art. 220.87: Factor de demanda para loads especiales - 100%',
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
