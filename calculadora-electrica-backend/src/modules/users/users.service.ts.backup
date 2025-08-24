import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { HashService } from '../../common/services/hash.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private hashService: HashService,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    if (!userData.email) {
      throw new ConflictException('El correo electrónico es obligatorio');
    }
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }
    const user = this.usersRepository.create(userData);
    user.setHashService(this.hashService);
    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      throw new NotFoundException('El correo electrónico es obligatorio');
    }
    const user = await this.usersRepository.findOne({ where: { email } });
    if (user) {
      user.setHashService(this.hashService);
    }
    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    user.setHashService(this.hashService);
    return user;
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.findById(id);
    await this.usersRepository.update(id, userData);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async resetPassword(
    email: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const hashedPassword = await user.hashedPassword(newPassword);
    await this.usersRepository.update(user.id, { password: hashedPassword });

    return { message: 'Contraseña actualizada exitosamente' };
  }

  /**
   * Actualiza la contraseña de un usuario con migración automática a Argon2id
   */
  async updatePasswordWithMigration(
    user: User,
    newPassword: string,
  ): Promise<User> {
    user.setHashService(this.hashService);
    await user.migratePassword(newPassword);
    return this.usersRepository.save(user);
  }
}
