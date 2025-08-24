import { Entity, Column, BeforeInsert } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseAuditEntity } from '../../../common/entities/base-audit.entity';
import { HashService, HashResult } from '../../../common/services/hash.service';

export enum UserRole {
  ADMIN = 'admin',
  INGENIERO = 'ingeniero',
  TECNICO = 'tecnico',
  CLIENTE = 'cliente',
  AUDITOR = 'auditor',
}

export enum UserStatus {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  SUSPENDIDO = 'suspendido',
}

export type UserWithoutPassword = Omit<
  User,
  | 'password'
  | 'hashPassword'
  | 'validatePassword'
  | 'toJSON'
  | 'hashedPassword'
  | 'setHashService'
>;

@Entity('users')
export class User extends BaseAuditEntity {
  private hashService: HashService;

  @ApiProperty({ description: 'ID único del usuario' })
  // id ya viene de BaseAuditEntity
  @ApiProperty({ description: 'Nombre de usuario único' })
  @Column({ unique: true, length: 50 })
  username: string;

  @ApiProperty({ description: 'Correo electrónico del usuario' })
  @Column({ unique: true, length: 100 })
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario' })
  @Column({ length: 255 })
  password: string;

  @ApiProperty({ description: 'Nombre del usuario' })
  @Column({ length: 50 })
  nombre: string;

  @ApiProperty({ description: 'Apellido del usuario' })
  @Column({ length: 50 })
  apellido: string;

  @ApiProperty({
    description: 'Rol del usuario',
    enum: UserRole,
    default: UserRole.CLIENTE,
  })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENTE,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Estado del usuario',
    enum: UserStatus,
    default: UserStatus.ACTIVO,
  })
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVO,
  })
  estado: UserStatus;

  @ApiPropertyOptional({ description: 'Número de teléfono' })
  @Column({ nullable: true, length: 15 })
  telefono?: string;

  @ApiPropertyOptional({ description: 'Empresa donde trabaja' })
  @Column({ nullable: true, length: 200 })
  empresa?: string;

  @ApiPropertyOptional({ description: 'Número de cédula' })
  @Column({ nullable: true, length: 50 })
  cedula?: string;

  @ApiPropertyOptional({ description: 'Fecha del último acceso' })
  @Column({ type: 'datetime', nullable: true })
  ultimoAcceso?: Date;

  // Los campos de auditoría ya vienen de BaseAuditEntity:
  // - creationDate (antes fechaCreacion)
  // - updateDate (antes fechaActualizacion)
  // - usrCreate (antes creadoPor)
  // - usrUpdate (antes actualizadoPor)
  // - active (antes activo)

  /**
   * Inyecta el servicio de hash
   * Debe ser llamado después de crear la instancia
   */
  setHashService(hashService: HashService) {
    this.hashService = hashService;
  }

  @BeforeInsert()
  async hashPassword() {
    if (this.password && this.hashService) {
      this.password = await this.hashService.hashPassword(this.password);
    }
  }

  /**
   * Valida la contraseña y retorna información sobre migración
   * Soporta tanto bcrypt (legacy) como Argon2id
   */
  async validatePassword(password: string): Promise<HashResult> {
    if (!this.hashService) {
      throw new Error('HashService no está disponible');
    }

    return await this.hashService.verifyPassword(password, this.password);
  }

  /**
   * Genera hash usando Argon2id (método recomendado)
   */
  async hashedPassword(password: string): Promise<string> {
    if (!this.hashService) {
      throw new Error('HashService no está disponible');
    }

    return await this.hashService.hashPassword(password);
  }

  /**
   * Migra la contraseña de bcrypt a Argon2id
   * Actualiza el hash en la entidad
   */
  async migratePassword(password: string): Promise<void> {
    if (!this.hashService) {
      throw new Error('HashService no está disponible');
    }

    if (this.hashService.isBcrypt(this.password)) {
      this.password = await this.hashService.migrateFromBcrypt(
        password,
        this.password,
      );
    }
  }

  /**
   * Verifica si la contraseña está usando Argon2id
   */
  isUsingArgon2id(): boolean {
    return this.hashService?.isArgon2id(this.password) ?? false;
  }

  /**
   * Verifica si la contraseña necesita migración (está usando bcrypt)
   */
  needsPasswordMigration(): boolean {
    return this.hashService?.isBcrypt(this.password) ?? false;
  }

  toJSON() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, hashService, ...result } = this;
    return result;
  }
}
