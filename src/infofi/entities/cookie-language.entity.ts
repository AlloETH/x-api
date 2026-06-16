import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm';

/** A language variant of a cookie leaderboard (infoeye `cookie_languages`). */
@Entity('cookie_languages')
@Unique(['projectId', 'code'])
export class CookieLanguageEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ type: 'text' })
  code: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;
}
