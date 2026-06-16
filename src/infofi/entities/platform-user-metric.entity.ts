import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm';

/**
 * Legacy/additional per-platform metrics and external IDs for an InfoFi user
 * (infoeye `platform_user_metrics`).
 */
@Entity('platform_user_metrics')
@Unique(['platform', 'externalId'])
@Unique(['userId', 'platform'])
export class PlatformUserMetricEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'text' })
  userId: string;

  @Column({ type: 'text' })
  platform: string;

  @Column({ name: 'external_id', type: 'text' })
  externalId: string;

  @Column({ name: 'smart_followers', type: 'int', nullable: true })
  smartFollowers: number | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
