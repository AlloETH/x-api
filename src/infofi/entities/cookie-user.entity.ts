import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Cookie-specific metrics for an InfoFi user (infoeye `cookie_users`). */
@Entity('cookie_users')
export class CookieUserEntity {
  @PrimaryColumn({ name: 'twitter_id', type: 'text' })
  twitterId: string;

  @Column({ name: 'smart_follower', type: 'int', default: 0 })
  smartFollower: number;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
