import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CookieLeaderboardQueryDto,
  LeaderboardQueryDto,
  WallchainLeaderboardQueryDto,
} from './dto/leaderboard-query.dto';
import { InfofiService } from './infofi.service';

/**
 * Read endpoints over the InfoFi data migrated from infoeye: projects,
 * platforms, the user identity registry and the cookie/kaito/wallchain
 * leaderboards. Mounted under `/infofi`.
 */
@ApiTags('InfoFi')
@Controller('infofi')
export class InfofiController {
  constructor(private readonly infofi: InfofiService) {}

  @Get('projects')
  @ApiOperation({ summary: 'List all tracked projects' })
  @ApiOkResponse({ description: 'All projects, ordered by name.' })
  listProjects() {
    return this.infofi.listProjects();
  }

  @Get('platforms')
  @ApiOperation({ summary: 'List all InfoFi platforms' })
  @ApiOkResponse({ description: 'All platforms, ordered by name.' })
  listPlatforms() {
    return this.infofi.listPlatforms();
  }

  @Get('users/:identifier')
  @ApiOperation({
    summary: 'Get an InfoFi user with their per-platform metrics',
    description:
      'Looks up by Twitter ID or username (case-insensitive) and returns the ' +
      'identity record plus kaito/cookie/wallchain metrics.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Twitter ID or username',
    example: 'elonmusk',
  })
  @ApiOkResponse({ description: 'The user and their per-platform metrics.' })
  getUser(@Param('identifier') identifier: string) {
    return this.infofi.getUser(identifier);
  }

  @Get('leaderboards/cookie')
  @ApiOperation({
    summary: 'Cookie.fun leaderboard',
    description:
      'Filter by project, period and language. Pass `capital=true` to read ' +
      'the capital-campaign variant. Rows are enriched with the user profile.',
  })
  @ApiOkResponse({ description: 'Ranked cookie leaderboard rows.' })
  getCookieLeaderboard(@Query() query: CookieLeaderboardQueryDto) {
    return this.infofi.getCookieLeaderboard(query);
  }

  @Get('leaderboards/kaito')
  @ApiOperation({
    summary: 'Kaito leaderboard',
    description: 'Filter by project, period and language.',
  })
  @ApiOkResponse({ description: 'Ranked Kaito leaderboard rows.' })
  getKaitoLeaderboard(@Query() query: LeaderboardQueryDto) {
    return this.infofi.getKaitoLeaderboard(query);
  }

  @Get('leaderboards/wallchain')
  @ApiOperation({
    summary: 'Wallchain leaderboard',
    description: 'Filter by epoch.',
  })
  @ApiOkResponse({ description: 'Ranked Wallchain leaderboard rows.' })
  getWallchainLeaderboard(@Query() query: WallchainLeaderboardQueryDto) {
    return this.infofi.getWallchainLeaderboard(query);
  }
}
