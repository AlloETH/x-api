import { Column, Entity, PrimaryColumn } from 'typeorm';
import { numericTransformer } from './numeric.transformer';

/** Kaito-specific metrics for an InfoFi user (infoeye `kaito_users`). */
@Entity('kaito_users')
export class KaitoUserEntity {
  @PrimaryColumn({ name: 'twitter_id', type: 'text' })
  twitterId: string;

  @Column({ name: 'smart_follower', type: 'int', default: 0 })
  smartFollower: number;

  @Column({ name: 'smart_following', type: 'int', default: 0 })
  smartFollowing: number;

  @Column({
    name: 'follower_net_worth',
    type: 'numeric',
    default: 0,
    transformer: numericTransformer,
  })
  followerNetWorth: number;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
