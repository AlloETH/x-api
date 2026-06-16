import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { numericTransformer } from './numeric.transformer';

/**
 * The "capital" variant of the cookie.fun leaderboard, used for projects whose
 * campaign type includes "capital" (infoeye `cookie_leaderboard_capital`).
 * The `(period_id, language, rank)` index is non-unique (see the standard
 * cookie leaderboard entity).
 */
@Entity('cookie_leaderboard_capital')
@Index(['periodId', 'language', 'rank'])
export class CookieLeaderboardCapitalEntity {
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
