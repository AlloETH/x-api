import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INFOFI_ENTITIES } from './entities';
import { InfofiController } from './infofi.controller';
import { InfofiService } from './infofi.service';

/**
 * Serves the InfoFi data (users + leaderboards) migrated from the infoeye
 * project. See `scripts/migrate-infoeye.ts` for the one-off data copy.
 */
@Module({
  imports: [TypeOrmModule.forFeature(INFOFI_ENTITIES)],
  controllers: [InfofiController],
  providers: [InfofiService],
})
export class InfofiModule {}
