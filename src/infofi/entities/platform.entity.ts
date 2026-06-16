import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * An InfoFi platform (e.g. cookie, kaito, wallchain) migrated from infoeye's
 * `platforms` table.
 */
@Entity('platforms')
export class PlatformEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  slug: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ type: 'text', nullable: true })
  url: string | null;
}
