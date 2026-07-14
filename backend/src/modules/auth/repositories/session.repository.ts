import { Injectable } from '@nestjs/common';
import { DataSource, Repository, IsNull, MoreThan, LessThan } from 'typeorm';
import { Session } from '../entities/session.entity';

@Injectable()
export class SessionRepository extends Repository<Session> {
  constructor(private dataSource: DataSource) {
    super(Session, dataSource.createEntityManager());
  }

  async findActiveByRefreshHash(refreshHash: string): Promise<Session | null> {
    return this.findOne({
      where: {
        refreshHash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    return this.find({
      where: {
        userId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
      order: { creationDate: 'DESC' },
    });
  }

  async findActiveByJti(jti: string): Promise<Session | null> {
    return this.findOne({
      where: {
        jti,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });
  }

  async revokeByRefreshHash(refreshHash: string): Promise<void> {
    await this.update({ refreshHash }, { revokedAt: new Date() });
  }

  async revokeByJti(jti: string): Promise<void> {
    await this.update({ jti }, { revokedAt: new Date() });
  }

  async revokeByUserId(userId: string): Promise<void> {
    await this.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async revokeById(sessionId: string): Promise<void> {
    await this.update({ id: sessionId }, { revokedAt: new Date() });
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }

  async countActiveByUserId(userId: string): Promise<number> {
    return this.count({
      where: {
        userId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async findRotatedSessions(sessionId: string): Promise<Session[]> {
    return this.find({
      where: [{ rotatedFrom: sessionId }, { rotatedTo: sessionId }],
      relations: ['user'],
      order: { creationDate: 'DESC' },
    });
  }

  async findSessionChain(sessionId: string): Promise<Session[]> {
    const sessions: Session[] = [];
    let currentSessionId: string | null = sessionId;

    // Buscar hacia atrás en la cadena de rotación
    while (currentSessionId) {
      const session = await this.findOne({
        where: { id: currentSessionId },
        relations: ['user'],
      });

      if (session) {
        sessions.unshift(session);
        currentSessionId = session.rotatedFrom;
      } else {
        break;
      }
    }

    // Buscar hacia adelante en la cadena de rotación
    currentSessionId = sessionId;
    while (currentSessionId) {
      const session = await this.findOne({
        where: { id: currentSessionId },
        relations: ['user'],
      });

      if (
        session &&
        session.rotatedTo &&
        !sessions.find((s) => s.id === session.rotatedTo)
      ) {
        const nextSession = await this.findOne({
          where: { id: session.rotatedTo },
          relations: ['user'],
        });

        if (nextSession) {
          sessions.push(nextSession);
          currentSessionId = nextSession.id;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return sessions;
  }
}
