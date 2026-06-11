import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ApiUpstreamErrorResponses } from '../common/decorators/api-upstream-response.decorator';
import { TwitterService } from './twitter.service';
import { TwitterApiResponse } from './interfaces/twitter-api-response.interface';
import {
  FOLLOWERS_RESPONSE_EXAMPLE,
  FOLLOWING_RESPONSE_EXAMPLE,
  PAID_PARTNERSHIP_RESPONSE_EXAMPLE,
  SMART_FOLLOWERS_RESPONSE_EXAMPLE,
  TWEETS_RESPONSE_EXAMPLE,
  USER_RESPONSE_EXAMPLE,
  USER_STATS_RESPONSE_EXAMPLE,
} from './swagger/response-examples.constant';

const RAW_PASSTHROUGH_DESCRIPTION =
  "Raw passthrough of the upstream API's JSON response - the exact shape " +
  "hasn't been confirmed against the live API for this endpoint (see " +
  'README), so no example is given here.';

/**
 * Routes mirror the upstream API's `/v3/...` paths 1:1 (mounted
 * under `/twitter`), so `GET /twitter/v3/user/by-username?username=elonmusk`
 * proxies directly to `GET /v3/user/by-username?username=elonmusk` upstream.
 *
 * All query parameters are forwarded to the upstream API verbatim. The
 * `@ApiQuery` annotations document the parameter names confirmed against the
 * live API's validation errors; pass whatever params the upstream expects -
 * they will be forwarded unchanged.
 *
 * Every route can additionally return the error responses documented by
 * `@ApiUpstreamErrorResponses` (validation errors, rate limiting, and
 * upstream failures).
 */
@ApiUpstreamErrorResponses()
@Controller('twitter')
export class TwitterController {
  constructor(private readonly twitterService: TwitterService) {}

  // ---------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------

  @Get('v3/user/by-username')
  @ApiTags('Users')
  @ApiOperation({ summary: "Get a user's profile by username" })
  @ApiQuery({ name: 'username', required: true, example: 'elonmusk' })
  @ApiOkResponse({
    description: "The user's profile, as returned by the upstream API.",
    schema: { example: USER_RESPONSE_EXAMPLE },
  })
  getUserByUsername(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserByUsername(query);
  }

  @Get('v3/user/by-id')
  @ApiTags('Users')
  @ApiOperation({ summary: "Get a user's profile by numeric user ID" })
  @ApiQuery({ name: 'userId', required: true, example: '44196397' })
  @ApiOkResponse({
    description: "The user's profile, as returned by the upstream API.",
    schema: { example: USER_RESPONSE_EXAMPLE },
  })
  getUserById(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserById(query);
  }

  @Get('v3/user/by-ids')
  @ApiTags('Users')
  @ApiOperation({
    summary: 'Batch lookup of user profiles by numeric user IDs',
  })
  @ApiQuery({
    name: 'userIds',
    required: true,
    description: 'Comma-separated user IDs',
  })
  @ApiOkResponse({ description: RAW_PASSTHROUGH_DESCRIPTION })
  getUsersByIds(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUsersByIds(query);
  }

  @Get('v3/user/tweets')
  @ApiTags('Users')
  @ApiOperation({ summary: "Get a user's tweets" })
  @ApiQuery({ name: 'userId', required: true, example: '44196397' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({
    description:
      "The user's tweets, newest first, as returned by the upstream " +
      'API. Also persisted to the database (see README).',
    schema: { example: TWEETS_RESPONSE_EXAMPLE },
  })
  getUserTweets(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserTweets(query);
  }

  @Get('v3/user/tweets-and-replies')
  @ApiTags('Users')
  @ApiOperation({ summary: "Get a user's tweets and replies" })
  @ApiQuery({ name: 'userId', required: true, example: '44196397' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({
    description:
      "The user's tweets and replies, newest first, as returned by the " +
      'upstream API. Also persisted to the database (see README).',
    schema: { example: TWEETS_RESPONSE_EXAMPLE },
  })
  getUserTweetsAndReplies(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserTweetsAndReplies(query);
  }

  @Get('v3/user/followers')
  @ApiTags('Users')
  @ApiOperation({ summary: "Get a user's followers" })
  @ApiQuery({ name: 'userId', required: true, example: '44196397' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({
    description: "The user's followers, as returned by the upstream API.",
    schema: { example: FOLLOWERS_RESPONSE_EXAMPLE },
  })
  getUserFollowers(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserFollowers(query);
  }

  @Get('v3/user/followers-ids')
  @ApiTags('Users')
  @ApiOperation({ summary: "Get the numeric IDs of a user's followers" })
  @ApiQuery({ name: 'userId', required: true, example: '44196397' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ description: RAW_PASSTHROUGH_DESCRIPTION })
  getUserFollowersIds(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserFollowersIds(query);
  }

  @Get('v3/user/following')
  @ApiTags('Users')
  @ApiOperation({ summary: 'Get the accounts a user follows' })
  @ApiQuery({ name: 'userId', required: true, example: '44196397' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({
    description:
      'The accounts the user follows, as returned by the upstream API. ' +
      'The exact shape is presumed (but not independently confirmed) to ' +
      'mirror `user/followers`.',
    schema: { example: FOLLOWING_RESPONSE_EXAMPLE },
  })
  getUserFollowing(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserFollowing(query);
  }

  @Get('v3/user/following-ids')
  @ApiTags('Users')
  @ApiOperation({ summary: 'Get the numeric IDs of accounts a user follows' })
  @ApiQuery({ name: 'userId', required: true, example: '44196397' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ description: RAW_PASSTHROUGH_DESCRIPTION })
  getUserFollowingIds(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserFollowingIds(query);
  }

  // ---------------------------------------------------------------------
  // Derived features (computed locally - see README)
  // ---------------------------------------------------------------------

  @Get('v3/user/smart-followers')
  @ApiTags('Analytics')
  @ApiOperation({
    summary:
      "Get a user's 'smart' followers - followers ranked by reach and verification",
    description:
      "Fetches the user's followers (`/v3/user/followers`, paginating up " +
      'to 5 pages) and ranks them by `followersCount` plus a large bonus ' +
      'if the account is verified, returning the top `limit` (default ' +
      '25). The ranking is also persisted so it can be tracked over time. ' +
      '**Not** a 1:1 upstream proxy - see README.',
  })
  @ApiQuery({
    name: 'username',
    required: false,
    example: 'elonmusk',
    description: 'Either username or userId is required',
  })
  @ApiQuery({ name: 'userId', required: false, example: '44196397' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max number of smart followers to return (default 25)',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description:
      'Cursor for the first `/v3/user/followers` page to fetch ' +
      '(subsequent pages, if any, are fetched automatically).',
  })
  @ApiOkResponse({
    description: "A user's followers ranked by reach + verification.",
    schema: { example: SMART_FOLLOWERS_RESPONSE_EXAMPLE },
  })
  getSmartFollowers(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getSmartFollowers(query);
  }

  @Get('v3/user/paid-partnership-tweets')
  @ApiTags('Analytics')
  @ApiOperation({
    summary:
      "Get a user's tweets flagged as paid partnership / branded content",
    description:
      'Returns tweets flagged as paid partnership / branded content over ' +
      'the last `period` (default 30d). However long `period` is, only the ' +
      'most recent 7 days are re-fetched from the upstream API (paginating ' +
      'up to 10 pages); anything older is served from previously-stored ' +
      'tweets. **Not** a 1:1 upstream proxy - see README.',
  })
  @ApiQuery({
    name: 'username',
    required: false,
    example: 'elonmusk',
    description: 'Either username or userId is required',
  })
  @ApiQuery({ name: 'userId', required: false, example: '44196397' })
  @ApiQuery({
    name: 'period',
    required: false,
    example: '30d',
    description:
      'How far back to look: a number followed by d/m/y, e.g. "7d", "30d", ' +
      '"3m", "6m", "1y", "2y" (default "30d"). Only the most recent 7 days ' +
      'are re-fetched from the upstream API; older data comes from the ' +
      'database.',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description:
      'Cursor to start paginating from (defaults to the newest tweets)',
  })
  @ApiOkResponse({
    description:
      "A user's tweets flagged as paid partnership / branded content over " +
      '`period`.',
    schema: { example: PAID_PARTNERSHIP_RESPONSE_EXAMPLE },
  })
  getPaidPartnershipTweets(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getPaidPartnershipTweets(query);
  }

  @Get('v3/user/stats')
  @ApiTags('Analytics')
  @ApiOperation({
    summary:
      'Get computed stats for a user (influence score, follower growth since last fetch)',
    description:
      "Re-fetches the user's profile (`/v3/user/by-username`) and returns " +
      'an `influenceScore` (log-scaled reach + follower/following ratio + a ' +
      'verification bonus) and `followerGrowth` since the last time this ' +
      'user was fetched through this API. **Not** a 1:1 upstream proxy - ' +
      'see README.',
  })
  @ApiQuery({ name: 'username', required: true, example: 'elonmusk' })
  @ApiOkResponse({
    description: "A user's influence score and follower growth.",
    schema: { example: USER_STATS_RESPONSE_EXAMPLE },
  })
  getUserStats(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserStats(query);
  }

  // ---------------------------------------------------------------------
  // Tweets
  // ---------------------------------------------------------------------

  @Get('v3/tweet/details')
  @ApiTags('Tweets')
  @ApiOperation({ summary: "Get a tweet's details" })
  @ApiQuery({ name: 'tweetId', required: true, example: '1881854756446003222' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ description: RAW_PASSTHROUGH_DESCRIPTION })
  getTweetDetails(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getTweetDetails(query);
  }

  @Get('v3/tweet/retweets')
  @ApiTags('Tweets')
  @ApiOperation({ summary: 'Get the users who retweeted a tweet' })
  @ApiQuery({ name: 'tweetId', required: true, example: '1881854756446003222' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ description: RAW_PASSTHROUGH_DESCRIPTION })
  getTweetRetweets(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getTweetRetweets(query);
  }

  @Get('v3/tweet/quotes')
  @ApiTags('Tweets')
  @ApiOperation({ summary: 'Get the quote tweets of a tweet' })
  @ApiQuery({ name: 'tweetId', required: true, example: '1881854756446003222' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ description: RAW_PASSTHROUGH_DESCRIPTION })
  getTweetQuotes(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getTweetQuotes(query);
  }

  // ---------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------

  @Get('v3/search')
  @ApiTags('Search')
  @ApiOperation({ summary: 'Search tweets/users' })
  @ApiQuery({ name: 'query', required: true, example: 'nestjs' })
  @ApiQuery({
    name: 'type',
    required: true,
    description: 'e.g. "Top", "Latest", "People"',
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ description: RAW_PASSTHROUGH_DESCRIPTION })
  search(@Query() query: Record<string, string>): Promise<TwitterApiResponse> {
    return this.twitterService.search(query);
  }

  // ---------------------------------------------------------------------
  // Communities
  // ---------------------------------------------------------------------

  @Get('v3/community/details')
  @ApiTags('Communities')
  @ApiOperation({ summary: 'Get details about a Twitter Community' })
  @ApiQuery({
    name: 'communityId',
    required: true,
    example: '1493446837214187523',
  })
  @ApiOkResponse({ description: RAW_PASSTHROUGH_DESCRIPTION })
  getCommunityDetails(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getCommunityDetails(query);
  }

  @Get('v3/community/tweets')
  @ApiTags('Communities')
  @ApiOperation({ summary: "Get a Community's tweet timeline" })
  @ApiQuery({
    name: 'communityId',
    required: true,
    example: '1493446837214187523',
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ description: RAW_PASSTHROUGH_DESCRIPTION })
  getCommunityTweets(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getCommunityTweets(query);
  }

  @Get('v3/community/members')
  @ApiTags('Communities')
  @ApiOperation({ summary: "Get a Community's members" })
  @ApiQuery({
    name: 'communityId',
    required: true,
    example: '1493446837214187523',
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ description: RAW_PASSTHROUGH_DESCRIPTION })
  getCommunityMembers(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getCommunityMembers(query);
  }

  @Get('v3/community/search')
  @ApiTags('Communities')
  @ApiOperation({ summary: 'Search Twitter Communities' })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ description: RAW_PASSTHROUGH_DESCRIPTION })
  searchCommunities(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.searchCommunities(query);
  }

  // ---------------------------------------------------------------------
  // Lists
  // ---------------------------------------------------------------------

  @Get('v3/list/tweets')
  @ApiTags('Lists')
  @ApiOperation({ summary: "Get a List's tweet timeline" })
  @ApiQuery({ name: 'listId', required: true, example: '1234567890' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ description: RAW_PASSTHROUGH_DESCRIPTION })
  getListTweets(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getListTweets(query);
  }

  @Get('v3/list/members')
  @ApiTags('Lists')
  @ApiOperation({ summary: "Get a List's members" })
  @ApiQuery({ name: 'listId', required: true, example: '1234567890' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ description: RAW_PASSTHROUGH_DESCRIPTION })
  getListMembers(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getListMembers(query);
  }

  @Get('v3/list/details')
  @ApiTags('Lists')
  @ApiOperation({ summary: 'Get details about a List' })
  @ApiQuery({ name: 'listId', required: true, example: '1234567890' })
  @ApiOkResponse({ description: RAW_PASSTHROUGH_DESCRIPTION })
  getListDetails(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getListDetails(query);
  }

  @Get('v3/list/followers')
  @ApiTags('Lists')
  @ApiOperation({ summary: "Get a List's followers" })
  @ApiQuery({ name: 'listId', required: true, example: '1234567890' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ description: RAW_PASSTHROUGH_DESCRIPTION })
  getListFollowers(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getListFollowers(query);
  }

  // ---------------------------------------------------------------------
  // Spaces
  // ---------------------------------------------------------------------

  @Get('v3/space/by-id')
  @ApiTags('Spaces')
  @ApiOperation({ summary: 'Get details about a Twitter Space' })
  @ApiQuery({ name: 'spaceId', required: true, example: '1RDxlgyZbnAJL' })
  @ApiOkResponse({ description: RAW_PASSTHROUGH_DESCRIPTION })
  getSpaceById(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getSpaceById(query);
  }
}
