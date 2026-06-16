import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A persisted copy of a tweet returned by any of the timeline/tweet
 * endpoints. Rows are upserted by tweet ID, so re-fetching the same tweet
 * refreshes its stored data instead of creating duplicates.
 */
@Entity('tweets')
export class TweetEntity {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  authorId: string | null;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  authorUsername: string | null;

  @Column({ type: 'text', nullable: true })
  text: string | null;

  /** When the tweet itself was posted (per the upstream `createdAt` field). */
  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  tweetCreatedAt: Date | null;

  @Index()
  @Column({ type: 'boolean', default: false })
  isPaidPartnership: boolean;

  @Column({ type: 'jsonb' })
  raw: Record<string, unknown>;

  @CreateDateColumn()
  firstSeenAt: Date;

  @UpdateDateColumn()
  lastSeenAt: Date;
}
