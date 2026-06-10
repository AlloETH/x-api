import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TwitterService } from './twitter.service';
import { CursorQueryDto } from './dto/cursor-query.dto';
import { SearchQueryDto, TwitterSearchType } from './dto/search-query.dto';
import { TrendsQueryDto } from './dto/trends-query.dto';
import { CheckRetweetQueryDto } from './dto/check-retweet-query.dto';
import { TwitterApiResponse } from './interfaces/twitter-api-response.interface';

@ApiTags('twitter')
@Controller('twitter')
export class TwitterController {
  constructor(private readonly twitterService: TwitterService) {}

  // ---------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------

  @Get('users/:username')
  @ApiOperation({ summary: "Get a user's profile by username" })
  @ApiParam({ name: 'username', example: 'elonmusk' })
  getUserByUsername(
    @Param('username') username: string,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserByUsername(username);
  }

  @Get('users/:username/tweets')
  @ApiOperation({ summary: "Get a user's tweets" })
  @ApiParam({ name: 'username', example: 'elonmusk' })
  getUserTweets(
    @Param('username') username: string,
    @Query() { cursor }: CursorQueryDto,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserTweets(username, cursor);
  }

  @Get('users/:username/tweets-and-replies')
  @ApiOperation({ summary: "Get a user's tweets and replies" })
  @ApiParam({ name: 'username', example: 'elonmusk' })
  getUserTweetsAndReplies(
    @Param('username') username: string,
    @Query() { cursor }: CursorQueryDto,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserTweetsAndReplies(username, cursor);
  }

  @Get('users/:username/media')
  @ApiOperation({ summary: "Get a user's media (photos & videos)" })
  @ApiParam({ name: 'username', example: 'elonmusk' })
  getUserMedia(
    @Param('username') username: string,
    @Query() { cursor }: CursorQueryDto,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserMedia(username, cursor);
  }

  @Get('users/:username/likes')
  @ApiOperation({ summary: 'Get the tweets a user has liked' })
  @ApiParam({ name: 'username', example: 'elonmusk' })
  getUserLikes(
    @Param('username') username: string,
    @Query() { cursor }: CursorQueryDto,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserLikes(username, cursor);
  }

  @Get('users/:username/followers')
  @ApiOperation({ summary: "Get a user's followers" })
  @ApiParam({ name: 'username', example: 'elonmusk' })
  getUserFollowers(
    @Param('username') username: string,
    @Query() { cursor }: CursorQueryDto,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserFollowers(username, cursor);
  }

  @Get('users/:username/following')
  @ApiOperation({ summary: 'Get the accounts a user follows' })
  @ApiParam({ name: 'username', example: 'elonmusk' })
  getUserFollowing(
    @Param('username') username: string,
    @Query() { cursor }: CursorQueryDto,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserFollowing(username, cursor);
  }

  @Get('users/:username/highlights')
  @ApiOperation({ summary: "Get a user's highlighted tweets" })
  @ApiParam({ name: 'username', example: 'elonmusk' })
  getUserHighlights(
    @Param('username') username: string,
    @Query() { cursor }: CursorQueryDto,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserHighlights(username, cursor);
  }

  @Get('users/:username/affiliates')
  @ApiOperation({ summary: "Get a user's verified affiliate accounts" })
  @ApiParam({ name: 'username', example: 'elonmusk' })
  getUserAffiliates(
    @Param('username') username: string,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getUserAffiliates(username);
  }

  // ---------------------------------------------------------------------
  // Tweets
  // ---------------------------------------------------------------------

  @Get('tweets/:id')
  @ApiOperation({ summary: 'Get a tweet by ID' })
  @ApiParam({ name: 'id', example: '1881854756446003222' })
  getTweetDetail(
    @Param('id') id: string,
    @Query() { cursor }: CursorQueryDto,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getTweetDetail(id, cursor);
  }

  @Get('tweets/:id/replies')
  @ApiOperation({ summary: 'Get the reply thread for a tweet' })
  @ApiParam({ name: 'id', example: '1881854756446003222' })
  getTweetReplies(
    @Param('id') id: string,
    @Query() { cursor }: CursorQueryDto,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getTweetReplies(id, cursor);
  }

  @Get('tweets/:id/retweets')
  @ApiOperation({ summary: 'Get the users who retweeted a tweet' })
  @ApiParam({ name: 'id', example: '1881854756446003222' })
  getTweetRetweets(
    @Param('id') id: string,
    @Query() { cursor }: CursorQueryDto,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getTweetRetweets(id, cursor);
  }

  @Get('tweets/:id/check-retweet')
  @ApiOperation({ summary: 'Check whether a user retweeted a tweet' })
  @ApiParam({ name: 'id', example: '1881854756446003222' })
  checkRetweet(
    @Param('id') id: string,
    @Query() { userId }: CheckRetweetQueryDto,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.checkRetweet(id, userId);
  }

  // ---------------------------------------------------------------------
  // Search & trends
  // ---------------------------------------------------------------------

  @Get('search')
  @ApiOperation({ summary: 'Search tweets, users, photos or videos' })
  search(
    @Query() { query, searchType, cursor }: SearchQueryDto,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.search(
      query,
      searchType ?? TwitterSearchType.TOP,
      cursor,
    );
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get trending topics for a location' })
  getTrends(@Query() { woeid }: TrendsQueryDto): Promise<TwitterApiResponse> {
    return this.twitterService.getTrends(woeid);
  }

  // ---------------------------------------------------------------------
  // Communities
  // ---------------------------------------------------------------------

  @Get('communities/:id')
  @ApiOperation({ summary: 'Get details about a Twitter Community' })
  @ApiParam({ name: 'id', example: '1493446837214187523' })
  getCommunityDetails(@Param('id') id: string): Promise<TwitterApiResponse> {
    return this.twitterService.getCommunityDetails(id);
  }

  @Get('communities/:id/timeline')
  @ApiOperation({ summary: 'Get the tweet timeline of a Twitter Community' })
  @ApiParam({ name: 'id', example: '1493446837214187523' })
  getCommunityTimeline(
    @Param('id') id: string,
    @Query() { cursor }: CursorQueryDto,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getCommunityTimeline(id, cursor);
  }

  // ---------------------------------------------------------------------
  // Lists
  // ---------------------------------------------------------------------

  @Get('lists/:id/timeline')
  @ApiOperation({ summary: 'Get the tweet timeline of a Twitter List' })
  @ApiParam({ name: 'id', example: '1234567890' })
  getListTimeline(
    @Param('id') id: string,
    @Query() { cursor }: CursorQueryDto,
  ): Promise<TwitterApiResponse> {
    return this.twitterService.getListTimeline(id, cursor);
  }

  // ---------------------------------------------------------------------
  // Spaces
  // ---------------------------------------------------------------------

  @Get('spaces/:id')
  @ApiOperation({ summary: 'Get details about a Twitter Space' })
  @ApiParam({ name: 'id', example: '1RDxlgyZbnAJL' })
  getSpaceDetails(@Param('id') id: string): Promise<TwitterApiResponse> {
    return this.twitterService.getSpaceDetails(id);
  }
}
