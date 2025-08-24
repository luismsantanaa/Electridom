import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RuleSet, RuleSetStatus } from '../../rules/entities/rule-set.entity';
import { NormRule } from '../../rules/entities/norm-rule.entity';
import {
  RuleChangeLog,
  ChangeType,
} from '../../rules/entities/rule-change-log.entity';
import {
  CreateRuleSetDto,
  BulkUpsertRulesDto,
  RuleSetResponseDto,
  RuleSetDetailResponseDto,
  RuleSetDiffResponseDto,
  RuleSetExportDto,
  ImportRuleSetDto,
  RuleDto,
} from '../dtos/rule-set.dto';

@Injectable()
export class RulesAdminService {
  constructor(
    @InjectRepository(RuleSet)
    private readonly ruleSetRepository: Repository<RuleSet>,
    @InjectRepository(NormRule)
    private readonly normRuleRepository: Repository<NormRule>,
    @InjectRepository(RuleChangeLog)
    private readonly ruleChangeLogRepository: Repository<RuleChangeLog>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crea un nuevo RuleSet en estado DRAFT
   */
  async createRuleSet(dto: CreateRuleSetDto): Promise<RuleSetResponseDto> {
    const ruleSet = this.ruleSetRepository.create({
      name: dto.name,
      description: dto.description,
      status: 'DRAFT' as RuleSetStatus,
      effectiveFrom: dto.effectiveFrom
        ? new Date(dto.effectiveFrom)
        : undefined,
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
    });

    const savedRuleSet = await this.ruleSetRepository.save(ruleSet);

    return {
      id: savedRuleSet.id,
      name: savedRuleSet.name,
      description: savedRuleSet.description,
      status: savedRuleSet.status,
      effectiveFrom: savedRuleSet.effectiveFrom?.toISOString(),
      effectiveTo: savedRuleSet.effectiveTo?.toISOString(),
      rulesCount: 0,
      createdAt: savedRuleSet.creationDate?.toISOString() || new Date().toISOString(),
      updatedAt: savedRuleSet.updateDate?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * Realiza bulk upsert de reglas en un RuleSet DRAFT
   */
  async bulkUpsertRules(
    ruleSetId: string,
    dto: BulkUpsertRulesDto,
  ): Promise<RuleSetDetailResponseDto> {
    const ruleSet = await this.ruleSetRepository.findOne({
      where: { id: ruleSetId },
    });

    if (!ruleSet) {
      throw new NotFoundException(`RuleSet con ID ${ruleSetId} no encontrado`);
    }

    if (ruleSet.status !== 'DRAFT') {
      throw new BadRequestException(
        'Solo se pueden modificar reglas en RuleSets en estado DRAFT',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const changeLogs: RuleChangeLog[] = [];

      for (const ruleDto of dto.rules) {
        // Buscar regla existente
        const existingRule = await queryRunner.manager.findOne(NormRule, {
          where: { ruleSetId, code: ruleDto.code },
        });

        if (existingRule) {
          // Actualizar regla existente
          const beforeValue = {
            code: existingRule.code,
            description: existingRule.description,
            numericValue: existingRule.numericValue,
            unit: existingRule.unit,
            category: existingRule.category,
            source: existingRule.source,
            isDefault: existingRule.isDefault,
          };

          existingRule.description = ruleDto.description;
          existingRule.numericValue = ruleDto.numericValue.toString();
          existingRule.unit = ruleDto.unit;
          existingRule.category = ruleDto.category;
          existingRule.source = ruleDto.source;
          existingRule.isDefault = ruleDto.isDefault ?? true;

          await queryRunner.manager.save(NormRule, existingRule);

          const afterValue = {
            code: existingRule.code,
            description: existingRule.description,
            numericValue: existingRule.numericValue,
            unit: existingRule.unit,
            category: existingRule.category,
            source: existingRule.source,
            isDefault: existingRule.isDefault,
          };

          changeLogs.push(
            queryRunner.manager.create(RuleChangeLog, {
              ruleSetId,
              ruleCode: ruleDto.code,
              changeType: 'UPDATE' as ChangeType,
              actor: dto.actor,
              beforeValue,
              afterValue,
            }),
          );
        } else {
          // Crear nueva regla
          const newRule = queryRunner.manager.create(NormRule, {
            ruleSetId,
            code: ruleDto.code,
            description: ruleDto.description,
            numericValue: ruleDto.numericValue.toString(),
            unit: ruleDto.unit,
            category: ruleDto.category,
            source: ruleDto.source,
            isDefault: ruleDto.isDefault ?? true,
          });

          await queryRunner.manager.save(NormRule, newRule);

          const afterValue = {
            code: newRule.code,
            description: newRule.description,
            numericValue: newRule.numericValue,
            unit: newRule.unit,
            category: newRule.category,
            source: newRule.source,
            isDefault: newRule.isDefault,
          };

          changeLogs.push(
            queryRunner.manager.create(RuleChangeLog, {
              ruleSetId,
              ruleCode: ruleDto.code,
              changeType: 'CREATE' as ChangeType,
              actor: dto.actor,
              afterValue,
            }),
          );
        }
      }

      // Guardar logs de cambios
      if (changeLogs.length > 0) {
        await queryRunner.manager.save(RuleChangeLog, changeLogs);
      }

      await queryRunner.commitTransaction();

      // Retornar RuleSet actualizado
      return this.getRuleSetDetail(ruleSetId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Publica un RuleSet (DRAFT → ACTIVE)
   */
  async publishRuleSet(ruleSetId: string): Promise<RuleSetResponseDto> {
    const ruleSet = await this.ruleSetRepository.findOne({
      where: { id: ruleSetId },
    });

    if (!ruleSet) {
      throw new NotFoundException(`RuleSet con ID ${ruleSetId} no encontrado`);
    }

    if (ruleSet.status !== 'DRAFT') {
      throw new BadRequestException(
        'Solo se pueden publicar RuleSets en estado DRAFT',
      );
    }

    // Validar fechas
    if (
      ruleSet.effectiveFrom &&
      ruleSet.effectiveTo &&
      ruleSet.effectiveFrom > ruleSet.effectiveTo
    ) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
    }

    // Verificar solapamiento con otros RuleSets activos
    const overlappingRuleSets = await this.ruleSetRepository
      .createQueryBuilder('rs')
      .where('rs.status = :status', { status: 'ACTIVE' })
      .andWhere('rs.id != :ruleSetId', { ruleSetId })
      .andWhere(
        '(rs.effectiveFrom IS NULL OR rs.effectiveTo IS NULL OR ' +
          '(rs.effectiveFrom <= :effectiveTo AND rs.effectiveTo >= :effectiveFrom))',
        {
          effectiveFrom: ruleSet.effectiveFrom || new Date(0),
          effectiveTo: ruleSet.effectiveTo || new Date(9999, 11, 31),
        },
      )
      .getMany();

    if (overlappingRuleSets.length > 0) {
      throw new ConflictException(
        `Existe solapamiento con otros RuleSets activos: ${overlappingRuleSets.map((rs) => rs.name).join(', ')}`,
      );
    }

    ruleSet.status = 'ACTIVE';
    const updatedRuleSet = await this.ruleSetRepository.save(ruleSet);

    return this.mapRuleSetToResponseDto(updatedRuleSet);
  }

  /**
   * Retira un RuleSet (ACTIVE → RETIRED)
   */
  async retireRuleSet(ruleSetId: string): Promise<RuleSetResponseDto> {
    const ruleSet = await this.ruleSetRepository.findOne({
      where: { id: ruleSetId },
    });

    if (!ruleSet) {
      throw new NotFoundException(`RuleSet con ID ${ruleSetId} no encontrado`);
    }

    if (ruleSet.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Solo se pueden retirar RuleSets en estado ACTIVE',
      );
    }

    ruleSet.status = 'RETIRED';
    const updatedRuleSet = await this.ruleSetRepository.save(ruleSet);

    return this.mapRuleSetToResponseDto(updatedRuleSet);
  }

  /**
   * Lista RuleSets con filtros
   */
  async listRuleSets(
    page = 1,
    pageSize = 20,
    status?: string,
    query?: string,
  ): Promise<{
    data: RuleSetResponseDto[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.ruleSetRepository
      .createQueryBuilder('rs')
      .leftJoinAndSelect('rs.rules', 'rules')
      .orderBy('rs.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('rs.status = :status', { status });
    }

    if (query) {
      queryBuilder.andWhere(
        'rs.name LIKE :query OR rs.description LIKE :query',
        {
          query: `%${query}%`,
        },
      );
    }

    const total = await queryBuilder.getCount();
    const ruleSets = await queryBuilder.skip(skip).take(pageSize).getMany();

    const ruleSetDtos = ruleSets.map((rs) => this.mapRuleSetToResponseDto(rs));

    return {
      data: ruleSetDtos,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Obtiene un RuleSet con sus reglas
   */
  async getRuleSetDetail(ruleSetId: string): Promise<RuleSetDetailResponseDto> {
    const ruleSet = await this.ruleSetRepository.findOne({
      where: { id: ruleSetId },
      relations: ['rules'],
    });

    if (!ruleSet) {
      throw new NotFoundException(`RuleSet con ID ${ruleSetId} no encontrado`);
    }

    const baseResponse = this.mapRuleSetToResponseDto(ruleSet);

    return {
      ...baseResponse,
      rules: ruleSet.rules.map((rule) => ({
        code: rule.code,
        description: rule.description,
        numericValue: parseFloat(rule.numericValue),
        unit: rule.unit,
        category: rule.category,
        source: rule.source,
        isDefault: rule.isDefault,
      })),
    };
  }

  /**
   * Calcula la diferencia entre dos RuleSets
   */
  async getRuleSetDiff(
    ruleSetIdA: string,
    ruleSetIdB: string,
  ): Promise<RuleSetDiffResponseDto> {
    const [ruleSetA, ruleSetB] = await Promise.all([
      this.ruleSetRepository.findOne({
        where: { id: ruleSetIdA },
        relations: ['rules'],
      }),
      this.ruleSetRepository.findOne({
        where: { id: ruleSetIdB },
        relations: ['rules'],
      }),
    ]);

    if (!ruleSetA || !ruleSetB) {
      throw new NotFoundException('Uno o ambos RuleSets no encontrados');
    }

    const rulesA = new Map(ruleSetA.rules.map((r) => [r.code, r]));
    const rulesB = new Map(ruleSetB.rules.map((r) => [r.code, r]));

    const added: RuleDto[] = [];
    const removed: RuleDto[] = [];
    const changed: Array<{ code: string; before: any; after: any }> = [];

    // Encontrar reglas agregadas
    for (const [code, rule] of rulesB) {
      if (!rulesA.has(code)) {
        added.push({
          code: rule.code,
          description: rule.description,
          numericValue: parseFloat(rule.numericValue),
          unit: rule.unit,
          category: rule.category,
          source: rule.source,
          isDefault: rule.isDefault,
        });
      }
    }

    // Encontrar reglas eliminadas
    for (const [code, rule] of rulesA) {
      if (!rulesB.has(code)) {
        removed.push({
          code: rule.code,
          description: rule.description,
          numericValue: parseFloat(rule.numericValue),
          unit: rule.unit,
          category: rule.category,
          source: rule.source,
          isDefault: rule.isDefault,
        });
      }
    }

    // Encontrar reglas modificadas
    for (const [code, ruleA] of rulesA) {
      const ruleB = rulesB.get(code);
      if (ruleB && this.hasRuleChanged(ruleA, ruleB)) {
        changed.push({
          code,
          before: {
            description: ruleA.description,
            numericValue: parseFloat(ruleA.numericValue),
            unit: ruleA.unit,
            category: ruleA.category,
            source: ruleA.source,
            isDefault: ruleA.isDefault,
          },
          after: {
            description: ruleB.description,
            numericValue: parseFloat(ruleB.numericValue),
            unit: ruleB.unit,
            category: ruleB.category,
            source: ruleB.source,
            isDefault: ruleB.isDefault,
          },
        });
      }
    }

    return { added, removed, changed };
  }

  /**
   * Exporta un RuleSet completo
   */
  async exportRuleSet(ruleSetId: string): Promise<RuleSetExportDto> {
    const ruleSet = await this.ruleSetRepository.findOne({
      where: { id: ruleSetId },
      relations: ['rules'],
    });

    if (!ruleSet) {
      throw new NotFoundException(`RuleSet con ID ${ruleSetId} no encontrado`);
    }

    const ruleSetResponse = this.mapRuleSetToResponseDto(ruleSet);
    const rules = ruleSet.rules.map((rule) => ({
      code: rule.code,
      description: rule.description,
      numericValue: parseFloat(rule.numericValue),
      unit: rule.unit,
      category: rule.category,
      source: rule.source,
      isDefault: rule.isDefault,
    }));

    return {
      ruleSet: ruleSetResponse,
      rules,
    };
  }

  /**
   * Importa un RuleSet
   */
  async importRuleSet(dto: ImportRuleSetDto): Promise<RuleSetResponseDto> {
    const ruleSet = this.ruleSetRepository.create({
      name: dto.name,
      description: dto.description,
      status: 'DRAFT' as RuleSetStatus,
    });

    const savedRuleSet = await this.ruleSetRepository.save(ruleSet);

    // Crear las reglas
    const rules = dto.rules.map((ruleDto) =>
      this.normRuleRepository.create({
        ruleSetId: savedRuleSet.id,
        code: ruleDto.code,
        description: ruleDto.description,
        numericValue: ruleDto.numericValue.toString(),
        unit: ruleDto.unit,
        category: ruleDto.category,
        source: ruleDto.source,
        isDefault: ruleDto.isDefault ?? true,
      }),
    );

    await this.normRuleRepository.save(rules);

    // Crear logs de cambios
    const changeLogs = rules.map((rule) =>
      this.ruleChangeLogRepository.create({
        ruleSetId: savedRuleSet.id,
        ruleCode: rule.code,
        changeType: 'CREATE' as ChangeType,
        actor: dto.actor,
        afterValue: {
          code: rule.code,
          description: rule.description,
          numericValue: rule.numericValue,
          unit: rule.unit,
          category: rule.category,
          source: rule.source,
          isDefault: rule.isDefault,
        },
      }),
    );

    await this.ruleChangeLogRepository.save(changeLogs);

    return this.mapRuleSetToResponseDto(savedRuleSet);
  }

  /**
   * Resuelve el RuleSet activo para una fecha específica
   */
  async getActiveRuleSet(
    at?: string,
  ): Promise<{ ruleSet: RuleSetResponseDto; rules: RuleDto[] }> {
    const date = at ? new Date(at) : new Date();

    const ruleSet = await this.ruleSetRepository
      .createQueryBuilder('rs')
      .leftJoinAndSelect('rs.rules', 'rules')
      .where('rs.status = :status', { status: 'ACTIVE' })
      .andWhere('(rs.effectiveFrom IS NULL OR rs.effectiveFrom <= :date)', {
        date,
      })
      .andWhere('(rs.effectiveTo IS NULL OR rs.effectiveTo >= :date)', { date })
      .orderBy('rs.effectiveFrom', 'DESC')
      .getOne();

    if (!ruleSet) {
      throw new NotFoundException(
        'No se encontró un RuleSet activo para la fecha especificada',
      );
    }

    const ruleSetResponse = this.mapRuleSetToResponseDto(ruleSet);
    const rules = ruleSet.rules.map((rule) => ({
      code: rule.code,
      description: rule.description,
      numericValue: parseFloat(rule.numericValue),
      unit: rule.unit,
      category: rule.category,
      source: rule.source,
      isDefault: rule.isDefault,
    }));

    return { ruleSet: ruleSetResponse, rules };
  }

  /**
   * Obtiene un RuleSet específico por ID
   */
  async getRuleSetById(
    ruleSetId: string,
  ): Promise<{ ruleSet: RuleSetResponseDto; rules: RuleDto[] }> {
    const ruleSet = await this.ruleSetRepository.findOne({
      where: { id: ruleSetId },
      relations: ['rules'],
    });

    if (!ruleSet) {
      throw new NotFoundException(`RuleSet con ID ${ruleSetId} no encontrado`);
    }

    const ruleSetResponse = this.mapRuleSetToResponseDto(ruleSet);
    const rules = ruleSet.rules.map((rule) => ({
      code: rule.code,
      description: rule.description,
      numericValue: parseFloat(rule.numericValue),
      unit: rule.unit,
      category: rule.category,
      source: rule.source,
      isDefault: rule.isDefault,
    }));

    return { ruleSet: ruleSetResponse, rules };
  }

  /**
   * Mapea RuleSet a DTO de respuesta
   */
  private mapRuleSetToResponseDto(ruleSet: RuleSet): RuleSetResponseDto {
    return {
      id: ruleSet.id,
      name: ruleSet.name,
      description: ruleSet.description,
      status: ruleSet.status,
      effectiveFrom: ruleSet.effectiveFrom?.toISOString(),
      effectiveTo: ruleSet.effectiveTo?.toISOString(),
      rulesCount: ruleSet.rules?.length || 0,
      createdAt: ruleSet.creationDate?.toISOString() || new Date().toISOString(),
      updatedAt: ruleSet.updateDate?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * Verifica si una regla ha cambiado
   */
  private hasRuleChanged(ruleA: NormRule, ruleB: NormRule): boolean {
    return (
      ruleA.description !== ruleB.description ||
      ruleA.numericValue !== ruleB.numericValue ||
      ruleA.unit !== ruleB.unit ||
      ruleA.category !== ruleB.category ||
      ruleA.source !== ruleB.source ||
      ruleA.isDefault !== ruleB.isDefault
    );
  }
}
