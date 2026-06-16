import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm';

/** A cookie.fun campaign period for a project (infoeye `cookie_periods`). */
@Entity('cookie_periods')
@Unique(['projectId', 'period'])
export class CookiePeriodEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ type: 'text' })
  period: string;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}
