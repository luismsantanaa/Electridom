import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NormRule } from '../entities/norm-rule.entity';
import { RulesAdminService } from '../../rules-admin/services/rules-admin.service';
import * as crypto from 'crypto';

@Injectable()
export class RuleSignatureService {
  constructor(
    @InjectRepository(NormRule)
    private readonly normRuleRepository: Repository<NormRule>,
    private readonly rulesAdminService: RulesAdminService,
  ) {}

  /**
   * Genera una firma SHA-256 de todas las reglas normativas (legacy)
   * La firma se calcula a partir de code, numericValue y updatedAt
   * @returns Firma SHA-256 de las reglas actuales
   */
  async getCurrentSignature(): Promise<string> {
    const rules = await this.normRuleRepository.find({
      select: ['code', 'numericValue', 'updateDate'],
      order: { code: 'ASC' },
    });

    // Crear objeto canónico ordenado por código
    const canonicalRules = rules.map(rule => ({
      code: rule.code,
      numericValue: rule.numericValue,
      updatedAt: rule.updateDate.toISOString(),
    }));

    // Generar JSON canónico (sin espacios extra)
    const canonicalJson = JSON.stringify(canonicalRules);
    
    // Generar hash SHA-256
    const hash = crypto.createHash('sha256');
    hash.update(canonicalJson);
    
    return `sha256:${hash.digest('hex')}`;
  }

  /**
   * Genera una firma SHA-256 de un RuleSet específico
   * @param ruleSetId ID del RuleSet
   * @returns Firma SHA-256 del RuleSet
   */
  async getRuleSetSignature(ruleSetId: string): Promise<string> {
    const { rules } = await this.rulesAdminService.getRuleSetById(ruleSetId);
    
    // Crear objeto canónico ordenado por código
    const canonicalRules = rules.map(rule => ({
      code: rule.code,
      numericValue: rule.numericValue,
      unit: rule.unit,
      category: rule.category,
      source: rule.source,
      isDefault: rule.isDefault,
    })).sort((a, b) => a.code.localeCompare(b.code));

    // Generar JSON canónico (sin espacios extra)
    const canonicalJson = JSON.stringify(canonicalRules);
    
    // Generar hash SHA-256
    const hash = crypto.createHash('sha256');
    hash.update(canonicalJson);
    
    return `sha256:${hash.digest('hex')}`;
  }

  /**
   * Genera una firma SHA-256 de las reglas activas para una fecha específica
   * @param effectiveDate Fecha efectiva (ISO 8601)
   * @returns Firma SHA-256 de las reglas activas
   */
  async getActiveRulesSignature(effectiveDate?: string): Promise<string> {
    const { rules } = await this.rulesAdminService.getActiveRuleSet(effectiveDate);
    
    // Crear objeto canónico ordenado por código
    const canonicalRules = rules.map(rule => ({
      code: rule.code,
      numericValue: rule.numericValue,
      unit: rule.unit,
      category: rule.category,
      source: rule.source,
      isDefault: rule.isDefault,
    })).sort((a, b) => a.code.localeCompare(b.code));

    // Generar JSON canónico (sin espacios extra)
    const canonicalJson = JSON.stringify(canonicalRules);
    
    // Generar hash SHA-256
    const hash = crypto.createHash('sha256');
    hash.update(canonicalJson);
    
    return `sha256:${hash.digest('hex')}`;
  }

  /**
   * Compara dos firmas de reglas
   * @param signature1 Primera firma
   * @param signature2 Segunda firma
   * @returns true si las firmas son diferentes
   */
  compareSignatures(signature1: string, signature2: string): boolean {
    return signature1 !== signature2;
  }
}
