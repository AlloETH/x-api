import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * A tracked project (migrated from infoeye's `projects` table). Parent of the
 * leaderboard tables, which reference it via `project_id`.
 */
@Entity('projects')
export class ProjectEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  slug: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ name: 'short_description', type: 'text', nullable: true })
  shortDescription: string | null;

  @Column({ name: 'long_description', type: 'text', nullable: true })
  longDescription: string | null;

  @Column({ name: 'latest_info', type: 'text', nullable: true })
  latestInfo: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  links: unknown;

  @Column({ name: 'key_info', type: 'jsonb', default: () => "'[]'::jsonb" })
  keyInfo: unknown;

  @Column({ name: 'tge_status', type: 'text', nullable: true })
  tgeStatus: string | null;

  @Column({ name: 'twitter_user_id', type: 'text', nullable: true })
  twitterUserId: string | null;

  @Column({ type: 'boolean', default: false })
  featured: boolean;

  @Column({ type: 'text', nullable: true })
  campaign: string | null;

  @Column({ name: 'start_date', type: 'timestamptz', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
