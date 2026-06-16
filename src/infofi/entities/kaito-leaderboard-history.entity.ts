import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { numericTransformer } from './numeric.transformer';

/**
 * Point-in-time snapshots of Kaito leaderboard standings, used for tracking
 * mindshare/rank over time (infoeye `kaito_leaderboard_history`).
 */
@Entity('kaito_leaderboard_history')
@Index(['periodId', 'userId', 'capturedAt'])
export class KaitoLeaderboardHistoryEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'period_id', type: 'uuid' })
  periodId: string;

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

  @Column({ type: 'text', default: 'all' })
  language: string;

  @Column({ name: 'captured_at', type: 'timestamptz', default: () => 'now()' })
  capturedAt: Date;
}
