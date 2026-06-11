import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TwitterService } from './twitter.service';
import { TwitterApiResponse } from './interfaces/twitter-api-response.interface';

/**
 * Routes mirror the upstream Twitter API47 `/v3/...` paths 1:1 (mounted
 * under `/twitter`), so `GET /twitter/v3/user/by-username?username=elonmusk`
 * proxies directly to `GET /v3/user/by-username?username=elonmusk` upstream.
 *
 * All query parameters are forwarded to the upstream API verbatim. The
 * `@ApiQuery` annotations document the parameter names confirmed against the
 * live API's validation errors; pass whatever params the upstream expects -
 * they will be forwarded unchanged.
 */
@ApiTags('twitter')
@Controller('twitter')
export class TwitterController {
  constructor(private readonly twitterService: TwitterService) {}

  // ---------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------

  @Get('v3/user/by-username')
  @ApiOperation({ summary: "Get a user's profile by username" })
  @ApiQuery({ name: 'username', required: true, example: 'elonmusk' })
  getUserByUsername(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserByUsername(query);
  }

  @Get('v3/user/by-id')
  @ApiOperation({ summary: "Get a user's profile by numeric user ID" })
  @ApiQuery({ name: 'userId', required: true, example: '44196397' })
  getUserById(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserById(query);
  }

  @Get('v3/user/by-ids')
  @ApiOperation({
    summary: 'Batch lookup of user profiles by numeric user IDs',
  })
  @ApiQuery({
    name: 'userIds',
    required: true,
    description: 'Comma-separated user IDs',
  })
  getUsersByIds(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUsersByIds(query);
  }

  @Get('v3/user/tweets')
  @ApiOperation({ summary: "Get a user's tweets" })
  @ApiQuery({ name: 'userId', required: true, example: '44196397' })
  @ApiQuery({ name: 'cursor', required: false })
  getUserTweets(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserTweets(query);
  }

  @Get('v3/user/tweets-and-replies')
  @ApiOperation({ summary: "Get a user's tweets and replies" })
  @ApiQuery({ name: 'userId', required: true, example: '44196397' })
  @ApiQuery({ name: 'cursor', required: false })
  getUserTweetsAndReplies(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserTweetsAndReplies(query);
  }

  @Get('v3/user/followers')
  @ApiOperation({ summary: "Get a user's followers" })
  @ApiQuery({ name: 'userId', required: true, example: '44196397' })
  @ApiQuery({ name: 'cursor', required: false })
  getUserFollowers(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserFollowers(query);
  }

  @Get('v3/user/followers-ids')
  @ApiOperation({ summary: "Get the numeric IDs of a user's followers" })
  @ApiQuery({ name: 'userId', required: true, example: '44196397' })
  @ApiQuery({ name: 'cursor', required: false })
  getUserFollowersIds(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserFollowersIds(query);
  }

  @Get('v3/user/following')
  @ApiOperation({ summary: 'Get the accounts a user follows' })
  @ApiQuery({ name: 'userId', required: true, example: '44196397' })
  @ApiQuery({ name: 'cursor', required: false })
  getUserFollowing(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserFollowing(query);
  }

  @Get('v3/user/following-ids')
  @ApiOperation({ summary: 'Get the numeric IDs of accounts a user follows' })
  @ApiQuery({ name: 'userId', required: true, example: '44196397' })
  @ApiQuery({ name: 'cursor', required: false })
  getUserFollowingIds(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserFollowingIds(query);
  }

  // ---------------------------------------------------------------------
  // Derived features (computed locally - see README)
  // ---------------------------------------------------------------------

  @Get('v3/user/smart-followers')
  @ApiOperation({
    summary:
      "Get a user's 'smart' followers - followers ranked by reach and verification",
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
  @ApiQuery({ name: 'cursor', required: false })
  getSmartFollowers(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getSmartFollowers(query);
  }

  @Get('v3/user/paid-partnership-tweets')
  @ApiOperation({
    summary:
      "Get a user's tweets flagged as paid partnership / branded content",
  })
  @ApiQuery({
    name: 'username',
    required: false,
    example: 'elonmusk',
    description: 'Either username or userId is required',
  })
  @ApiQuery({ name: 'userId', required: false, example: '44196397' })
  @ApiQuery({ name: 'cursor', required: false })
  getPaidPartnershipTweets(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getPaidPartnershipTweets(query);
  }

  @Get('v3/user/stats')
  @ApiOperation({
    summary:
      'Get computed stats for a user (influence score, follower growth since last fetch)',
  })
  @ApiQuery({ name: 'username', required: true, example: 'elonmusk' })
  getUserStats(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserStats(query);
  }

  // ---------------------------------------------------------------------
  // Tweets
  // ---------------------------------------------------------------------

  @Get('v3/tweet/details')
  @ApiOperation({ summary: "Get a tweet's details" })
  @ApiQuery({ name: 'tweetId', required: true, example: '1881854756446003222' })
  @ApiQuery({ name: 'cursor', required: false })
  getTweetDetails(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getTweetDetails(query);
  }

  @Get('v3/tweet/retweets')
  @ApiOperation({ summary: 'Get the users who retweeted a tweet' })
  @ApiQuery({ name: 'tweetId', required: true, example: '1881854756446003222' })
  @ApiQuery({ name: 'cursor', required: false })
  getTweetRetweets(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getTweetRetweets(query);
  }

  @Get('v3/tweet/quotes')
  @ApiOperation({ summary: 'Get the quote tweets of a tweet' })
  @ApiQuery({ name: 'tweetId', required: true, example: '1881854756446003222' })
  @ApiQuery({ name: 'cursor', required: false })
  getTweetQuotes(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getTweetQuotes(query);
  }

  // ---------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------

  @Get('v3/search')
  @ApiOperation({ summary: 'Search tweets/users' })
  @ApiQuery({ name: 'query', required: true, example: 'nestjs' })
  @ApiQuery({
    name: 'type',
    required: true,
    description: 'e.g. "Top", "Latest", "People"',
  })
  @ApiQuery({ name: 'cursor', required: false })
  search(@Query() query: Record<string, string>): Promise<TwitterApiResponse> {
    return this.twitterService.search(query);
  }

  // ---------------------------------------------------------------------
  // Communities
  // ---------------------------------------------------------------------

  @Get('v3/community/details')
  @ApiOperation({ summary: 'Get details about a Twitter Community' })
  @ApiQuery({
    name: 'communityId',
    required: true,
    example: '1493446837214187523',
  })
  getCommunityDetails(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getCommunityDetails(query);
  }

  @Get('v3/community/tweets')
  @ApiOperation({ summary: "Get a Community's tweet timeline" })
  @ApiQuery({
    name: 'communityId',
    required: true,
    example: '1493446837214187523',
  })
  @ApiQuery({ name: 'cursor', required: false })
  getCommunityTweets(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getCommunityTweets(query);
  }

  @Get('v3/community/members')
  @ApiOperation({ summary: "Get a Community's members" })
  @ApiQuery({
    name: 'communityId',
    required: true,
    example: '1493446837214187523',
  })
  @ApiQuery({ name: 'cursor', required: false })
  getCommunityMembers(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getCommunityMembers(query);
  }

  @Get('v3/community/search')
  @ApiOperation({ summary: 'Search Twitter Communities' })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'cursor', required: false })
  searchCommunities(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.searchCommunities(query);
  }

  // ---------------------------------------------------------------------
  // Lists
  // ---------------------------------------------------------------------

  @Get('v3/list/tweets')
  @ApiOperation({ summary: "Get a List's tweet timeline" })
  @ApiQuery({ name: 'listId', required: true, example: '1234567890' })
  @ApiQuery({ name: 'cursor', required: false })
  getListTweets(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getListTweets(query);
  }

  @Get('v3/list/members')
  @ApiOperation({ summary: "Get a List's members" })
  @ApiQuery({ name: 'listId', required: true, example: '1234567890' })
  @ApiQuery({ name: 'cursor', required: false })
  getListMembers(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getListMembers(query);
  }

  @Get('v3/list/details')
  @ApiOperation({ summary: 'Get details about a List' })
  @ApiQuery({ name: 'listId', required: true, example: '1234567890' })
  getListDetails(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getListDetails(query);
  }

  @Get('v3/list/followers')
  @ApiOperation({ summary: "Get a List's followers" })
  @ApiQuery({ name: 'listId', required: true, example: '1234567890' })
  @ApiQuery({ name: 'cursor', required: false })
  getListFollowers(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getListFollowers(query);
  }

  // ---------------------------------------------------------------------
  // Spaces
  // ---------------------------------------------------------------------

  @Get('v3/space/by-id')
  @ApiOperation({ summary: 'Get details about a Twitter Space' })
  @ApiQuery({ name: 'spaceId', required: true, example: '1RDxlgyZbnAJL' })
  getSpaceById(
    @Query() query: Record<string, string>,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getSpaceById(query);
  }
}
