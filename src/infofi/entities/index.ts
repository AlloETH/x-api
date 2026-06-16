import { CookieLanguageEntity } from './cookie-language.entity';
import { CookieLeaderboardCapitalEntity } from './cookie-leaderboard-capital.entity';
import { CookieLeaderboardEntity } from './cookie-leaderboard.entity';
import { CookiePeriodEntity } from './cookie-period.entity';
import { CookieUserEntity } from './cookie-user.entity';
import { InfofiUserEntity } from './infofi-user.entity';
import { KaitoLeaderboardHistoryEntity } from './kaito-leaderboard-history.entity';
import { KaitoLeaderboardEntity } from './kaito-leaderboard.entity';
import { KaitoPeriodEntity } from './kaito-period.entity';
import { KaitoUserEntity } from './kaito-user.entity';
import { PlatformEntity } from './platform.entity';
import { PlatformUserMetricEntity } from './platform-user-metric.entity';
import { ProjectEntity } from './project.entity';
import { WallchainEpochEntity } from './wallchain-epoch.entity';
import { WallchainLeaderboardEntity } from './wallchain-leaderboard.entity';
import { WallchainUserEntity } from './wallchain-user.entity';

export * from './cookie-language.entity';
export * from './cookie-leaderboard-capital.entity';
export * from './cookie-leaderboard.entity';
export * from './cookie-period.entity';
export * from './cookie-user.entity';
export * from './infofi-user.entity';
export * from './kaito-leaderboard-history.entity';
export * from './kaito-leaderboard.entity';
export * from './kaito-period.entity';
export * from './kaito-user.entity';
export * from './platform.entity';
export * from './platform-user-metric.entity';
export * from './project.entity';
export * from './wallchain-epoch.entity';
export * from './wallchain-leaderboard.entity';
export * from './wallchain-user.entity';

/**
 * Every InfoFi entity migrated from infoeye, in foreign-key dependency order
 * (parents first). Used to register repositories and to drive the ETL copy.
 */
export const INFOFI_ENTITIES = [
  PlatformEntity,
  ProjectEntity,
  InfofiUserEntity,
  CookiePeriodEntity,
  KaitoPeriodEntity,
  CookieLanguageEntity,
  WallchainEpochEntity,
  KaitoUserEntity,
  WallchainUserEntity,
  CookieUserEntity,
  PlatformUserMetricEntity,
  WallchainLeaderboardEntity,
  CookieLeaderboardEntity,
  CookieLeaderboardCapitalEntity,
  KaitoLeaderboardEntity,
  KaitoLeaderboardHistoryEntity,
];
