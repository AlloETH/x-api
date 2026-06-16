import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import {
  CookieLeaderboardCapitalEntity,
  CookieLeaderboardEntity,
  CookiePeriodEntity,
  CookieUserEntity,
  InfofiUserEntity,
  KaitoLeaderboardEntity,
  KaitoPeriodEntity,
  KaitoUserEntity,
  PlatformEntity,
  PlatformUserMetricEntity,
  ProjectEntity,
  WallchainEpochEntity,
  WallchainLeaderboardEntity,
  WallchainUserEntity,
} from './entities';
import {
  CookieLeaderboardQueryDto,
  LeaderboardQueryDto,
  WallchainLeaderboardQueryDto,
} from './dto/leaderboard-query.dto';

/** A leaderboard row enriched with the referenced InfoFi user's profile. */
export interface LeaderboardRow {
  rank: number | null;
  mindshare?: number | null;
  score?: number | null;
  userId: string | null;
  user: {
    twitterId: string;
    username: string;
    displayName: string | null;
    imageUrl: string | null;
  } | null;
  [key: string]: unknown;
}

/**
 * Read-side access to the InfoFi data migrated from infoeye: the identity
 * registry, per-platform user metrics and the cookie/kaito/wallchain
 * leaderboards. Leaderboard rows are enriched with the user's profile from
 * `infofi_users`.
 */
@Injectable()
export class InfofiService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projects: Repository<ProjectEntity>,
    @InjectRepository(PlatformEntity)
    private readonly platforms: Repository<PlatformEntity>,
    @InjectRepository(InfofiUserEntity)
    private readonly users: Repository<InfofiUserEntity>,
    @InjectRepository(KaitoUserEntity)
    private readonly kaitoUsers: Repository<KaitoUserEntity>,
    @InjectRepository(CookieUserEntity)
    private readonly cookieUsers: Repository<CookieUserEntity>,
    @InjectRepository(WallchainUserEntity)
    private readonly wallchainUsers: Repository<WallchainUserEntity>,
    @InjectRepository(PlatformUserMetricEntity)
    private readonly platformMetrics: Repository<PlatformUserMetricEntity>,
    @InjectRepository(CookiePeriodEntity)
    private readonly cookiePeriods: Repository<CookiePeriodEntity>,
    @InjectRepository(KaitoPeriodEntity)
    private readonly kaitoPeriods: Repository<KaitoPeriodEntity>,
    @InjectRepository(WallchainEpochEntity)
    private readonly wallchainEpochs: Repository<WallchainEpochEntity>,
    @InjectRepository(CookieLeaderboardEntity)
    private readonly cookieBoard: Repository<CookieLeaderboardEntity>,
    @InjectRepository(CookieLeaderboardCapitalEntity)
    private readonly cookieCapitalBoard: Repository<CookieLeaderboardCapitalEntity>,
    @InjectRepository(KaitoLeaderboardEntity)
    private readonly kaitoBoard: Repository<KaitoLeaderboardEntity>,
    @InjectRepository(WallchainLeaderboardEntity)
    private readonly wallchainBoard: Repository<WallchainLeaderboardEntity>,
  ) {}

  listProjects(): Promise<ProjectEntity[]> {
    return this.projects.find({ order: { name: 'ASC' } });
  }

  listPlatforms(): Promise<PlatformEntity[]> {
    return this.platforms.find({ order: { name: 'ASC' } });
  }

  /**
   * Lists cookie.fun periods, optionally scoped to one project. Use the
   * returned `id` as the `periodId` filter on the cookie leaderboard endpoint.
   */
  listCookiePeriods(projectId?: string): Promise<CookiePeriodEntity[]> {
    return this.cookiePeriods.find({
      where: projectId ? { projectId } : {},
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lists Kaito periods, optionally scoped to one project. Use the returned
   * `id` as the `periodId` filter on the Kaito leaderboard endpoint.
   */
  listKaitoPeriods(projectId?: string): Promise<KaitoPeriodEntity[]> {
    return this.kaitoPeriods.find({
      where: projectId ? { projectId } : {},
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lists Wallchain epochs, optionally scoped to one project. Use the returned
   * `id` as the `epochId` filter on the Wallchain leaderboard endpoint.
   */
  listWallchainEpochs(projectId?: string): Promise<WallchainEpochEntity[]> {
    return this.wallchainEpochs.find({
      where: projectId ? { projectId } : {},
      order: { startDate: 'DESC' },
    });
  }

  /**
   * Looks up an InfoFi user by Twitter ID or (case-insensitive) username and
   * attaches their per-platform metrics. Throws 404 if not found.
   */
  async getUser(identifier: string) {
    const user =
      (await this.users.findOne({ where: { twitterId: identifier } })) ??
      (await this.users
        .createQueryBuilder('u')
        .where('lower(u.username) = lower(:username)', { username: identifier })
        .getOne());

    if (!user) {
      throw new NotFoundException(`No InfoFi user found for "${identifier}"`);
    }

    const [kaito, cookie, wallchain, metrics] = await Promise.all([
      this.kaitoUsers.findOne({ where: { twitterId: user.twitterId } }),
      this.cookieUsers.findOne({ where: { twitterId: user.twitterId } }),
      this.wallchainUsers.findOne({ where: { twitterId: user.twitterId } }),
      this.platformMetrics.find({ where: { userId: user.twitterId } }),
    ]);

    return {
      ...user,
      metrics: { kaito, cookie, wallchain, platforms: metrics },
    };
  }

  async getCookieLeaderboard(
    query: CookieLeaderboardQueryDto,
  ): Promise<LeaderboardRow[]> {
    const repo =
      query.capital === 'true' ? this.cookieCapitalBoard : this.cookieBoard;
    const where: FindOptionsWhere<CookieLeaderboardEntity> = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.periodId) where.periodId = query.periodId;
    if (query.language) where.language = query.language;

    const rows = await repo.find({
      where,
      order: { rank: 'ASC' },
      take: query.limit,
      skip: query.offset,
    });
    return this.attachUsers(rows);
  }

  async getKaitoLeaderboard(
    query: LeaderboardQueryDto,
  ): Promise<LeaderboardRow[]> {
    const where: FindOptionsWhere<KaitoLeaderboardEntity> = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.periodId) where.periodId = query.periodId;
    if (query.language) where.language = query.language;

    const rows = await this.kaitoBoard.find({
      where,
      order: { rank: 'ASC' },
      take: query.limit,
      skip: query.offset,
    });
    return this.attachUsers(rows);
  }

  async getWallchainLeaderboard(
    query: WallchainLeaderboardQueryDto,
  ): Promise<LeaderboardRow[]> {
    const where: FindOptionsWhere<WallchainLeaderboardEntity> = {};
    if (query.epochId) where.epochId = query.epochId;

    const rows = await this.wallchainBoard.find({
      where,
      order: { rank: 'ASC' },
      take: query.limit,
      skip: query.offset,
    });
    return this.attachUsers(rows);
  }

  /**
   * Batch-loads the `infofi_users` referenced by a set of leaderboard rows and
   * merges each user's profile onto its row (single query, no N+1).
   */
  private async attachUsers<
    T extends { userId: string | null; rank: number | null },
  >(rows: T[]): Promise<LeaderboardRow[]> {
    const ids = [
      ...new Set(rows.map((r) => r.userId).filter((id): id is string => !!id)),
    ];
    const users = ids.length
      ? await this.users.find({ where: { twitterId: In(ids) } })
      : [];
    const byId = new Map(users.map((u) => [u.twitterId, u]));

    return rows.map((row) => {
      const u = row.userId ? byId.get(row.userId) : undefined;
      return {
        ...row,
        user: u
          ? {
              twitterId: u.twitterId,
              username: u.username,
              displayName: u.displayName,
              imageUrl: u.imageUrl,
            }
          : null,
      } as LeaderboardRow;
    });
  }
}
