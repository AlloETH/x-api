import { Column, Entity, PrimaryColumn } from 'typeorm';
import { numericTransformer } from './numeric.transformer';

/** Wallchain-specific metrics for an InfoFi user (infoeye `wallchain_users`). */
@Entity('wallchain_users')
export class WallchainUserEntity {
  @PrimaryColumn({ name: 'twitter_id', type: 'text' })
  twitterId: string;

  @Column({
    name: 'x_score',
    type: 'numeric',
    default: 0,
    transformer: numericTransformer,
  })
  xScore: number;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
