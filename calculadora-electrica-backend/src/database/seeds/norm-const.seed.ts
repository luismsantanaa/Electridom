import { DataSource } from 'typeorm';
import { NormConst } from '../../modules/calculos/entities/norm-const.entity';

export const normConstSeed = async (dataSource: DataSource): Promise<void> => {
  const normConstRepository = dataSource.getRepository(NormConst);

  // Verificar si ya existen datos
  const existingCount = await normConstRepository.count();
  if (existingCount > 0) {
    console.log('Parámetros normativos ya existen, saltando seed...');
    return;
  }

  const normParams = [
    {
      key: 'lighting_va_per_m2',
      value: '32.3',
      unit: 'VA/m2',
      notes: 'TODO_RIE: valor base; origen NEC 3VA/ft2 aprox.',
    },
    {
      key: 'socket_max_va_per_circuit',
      value: '1800',
      unit: 'VA',
      notes: 'TODO_RIE',
    },
    {
      key: 'circuit_max_utilization',
      value: '0.8',
      unit: 'ratio',
      notes: '80%',
    },
    {
      key: 'vd_branch_limit_pct',
      value: '3',
      unit: '%',
      notes: 'Límite recomendado',
    },
    {
      key: 'vd_total_limit_pct',
      value: '5',
      unit: '%',
      notes: 'Límite recomendado',
    },
    {
      key: 'system_type',
      value: '1',
      unit: 'ph',
      notes: '1=monofásico,3=trifásico',
    },
  ];

  // Insertar parámetros normativos
  for (const param of normParams) {
    const normConst = normConstRepository.create(param);
    await normConstRepository.save(normConst);
  }

  console.log(`✅ Parámetros normativos cargados: ${normParams.length} registros`);
};
