import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { JwksKeyRepository } from '../repositories/jwks-key.repository';
import { JwksKey, JwksKeyType } from '../entities/jwks-key.entity';
import { generateKeyPair } from 'crypto';
import { promisify } from 'util';

const generateKeyPairAsync = promisify(generateKeyPair);

@Injectable()
export class KeyStoreService {
  private readonly logger = new Logger(KeyStoreService.name);

  constructor(private readonly jwksKeyRepository: JwksKeyRepository) {}

  async getActiveKey(): Promise<JwksKey | null> {
    return this.jwksKeyRepository.findActiveKey();
  }

  async getActivePrivateKey(): Promise<JwksKey | null> {
    return this.jwksKeyRepository.findActivePrivateKey();
  }

  async getActivePublicKeys(): Promise<JwksKey[]> {
    return this.jwksKeyRepository.findActivePublicKeys();
  }

  async getKeyByKid(kid: string): Promise<JwksKey | null> {
    return this.jwksKeyRepository.findByKid(kid);
  }

  async rotateKeys(): Promise<JwksKey> {
    this.logger.log('Iniciando rotación de claves RSA');

    // Generar nuevo par de claves RSA
    const { privateKey, publicKey } = await generateKeyPairAsync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    // Crear nuevo kid con timestamp
    const kid = `kid-${new Date().toISOString().split('T')[0]}-${Date.now()}`;

    // Desactivar claves anteriores
    await this.jwksKeyRepository.deactivatePreviousKeys();

    // Crear nueva clave activa
    const newKey = this.jwksKeyRepository.create({
      kid,
      type: JwksKeyType.RSA,
      publicPem: publicKey,
      privatePem: privateKey,
      isActive: true,
      usrCreate: 'system',
      usrUpdate: 'system',
    });

    const savedKey = await this.jwksKeyRepository.save(newKey);

    this.logger.log(`Nueva clave RSA creada con kid: ${kid}`);

    return savedKey;
  }

  async createInitialKey(): Promise<JwksKey> {
    this.logger.log('Creando clave RSA inicial');

    const existingKey = await this.getActiveKey();
    if (existingKey) {
      this.logger.log('Ya existe una clave activa');
      return existingKey;
    }

    return this.rotateKeys();
  }

  async countActiveKeys(): Promise<number> {
    return this.jwksKeyRepository.countActiveKeys();
  }

  async validateKeyExists(kid: string): Promise<JwksKey> {
    const key = await this.getKeyByKid(kid);
    if (!key) {
      throw new NotFoundException(`Clave con kid '${kid}' no encontrada`);
    }
    return key;
  }
}
