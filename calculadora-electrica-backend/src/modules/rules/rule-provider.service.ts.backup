import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RulesService } from './rules.service';
import { RulesAdminService } from '../rules-admin/services/rules-admin.service';

interface CacheEntry {
  value: number;
  timestamp: number;
  ruleSetId?: string;
}

interface RuleSetContext {
  ruleSetId?: string;
  effectiveDate?: string;
}

@Injectable()
export class RuleProviderService {
  private readonly logger = new Logger(RuleProviderService.name);
  private cache = new Map<string, CacheEntry>();
  private readonly cacheTtl: number;

  constructor(
    private readonly rulesService: RulesService,
    private readonly rulesAdminService: RulesAdminService,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtl = this.configService.get<number>('RULE_CACHE_TTL_MS', 60000);
  }

  async getNumber(
    code: string,
    opts?: { 
      fallback?: number; 
      warnings: string[];
      ruleSetId?: string;
      effectiveDate?: string;
    },
  ): Promise<number> {
    const cacheKey = this.getCacheKey(code, opts?.ruleSetId, opts?.effectiveDate);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.value;
    }

    let ruleValue: number | undefined;

    // Try to get from specific RuleSet if provided
    if (opts?.ruleSetId) {
      try {
        const { rules } = await this.rulesAdminService.getRuleSetById(opts.ruleSetId);
        const rule = rules.find(r => r.code === code);
        if (rule) {
          ruleValue = rule.numericValue;
        }
      } catch (error) {
        this.logger.warn(`Error obteniendo regla ${code} del RuleSet ${opts.ruleSetId}:`, error.message);
      }
    }

    // Try to get from active RuleSet for effective date if no specific RuleSet or rule not found
    if (ruleValue === undefined && opts?.effectiveDate) {
      try {
        const { rules } = await this.rulesAdminService.getActiveRuleSet(opts.effectiveDate);
        const rule = rules.find(r => r.code === code);
        if (rule) {
          ruleValue = rule.numericValue;
        }
      } catch (error) {
        this.logger.warn(`Error obteniendo regla ${code} para fecha ${opts.effectiveDate}:`, error.message);
      }
    }

    // Fallback to legacy rules service
    if (ruleValue === undefined) {
      const rule = await this.rulesService.findByCode(code);
      if (rule) {
        ruleValue = parseFloat(rule.numericValue);
      }
    }

    if (ruleValue !== undefined) {
      this.cache.set(cacheKey, { 
        value: ruleValue, 
        timestamp: Date.now(),
        ruleSetId: opts?.ruleSetId 
      });
      return ruleValue;
    }

    // Use fallback if provided
    if (opts?.fallback !== undefined) {
      const warning = `Regla ${code} usa valor por defecto (${opts.fallback}). TODO validar con RIE RD.`;
      opts.warnings.push(warning);
      this.logger.warn(warning);
      return opts.fallback;
    }

    // Throw error if no fallback
    throw new Error(`Regla ${code} no encontrada y no se proporcionó valor por defecto`);
  }

  /**
   * Obtiene todas las reglas de un RuleSet específico
   */
  async getRulesFromRuleSet(ruleSetId: string): Promise<Map<string, number>> {
    try {
      const { rules } = await this.rulesAdminService.getRuleSetById(ruleSetId);
      const rulesMap = new Map<string, number>();
      
      for (const rule of rules) {
        rulesMap.set(rule.code, rule.numericValue);
      }
      
      return rulesMap;
    } catch (error) {
      this.logger.error(`Error obteniendo reglas del RuleSet ${ruleSetId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene todas las reglas activas para una fecha específica
   */
  async getActiveRules(effectiveDate?: string): Promise<Map<string, number>> {
    try {
      const { rules } = await this.rulesAdminService.getActiveRuleSet(effectiveDate);
      const rulesMap = new Map<string, number>();
      
      for (const rule of rules) {
        rulesMap.set(rule.code, rule.numericValue);
      }
      
      return rulesMap;
    } catch (error) {
      this.logger.error(`Error obteniendo reglas activas para fecha ${effectiveDate}:`, error);
      throw error;
    }
  }

  private getCacheKey(code: string, ruleSetId?: string, effectiveDate?: string): string {
    if (ruleSetId) {
      return `${code}:ruleset:${ruleSetId}`;
    }
    if (effectiveDate) {
      return `${code}:date:${effectiveDate}`;
    }
    return `${code}:legacy`;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}
