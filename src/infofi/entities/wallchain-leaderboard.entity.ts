import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { numericTransformer } from './numeric.transformer';

/**
 * The Wallchain leaderboard, keyed by epoch (infoeye `wallchain_leaderboard`).
 * The `(epoch_id, rank)` index is non-unique (the live source data may contain
 * duplicate ranks).
 */
@Entity('wallchain_leaderboard')
@Index(['epochId', 'rank'])
export class WallchainLeaderboardEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ name: 'epoch_id', type: 'uuid' })
  epochId: string;

  @Index()
  @Column({ name: 'user_id', type: 'text', nullable: true })
  userId: string | null;

  @Column({ type: 'int', nullable: true })
  rank: number | null;

  @Column({ name: 'rank_change', type: 'int', nullable: true })
  rankChange: number | null;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: numericTransformer,
  })
  score: number | null;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: numericTransformer,
  })
  mindshare: number | null;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: numericTransformer,
  })
  multiplier: number | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}
