import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { numericTransformer } from './numeric.transformer';

/**
 * The current Kaito leaderboard (infoeye `kaito_leaderboard`). The
 * `(period_id, language, rank)` index is non-unique (the live source data may
 * contain duplicate ranks).
 */
@Entity('kaito_leaderboard')
@Index(['periodId', 'language', 'rank'])
export class KaitoLeaderboardEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ name: 'period_id', type: 'uuid', nullable: true })
  periodId: string | null;

  @Index()
  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string | null;

  @Index()
  @Column({ name: 'user_id', type: 'text', nullable: true })
  userId: string | null;

  @Column({ type: 'int', nullable: true })
  rank: number | null;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: numericTransformer,
  })
  mindshare: number | null;

  @Column({ type: 'text', default: 'en' })
  language: string;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
