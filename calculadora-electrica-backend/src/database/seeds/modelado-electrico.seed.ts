import { DataSource } from 'typeorm';
import { NormativaAmpacidad } from '../../modules/modelado/entities/normativa-ampacidad.entity';
import { NormativaBreaker } from '../../modules/modelado/entities/normativa-breaker.entity';

export class ModeladoElectricoSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const normativaAmpacidadRepository = this.dataSource.getRepository(NormativaAmpacidad);
    const normativaBreakerRepository = this.dataSource.getRepository(NormativaBreaker);

    // Verificar si ya existen datos
    const existingAmpacidad = await normativaAmpacidadRepository.count();
    const existingBreakers = await normativaBreakerRepository.count();

    if (existingAmpacidad === 0) {
      console.log('🌱 Insertando datos de ampacidad de conductores...');
      
      const ampacidadData = [
        // Conductores de Cobre (Cu) - THHN 90°C
        { calibre_awg: '14', material: 'Cu', capacidad_a: 15, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '12', material: 'Cu', capacidad_a: 20, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '10', material: 'Cu', capacidad_a: 30, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '8', material: 'Cu', capacidad_a: 40, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '6', material: 'Cu', capacidad_a: 55, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '4', material: 'Cu', capacidad_a: 70, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '3', material: 'Cu', capacidad_a: 85, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '2', material: 'Cu', capacidad_a: 95, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '1', material: 'Cu', capacidad_a: 110, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '1/0', material: 'Cu', capacidad_a: 125, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '2/0', material: 'Cu', capacidad_a: 145, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '3/0', material: 'Cu', capacidad_a: 165, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '4/0', material: 'Cu', capacidad_a: 195, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        
        // Conductores de Aluminio (Al) - THHN 90°C
        { calibre_awg: '12', material: 'Al', capacidad_a: 15, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '10', material: 'Al', capacidad_a: 25, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '8', material: 'Al', capacidad_a: 35, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '6', material: 'Al', capacidad_a: 40, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '4', material: 'Al', capacidad_a: 55, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '3', material: 'Al', capacidad_a: 65, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '2', material: 'Al', capacidad_a: 75, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '1', material: 'Al', capacidad_a: 85, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '1/0', material: 'Al', capacidad_a: 100, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '2/0', material: 'Al', capacidad_a: 115, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '3/0', material: 'Al', capacidad_a: 130, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
        { calibre_awg: '4/0', material: 'Al', capacidad_a: 150, tipo_aislamiento: 'THHN', temperatura_ambiente: 30, normativa: 'NEC 2020', tabla_referencia: '310.16(B)(16)' },
      ];

      for (const data of ampacidadData) {
        const ampacidad = normativaAmpacidadRepository.create(data);
        await normativaAmpacidadRepository.save(ampacidad);
      }

      console.log(`✅ Insertados ${ampacidadData.length} registros de ampacidad`);
    } else {
      console.log(`ℹ️ Ya existen ${existingAmpacidad} registros de ampacidad`);
    }

    if (existingBreakers === 0) {
      console.log('🌱 Insertando datos de breakers...');
      
      const breakerData = [
        // MCB - Miniature Circuit Breakers
        { capacidad_a: 15, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 20, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 25, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 30, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 35, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 40, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 45, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 50, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 60, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 70, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 80, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 90, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 100, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 125, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 150, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 175, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 200, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 225, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 250, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 300, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 350, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 400, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 450, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 500, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 600, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 700, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 800, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 1000, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 1200, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 1600, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 2000, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 2500, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 3000, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 4000, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 5000, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
        { capacidad_a: 6000, curva: 'C', tipo: 'MCB', normativa: 'NEC 2020', tabla_referencia: '240.6(A)' },
      ];

      for (const data of breakerData) {
        const breaker = normativaBreakerRepository.create(data);
        await normativaBreakerRepository.save(breaker);
      }

      console.log(`✅ Insertados ${breakerData.length} registros de breakers`);
    } else {
      console.log(`ℹ️ Ya existen ${existingBreakers} registros de breakers`);
    }

    console.log('🎉 Seed de modelado eléctrico completado');
  }
}
