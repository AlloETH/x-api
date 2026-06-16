import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * A point-in-time snapshot of a X user's profile, captured whenever
 * a user-related endpoint is fetched. Storing one row per fetch (rather than
 * upserting) lets us derive growth metrics (e.g. follower deltas) over time.
 */
@Entity('user_snapshots')
export class UserSnapshotEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  userId: string | null;

  @Index()
  @Column({ type: 'varchar' })
  username: string;

  @Column({ type: 'int', default: 0 })
  followersCount: number;

  @Column({ type: 'int', default: 0 })
  followingCount: number;

  @Column({ type: 'int', default: 0 })
  tweetsCount: number;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'jsonb' })
  raw: Record<string, unknown>;

  @CreateDateColumn()
  fetchedAt: Date;
}
