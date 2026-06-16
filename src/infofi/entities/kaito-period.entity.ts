import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm';

/** A Kaito campaign period for a project (infoeye `kaito_periods`). */
@Entity('kaito_periods')
@Unique(['projectId', 'period'])
export class KaitoPeriodEntity {
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
