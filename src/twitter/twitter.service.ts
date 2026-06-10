import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { TWITTER_ENDPOINTS } from './constants/twitter-endpoints.constant';
import { TwitterApiResponse } from './interfaces/twitter-api-response.interface';

export type TwitterQuery = Record<
  string,
  string | number | boolean | undefined
>;

/**
 * Thin 1:1 wrapper around the Twitter API47 (RapidAPI) `/v3` endpoints.
 *
 * Every method forwards the given query params verbatim to the matching
 * upstream endpoint (see `twitter-endpoints.constant.ts`), so any parameter
 * accepted by the upstream API can be passed through unchanged.
 */
@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name);

  constructor(private readonly httpService: HttpService) {}

  // ---------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------

  /** GET /v3/user/by-username - get a user's profile by @username. */
  getUserByUsername(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.USER_BY_USERNAME, query);
  }

  /** GET /v3/user/by-id - get a user's profile by numeric user ID. */
  getUserById(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.USER_BY_ID, query);
  }

  /** GET /v3/user/by-ids - batch lookup of user profiles by ID. */
  getUsersByIds(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.USERS_BY_IDS, query);
  }

  /** GET /v3/user/tweets - get a user's tweets. */
  getUserTweets(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.USER_TWEETS, query);
  }

  /** GET /v3/user/tweets-and-replies - get a user's tweets and replies. */
  getUserTweetsAndReplies(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.USER_TWEETS_AND_REPLIES, query);
  }

  /** GET /v3/user/followers - get a user's followers. */
  getUserFollowers(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.USER_FOLLOWERS, query);
  }

  /** GET /v3/user/followers-ids - get the numeric IDs of a user's followers. */
  getUserFollowersIds(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.USER_FOLLOWERS_IDS, query);
  }

  /** GET /v3/user/following - get the accounts a user follows. */
  getUserFollowing(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.USER_FOLLOWING, query);
  }

  /** GET /v3/user/following-ids - get the numeric IDs of accounts a user follows. */
  getUserFollowingIds(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.USER_FOLLOWING_IDS, query);
  }

  // ---------------------------------------------------------------------
  // Tweets
  // ---------------------------------------------------------------------

  /** GET /v3/tweet/details - get a tweet's details. */
  getTweetDetails(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.TWEET_DETAILS, query);
  }

  /** GET /v3/tweet/retweets - get the users who retweeted a tweet. */
  getTweetRetweets(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.TWEET_RETWEETS, query);
  }

  /** GET /v3/tweet/quotes - get the quote tweets of a tweet. */
  getTweetQuotes(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.TWEET_QUOTES, query);
  }

  // ---------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------

  /** GET /v3/search - search tweets/users. */
  search(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.SEARCH, query);
  }

  // ---------------------------------------------------------------------
  // Communities
  // ---------------------------------------------------------------------

  /** GET /v3/community/details - get details about a Community. */
  getCommunityDetails(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.COMMUNITY_DETAILS, query);
  }

  /** GET /v3/community/tweets - get a Community's tweet timeline. */
  getCommunityTweets(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.COMMUNITY_TWEETS, query);
  }

  /** GET /v3/community/members - get a Community's members. */
  getCommunityMembers(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.COMMUNITY_MEMBERS, query);
  }

  /** GET /v3/community/search - search Communities. */
  searchCommunities(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.COMMUNITY_SEARCH, query);
  }

  // ---------------------------------------------------------------------
  // Lists
  // ---------------------------------------------------------------------

  /** GET /v3/list/tweets - get a List's tweet timeline. */
  getListTweets(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.LIST_TWEETS, query);
  }

  /** GET /v3/list/members - get a List's members. */
  getListMembers(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.LIST_MEMBERS, query);
  }

  /** GET /v3/list/details - get details about a List. */
  getListDetails(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.LIST_DETAILS, query);
  }

  /** GET /v3/list/followers - get a List's followers. */
  getListFollowers(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.LIST_FOLLOWERS, query);
  }

  // ---------------------------------------------------------------------
  // Spaces
  // ---------------------------------------------------------------------

  /** GET /v3/space/by-id - get details about a Space. */
  getSpaceById(query: TwitterQuery): Promise<TwitterApiResponse> {
    return this.proxy(TWITTER_ENDPOINTS.SPACE_BY_ID, query);
  }

  // ---------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------

  private async proxy(
    endpoint: string,
    query: TwitterQuery,
  ): Promise<TwitterApiResponse> {
    const params = this.cleanParams(query);
    this.logger.debug(`GET ${endpoint} ${JSON.stringify(params)}`);
    const response = await firstValueFrom(
      this.httpService.get<TwitterApiResponse>(endpoint, { params }),
    );
    return response.data;
  }

  /** Strips undefined/empty values so they aren't forwarded as query params. */
  private cleanParams(query: TwitterQuery): TwitterQuery {
    return Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== undefined && value !== '',
      ),
    );
  }
}
