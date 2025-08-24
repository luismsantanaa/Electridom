import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NormConst } from '../entities/norm-const.entity';

@Injectable()
export class NormParamService {
  private readonly logger = new Logger(NormParamService.name);
  private cache: Map<string, string> = new Map();

  constructor(
    @InjectRepository(NormConst)
    private readonly normConstRepository: Repository<NormConst>,
  ) {}

  /**
   * Obtener valor de parámetro normativo
   */
  async getParam(key: string): Promise<string> {
    // Verificar cache primero
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    try {
      const param = await this.normConstRepository.findOne({ where: { key } });
      if (!param) {
        throw new Error(`Parámetro normativo '${key}' no encontrado`);
      }

      // Guardar en cache
      this.cache.set(key, param.value);
      this.logger.debug(`Parámetro normativo cargado: ${key} = ${param.value} ${param.unit}`);

      return param.value;
    } catch (error) {
      this.logger.error(`Error obteniendo parámetro normativo '${key}':`, error.message);
      throw error;
    }
  }

  /**
   * Obtener valor de parámetro normativo como número
   */
  async getParamAsNumber(key: string): Promise<number> {
    const value = await this.getParam(key);
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      throw new Error(`Parámetro normativo '${key}' no es un número válido: ${value}`);
    }
    
    return numValue;
  }

  /**
   * Obtener valor de parámetro normativo como entero
   */
  async getParamAsInteger(key: string): Promise<number> {
    const value = await this.getParam(key);
    const intValue = parseInt(value, 10);
    
    if (isNaN(intValue)) {
      throw new Error(`Parámetro normativo '${key}' no es un entero válido: ${value}`);
    }
    
    return intValue;
  }

  /**
   * Limpiar cache de parámetros
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.debug('Cache de parámetros normativos limpiado');
  }

  /**
   * Cargar todos los parámetros en cache
   */
  async preloadCache(): Promise<void> {
    try {
      const params = await this.normConstRepository.find();
      this.cache.clear();
      
      for (const param of params) {
        this.cache.set(param.key, param.value);
      }
      
      this.logger.log(`Cache precargado con ${params.length} parámetros normativos`);
    } catch (error) {
      this.logger.error('Error precargando cache de parámetros:', error.message);
      throw error;
    }
  }

  /**
   * Obtener todos los parámetros normativos
   */
  async getAllParams(): Promise<NormConst[]> {
    return this.normConstRepository.find({ order: { key: 'ASC' } });
  }
}
