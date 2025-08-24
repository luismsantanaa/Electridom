import { DataSource } from 'typeorm';
import { GroundingRules } from '../../modules/calculos/entities/grounding-rules.entity';

export async function seedGroundingRules(dataSource: DataSource): Promise<void> {
  const groundingRulesRepository = dataSource.getRepository(GroundingRules);

  // Verificar si ya existen datos
  const existingCount = await groundingRulesRepository.count();
  if (existingCount > 0) {
    console.log('✅ Datos de reglas de puesta a tierra ya existen, saltando seed...');
    return;
  }

  const groundingRules = [
    // Reglas básicas según NEC 250.66 y prácticas estándar
    {
      mainBreakerAmp: 60,
      egcMm2: 6,
      gecMm2: 10,
      notes: 'TODO_RIE: Breaker hasta 60A - EGC 6mm², GEC 10mm²',
    },
    {
      mainBreakerAmp: 100,
      egcMm2: 10,
      gecMm2: 16,
      notes: 'TODO_RIE: Breaker hasta 100A - EGC 10mm², GEC 16mm²',
    },
    {
      mainBreakerAmp: 125,
      egcMm2: 16,
      gecMm2: 25,
      notes: 'TODO_RIE: Breaker hasta 125A - EGC 16mm², GEC 25mm²',
    },
    {
      mainBreakerAmp: 150,
      egcMm2: 16,
      gecMm2: 25,
      notes: 'TODO_RIE: Breaker hasta 150A - EGC 16mm², GEC 25mm²',
    },
    {
      mainBreakerAmp: 200,
      egcMm2: 25,
      gecMm2: 35,
      notes: 'TODO_RIE: Breaker hasta 200A - EGC 25mm², GEC 35mm²',
    },
    {
      mainBreakerAmp: 225,
      egcMm2: 25,
      gecMm2: 35,
      notes: 'TODO_RIE: Breaker hasta 225A - EGC 25mm², GEC 35mm²',
    },
    {
      mainBreakerAmp: 250,
      egcMm2: 35,
      gecMm2: 50,
      notes: 'TODO_RIE: Breaker hasta 250A - EGC 35mm², GEC 50mm²',
    },
    {
      mainBreakerAmp: 300,
      egcMm2: 35,
      gecMm2: 50,
      notes: 'TODO_RIE: Breaker hasta 300A - EGC 35mm², GEC 50mm²',
    },
    {
      mainBreakerAmp: 350,
      egcMm2: 50,
      gecMm2: 70,
      notes: 'TODO_RIE: Breaker hasta 350A - EGC 50mm², GEC 70mm²',
    },
    {
      mainBreakerAmp: 400,
      egcMm2: 50,
      gecMm2: 70,
      notes: 'TODO_RIE: Breaker hasta 400A - EGC 50mm², GEC 70mm²',
    },
    {
      mainBreakerAmp: 450,
      egcMm2: 70,
      gecMm2: 95,
      notes: 'TODO_RIE: Breaker hasta 450A - EGC 70mm², GEC 95mm²',
    },
    {
      mainBreakerAmp: 500,
      egcMm2: 70,
      gecMm2: 95,
      notes: 'TODO_RIE: Breaker hasta 500A - EGC 70mm², GEC 95mm²',
    },
    {
      mainBreakerAmp: 600,
      egcMm2: 95,
      gecMm2: 120,
      notes: 'TODO_RIE: Breaker hasta 600A - EGC 95mm², GEC 120mm²',
    },
    {
      mainBreakerAmp: 700,
      egcMm2: 95,
      gecMm2: 120,
      notes: 'TODO_RIE: Breaker hasta 700A - EGC 95mm², GEC 120mm²',
    },
    {
      mainBreakerAmp: 800,
      egcMm2: 120,
      gecMm2: 150,
      notes: 'TODO_RIE: Breaker hasta 800A - EGC 120mm², GEC 150mm²',
    },
    {
      mainBreakerAmp: 900,
      egcMm2: 120,
      gecMm2: 150,
      notes: 'TODO_RIE: Breaker hasta 900A - EGC 120mm², GEC 150mm²',
    },
    {
      mainBreakerAmp: 1000,
      egcMm2: 150,
      gecMm2: 185,
      notes: 'TODO_RIE: Breaker hasta 1000A - EGC 150mm², GEC 185mm²',
    },
    {
      mainBreakerAmp: 1200,
      egcMm2: 150,
      gecMm2: 185,
      notes: 'TODO_RIE: Breaker hasta 1200A - EGC 150mm², GEC 185mm²',
    },
    {
      mainBreakerAmp: 1400,
      egcMm2: 185,
      gecMm2: 240,
      notes: 'TODO_RIE: Breaker hasta 1400A - EGC 185mm², GEC 240mm²',
    },
    {
      mainBreakerAmp: 1600,
      egcMm2: 185,
      gecMm2: 240,
      notes: 'TODO_RIE: Breaker hasta 1600A - EGC 185mm², GEC 240mm²',
    },
    {
      mainBreakerAmp: 1800,
      egcMm2: 240,
      gecMm2: 300,
      notes: 'TODO_RIE: Breaker hasta 1800A - EGC 240mm², GEC 300mm²',
    },
    {
      mainBreakerAmp: 2000,
      egcMm2: 240,
      gecMm2: 300,
      notes: 'TODO_RIE: Breaker hasta 2000A - EGC 240mm², GEC 300mm²',
    },
    {
      mainBreakerAmp: 2500,
      egcMm2: 300,
      gecMm2: 400,
      notes: 'TODO_RIE: Breaker hasta 2500A - EGC 300mm², GEC 400mm²',
    },
    {
      mainBreakerAmp: 3000,
      egcMm2: 300,
      gecMm2: 400,
      notes: 'TODO_RIE: Breaker hasta 3000A - EGC 300mm², GEC 400mm²',
    },
    {
      mainBreakerAmp: 3500,
      egcMm2: 400,
      gecMm2: 500,
      notes: 'TODO_RIE: Breaker hasta 3500A - EGC 400mm², GEC 500mm²',
    },
    {
      mainBreakerAmp: 4000,
      egcMm2: 400,
      gecMm2: 500,
      notes: 'TODO_RIE: Breaker hasta 4000A - EGC 400mm², GEC 500mm²',
    },
    {
      mainBreakerAmp: 4500,
      egcMm2: 500,
      gecMm2: 630,
      notes: 'TODO_RIE: Breaker hasta 4500A - EGC 500mm², GEC 630mm²',
    },
    {
      mainBreakerAmp: 5000,
      egcMm2: 500,
      gecMm2: 630,
      notes: 'TODO_RIE: Breaker hasta 5000A - EGC 500mm², GEC 630mm²',
    },
  ];

  const entities = groundingRules.map((regla) => {
    const entity = new GroundingRules();
    entity.mainBreakerAmp = regla.mainBreakerAmp;
    entity.egcMm2 = regla.egcMm2;
    entity.gecMm2 = regla.gecMm2;
    entity.notes = regla.notes;
    entity.usrCreate = 'system';
    entity.active = true;
    return entity;
  });

  await groundingRulesRepository.save(entities);
  console.log(`✅ ${entities.length} reglas de puesta a tierra insertadas`);
}
