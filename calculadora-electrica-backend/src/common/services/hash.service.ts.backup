import { Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcryptjs';

export enum HashType {
  BCRYPT = 'bcrypt',
  ARGON2ID = 'argon2id',
}

export interface HashResult {
  hash: string;
  type: HashType;
  needsMigration: boolean;
}

@Injectable()
export class HashService {
  private readonly logger = new Logger(HashService.name);

  // Configuración optimizada para Argon2id según OWASP
  private readonly argon2Options: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3, // 3 iteraciones
    parallelism: 1, // 1 thread (adecuado para servidor)
  };

  /**
   * Genera un hash usando Argon2id (método principal)
   */
  async hashPassword(password: string): Promise<string> {
    const startTime = Date.now();

    try {
      const hash = await argon2.hash(password, this.argon2Options);
      const duration = Date.now() - startTime;

      this.logger.debug(`Argon2id hash generated in ${duration}ms`);

      if (duration > 500) {
        this.logger.warn(`Argon2id hash took ${duration}ms (threshold: 500ms)`);
      }

      return hash;
    } catch (error) {
      this.logger.error('Error generating Argon2id hash', error);
      throw new Error('Error generating password hash');
    }
  }

  /**
   * Verifica una contraseña contra un hash
   * Detecta automáticamente el tipo de hash (bcrypt vs Argon2id)
   */
  async verifyPassword(password: string, hash: string): Promise<HashResult> {
    const startTime = Date.now();

    try {
      const hashType = this.detectHashType(hash);
      let isValid = false;
      let needsMigration = false;

      if (hashType === HashType.ARGON2ID) {
        isValid = await argon2.verify(hash, password);
      } else if (hashType === HashType.BCRYPT) {
        isValid = await bcrypt.compare(password, hash);
        needsMigration = isValid; // Si es válido con bcrypt, necesita migración
      } else {
        throw new Error('Formato de hash no reconocido');
      }

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Password verification (${hashType}) completed in ${duration}ms`,
      );

      return {
        hash: isValid ? hash : '',
        type: hashType,
        needsMigration,
      };
    } catch (error) {
      this.logger.error('Error verifying password', error);
      throw new Error('Error verifying password');
    }
  }

  /**
   * Detecta el tipo de hash basado en su formato
   */
  private detectHashType(hash: string): HashType {
    // Argon2id hashes empiezan con $argon2id$
    if (hash.startsWith('$argon2id$')) {
      return HashType.ARGON2ID;
    }

    // bcrypt hashes empiezan con $2a$, $2b$, $2x$, o $2y$
    if (hash.match(/^\$2[abxy]\$/)) {
      return HashType.BCRYPT;
    }

    throw new Error(
      `Formato de hash no reconocido: ${hash.substring(0, 10)}...`,
    );
  }

  /**
   * Migra un hash de bcrypt a Argon2id
   * Usado cuando el usuario hace login con contraseña válida en bcrypt
   */
  async migrateFromBcrypt(
    password: string,
    oldBcryptHash: string,
  ): Promise<string> {
    this.logger.log('Migrando hash de bcrypt a Argon2id');

    // Verificar que el hash es realmente bcrypt
    const verification = await this.verifyPassword(password, oldBcryptHash);

    if (!verification.needsMigration || verification.type !== HashType.BCRYPT) {
      throw new Error('El hash no es válido para migración desde bcrypt');
    }

    // Generar nuevo hash con Argon2id
    const newHash = await this.hashPassword(password);

    this.logger.log('Migración de bcrypt a Argon2id completada exitosamente');
    return newHash;
  }

  /**
   * Valida si un hash es de Argon2id
   */
  isArgon2id(hash: string): boolean {
    return this.detectHashType(hash) === HashType.ARGON2ID;
  }

  /**
   * Valida si un hash es de bcrypt (legacy)
   */
  isBcrypt(hash: string): boolean {
    return this.detectHashType(hash) === HashType.BCRYPT;
  }

  /**
   * Obtiene información sobre la configuración actual de Argon2id
   */
  getArgon2Config() {
    return {
      type: 'argon2id',
      memoryCost: this.argon2Options.memoryCost,
      timeCost: this.argon2Options.timeCost,
      parallelism: this.argon2Options.parallelism,
      estimatedTime: '< 500ms',
    };
  }
}
