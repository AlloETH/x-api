import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * The InfoFi identity registry (infoeye `infofi_users`): one row per tracked
 * Twitter/X account, keyed by Twitter ID. Every leaderboard row and every
 * per-platform metrics row references this table via `user_id`/`twitter_id`.
 */
@Entity('infofi_users')
export class InfofiUserEntity {
  @PrimaryColumn({ name: 'twitter_id', type: 'text' })
  twitterId: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  username: string;

  @Column({ name: 'display_name', type: 'text', nullable: true })
  displayName: string | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
