import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm';

/** A Wallchain epoch for a project (infoeye `wallchain_epochs`). */
@Entity('wallchain_epochs')
@Unique(['projectId', 'externalId'])
export class WallchainEpochEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'external_id', type: 'text' })
  externalId: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  status: string | null;

  @Column({ name: 'start_date', type: 'timestamptz', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}
