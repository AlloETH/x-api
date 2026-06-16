import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CookieLeaderboardQueryDto,
  LeaderboardQueryDto,
  PeriodQueryDto,
  WallchainLeaderboardQueryDto,
} from './dto/leaderboard-query.dto';
import { InfofiService } from './infofi.service';

// Concrete IDs from the migrated data set, used as Swagger examples so the
// "try it out" requests work against real rows out of the box.
const EXAMPLE_PROJECT_ID = '07572eb2-af9c-4a35-a8f1-27683aa89c6a';
const EXAMPLE_COOKIE_PERIOD_ID = '00ae8fdf-f276-448f-b703-9b26ffabc3d1';
const EXAMPLE_KAITO_PERIOD_ID = '00060485-07df-4c1e-aa82-98fbb45b0a80';
const EXAMPLE_WALLCHAIN_EPOCH_ID = '021931d7-7441-485d-b16c-fc0a3805c140';

const LEADERBOARD_ROW_EXAMPLE = {
  id: '0011f7f1-0dac-46fa-bfc1-ce9d1856045f',
  projectId: EXAMPLE_PROJECT_ID,
  periodId: EXAMPLE_COOKIE_PERIOD_ID,
  userId: '2263365732',
  mindshare: 49.371563,
  rank: 1,
  language: 'en',
  user: {
    twitterId: '2263365732',
    username: 'Elcarloda',
    displayName: 'Elcarloda',
    imageUrl: 'https://pbs.twimg.com/profile_images/.../normal.jpg',
  },
};

/**
 * Read endpoints over the InfoFi data migrated from infoeye: projects,
 * platforms, the user identity registry, the campaign periods/epochs and the
 * cookie/kaito/wallchain leaderboards. Mounted under `/infofi`.
 *
 * ## Finding a leaderboard
 *
 * The leaderboard endpoints are filtered by a `periodId` (cookie/kaito) or
 * `epochId` (wallchain). To discover those IDs:
 *
 * 1. `GET /infofi/projects` — pick a project and note its `id`.
 * 2. `GET /infofi/periods/cookie?projectId=<id>` (or `/periods/kaito`,
 *    `/epochs/wallchain`) — pick a period/epoch and note its `id`.
 * 3. `GET /infofi/leaderboards/cookie?periodId=<id>` — the ranked rows.
 *
 * Every filter is optional: with no `periodId`/`epochId` the leaderboard
 * endpoints return rows across all periods (newest-ranked first), which is
 * useful for a quick look but mixes periods together.
 */
@ApiTags('InfoFi')
@Controller('infofi')
export class InfofiController {
  constructor(private readonly infofi: InfofiService) {}

  // ---------------------------------------------------------------------
  // Reference data (projects, platforms)
  // ---------------------------------------------------------------------

  @Get('projects')
  @ApiOperation({
    summary: 'List all tracked projects',
    description:
      'Start here: each project `id` is the `projectId` used to scope periods ' +
      'and leaderboards.',
  })
  @ApiOkResponse({
    description: 'All projects, ordered by name.',
    schema: {
      example: [
        {
          id: EXAMPLE_PROJECT_ID,
          slug: '0g',
          name: '0G Labs',
          logoUrl: 'https://...',
          campaign: 'regular',
          tgeStatus: 'Pre-TGE',
        },
      ],
    },
  })
  listProjects() {
    return this.infofi.listProjects();
  }

  @Get('platforms')
  @ApiOperation({ summary: 'List all InfoFi platforms' })
  @ApiOkResponse({
    description:
      'All platforms (cookie, kaito, wallchain, …), ordered by name.',
    schema: {
      example: [
        {
          id: 'f950b997-b501-47a7-aa52-05ce007af54b',
          slug: 'cookie',
          name: 'Cookie',
          logoUrl: 'https://...',
          url: 'https://www.cookie.fun',
        },
      ],
    },
  })
  listPlatforms() {
    return this.infofi.listPlatforms();
  }

  // ---------------------------------------------------------------------
  // Period / epoch discovery (how to get a periodId / epochId)
  // ---------------------------------------------------------------------

  @Get('periods/cookie')
  @ApiOperation({
    summary: 'List cookie.fun periods (to get a periodId)',
    description:
      'Returns the cookie periods, newest first. Use a row `id` as the ' +
      '`periodId` filter on `GET /infofi/leaderboards/cookie`.',
  })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Scope to one project (from `GET /infofi/projects`).',
    example: EXAMPLE_PROJECT_ID,
  })
  @ApiOkResponse({
    description: 'Cookie periods.',
    schema: {
      example: [
        {
          id: EXAMPLE_COOKIE_PERIOD_ID,
          projectId: EXAMPLE_PROJECT_ID,
          period: 'Total',
        },
      ],
    },
  })
  listCookiePeriods(@Query() query: PeriodQueryDto) {
    return this.infofi.listCookiePeriods(query.projectId);
  }

  @Get('periods/kaito')
  @ApiOperation({
    summary: 'List Kaito periods (to get a periodId)',
    description:
      'Returns the Kaito periods, newest first. Use a row `id` as the ' +
      '`periodId` filter on `GET /infofi/leaderboards/kaito`.',
  })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Scope to one project (from `GET /infofi/projects`).',
    example: 'b241c674-0592-435b-8df9-94634e0820f3',
  })
  @ApiOkResponse({
    description: 'Kaito periods.',
    schema: {
      example: [
        {
          id: EXAMPLE_KAITO_PERIOD_ID,
          projectId: 'b241c674-0592-435b-8df9-94634e0820f3',
          period: '30d',
        },
      ],
    },
  })
  listKaitoPeriods(@Query() query: PeriodQueryDto) {
    return this.infofi.listKaitoPeriods(query.projectId);
  }

  @Get('epochs/wallchain')
  @ApiOperation({
    summary: 'List Wallchain epochs (to get an epochId)',
    description:
      'Returns the Wallchain epochs, newest first. Use a row `id` as the ' +
      '`epochId` filter on `GET /infofi/leaderboards/wallchain`.',
  })
  @ApiQuery({
    name: 'projectId',
    required: false,
    description: 'Scope to one project (from `GET /infofi/projects`).',
    example: '7ef690c1-c130-400b-974f-c40c1af5771b',
  })
  @ApiOkResponse({
    description: 'Wallchain epochs.',
    schema: {
      example: [
        {
          id: EXAMPLE_WALLCHAIN_EPOCH_ID,
          projectId: '7ef690c1-c130-400b-974f-c40c1af5771b',
          externalId: 'epoch-2',
          name: 'Epoch II',
          startDate: '2025-12-01T00:00:00.000Z',
          endDate: '2025-12-31T00:00:00.000Z',
        },
      ],
    },
  })
  listWallchainEpochs(@Query() query: PeriodQueryDto) {
    return this.infofi.listWallchainEpochs(query.projectId);
  }

  // ---------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------

  @Get('users/:identifier')
  @ApiOperation({
    summary: 'Get an InfoFi user with their per-platform metrics',
    description:
      'Looks up by Twitter ID or username (case-insensitive) and returns the ' +
      'identity record plus kaito/cookie/wallchain metrics. Returns 404 if no ' +
      'user matches.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Twitter ID or username',
    example: 'yield_xyz',
  })
  @ApiOkResponse({
    description: 'The user and their per-platform metrics.',
    schema: {
      example: {
        twitterId: '1628486559946121219',
        username: 'yield_xyz',
        displayName: 'Yield.xyz',
        imageUrl: 'https://...',
        metrics: {
          kaito: null,
          cookie: { twitterId: '1628486559946121219', smartFollower: 123 },
          wallchain: null,
          platforms: [],
        },
      },
    },
  })
  getUser(@Param('identifier') identifier: string) {
    return this.infofi.getUser(identifier);
  }

  // ---------------------------------------------------------------------
  // Leaderboards
  // ---------------------------------------------------------------------

  @Get('leaderboards/cookie')
  @ApiOperation({
    summary: 'Cookie.fun leaderboard',
    description:
      'Ranked rows, each enriched with the referenced user profile. Filter by ' +
      'project, period and language; pass `capital=true` to read the ' +
      'capital-campaign variant. Get a `periodId` from ' +
      '`GET /infofi/periods/cookie`.',
  })
  @ApiQuery({
    name: 'periodId',
    required: false,
    description: 'Period UUID (from `GET /infofi/periods/cookie`).',
    example: EXAMPLE_COOKIE_PERIOD_ID,
  })
  @ApiQuery({ name: 'projectId', required: false, example: EXAMPLE_PROJECT_ID })
  @ApiQuery({
    name: 'language',
    required: false,
    description: 'Language code, e.g. "en", "es".',
    example: 'en',
  })
  @ApiQuery({
    name: 'capital',
    required: false,
    description: 'Set "true" to read the capital-campaign leaderboard.',
    example: 'false',
  })
  @ApiQuery({ name: 'limit', required: false, example: 100 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiOkResponse({
    description: 'Ranked cookie leaderboard rows, ordered by rank ascending.',
    schema: { example: [LEADERBOARD_ROW_EXAMPLE] },
  })
  getCookieLeaderboard(@Query() query: CookieLeaderboardQueryDto) {
    return this.infofi.getCookieLeaderboard(query);
  }

  @Get('leaderboards/kaito')
  @ApiOperation({
    summary: 'Kaito leaderboard',
    description:
      'Ranked rows, each enriched with the referenced user profile. Filter by ' +
      'project, period and language. Get a `periodId` from ' +
      '`GET /infofi/periods/kaito`.',
  })
  @ApiQuery({
    name: 'periodId',
    required: false,
    description: 'Period UUID (from `GET /infofi/periods/kaito`).',
    example: EXAMPLE_KAITO_PERIOD_ID,
  })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'language', required: false, example: 'en' })
  @ApiQuery({ name: 'limit', required: false, example: 100 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiOkResponse({
    description: 'Ranked Kaito leaderboard rows, ordered by rank ascending.',
    schema: { example: [LEADERBOARD_ROW_EXAMPLE] },
  })
  getKaitoLeaderboard(@Query() query: LeaderboardQueryDto) {
    return this.infofi.getKaitoLeaderboard(query);
  }

  @Get('leaderboards/wallchain')
  @ApiOperation({
    summary: 'Wallchain leaderboard',
    description:
      'Ranked rows, each enriched with the referenced user profile. Filter by ' +
      'epoch. Get an `epochId` from `GET /infofi/epochs/wallchain`.',
  })
  @ApiQuery({
    name: 'epochId',
    required: false,
    description: 'Epoch UUID (from `GET /infofi/epochs/wallchain`).',
    example: EXAMPLE_WALLCHAIN_EPOCH_ID,
  })
  @ApiQuery({ name: 'limit', required: false, example: 100 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiOkResponse({
    description:
      'Ranked Wallchain leaderboard rows, ordered by rank ascending.',
    schema: {
      example: [
        {
          id: '7b2f8959-aec5-40cc-84d9-54e5c0d03345',
          epochId: EXAMPLE_WALLCHAIN_EPOCH_ID,
          userId: '27553316',
          rank: 1,
          rankChange: 0,
          score: 584,
          mindshare: 1.429537,
          multiplier: null,
          user: {
            twitterId: '27553316',
            username: 'beijingdou',
            displayName: 'Josh Ong',
            imageUrl: 'https://...',
          },
        },
      ],
    },
  })
  getWallchainLeaderboard(@Query() query: WallchainLeaderboardQueryDto) {
    return this.infofi.getWallchainLeaderboard(query);
  }
}
