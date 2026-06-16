import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { numericTransformer } from './numeric.transformer';

/**
 * The standard cookie.fun leaderboard (infoeye `cookie_leaderboard`).
 * `user_id` references an InfoFi user's Twitter ID. The
 * `(period_id, language, rank)` index is non-unique: the live source data
 * contains duplicate ranks, so we index for lookups but don't enforce.
 */
@Entity('cookie_leaderboard')
@Index(['periodId', 'language', 'rank'])
export class CookieLeaderboardEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Index()
  @Column({ name: 'period_id', type: 'uuid' })
  periodId: string;

  @Index()
  @Column({ name: 'user_id', type: 'text', nullable: true })
  userId: string | null;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: numericTransformer,
  })
  mindshare: number | null;

  @Column({ type: 'int', nullable: true })
  rank: number | null;

  @Column({ type: 'text', default: 'en' })
  language: string;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
