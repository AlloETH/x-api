import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';

/**
 * A "smart follower" of a target account - i.e. a follower ranked highly by
 * `smartFollowerScore` (see `utils/twitter-data.util.ts`). Rows are upserted
 * by (targetUsername, followerUsername) so the table always reflects the
 * most recently computed ranking for each target account.
 */
@Entity('smart_followers')
export class SmartFollowerEntity {
  @PrimaryColumn({ type: 'varchar' })
  targetUsername: string;

  @PrimaryColumn({ type: 'varchar' })
  followerUsername: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  followerId: string | null;

  @Column({ type: 'int', default: 0 })
  followersCount: number;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'float', default: 0 })
  score: number;

  @Column({ type: 'jsonb' })
  raw: Record<string, unknown>;

  @CreateDateColumn()
  fetchedAt: Date;
}
