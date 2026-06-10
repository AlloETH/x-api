import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { TWITTER_ENDPOINTS } from './constants/twitter-endpoints.constant';
import { TwitterApiResponse } from './interfaces/twitter-api-response.interface';
import { TwitterStorageService } from './twitter-storage.service';
import {
  computeInfluenceScore,
  extractTweets,
  extractUsers,
  isPaidPartnershipTweet,
  smartFollowerScore,
} from './utils/twitter-data.util';

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
 *
 * User profiles and tweets fetched via this service are also persisted to
 * the local database (see `TwitterStorageService`) so they can be analyzed
 * later (follower growth, smart followers, paid partnership tweets, etc.).
 */
@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly storage: TwitterStorageService,
  ) {}

  // ---------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------

  /** GET /v3/user/by-username - get a user's profile by @username. */
  async getUserByUsername(query: TwitterQuery): Promise<TwitterApiResponse> {
    const response = await this.proxy(
      TWITTER_ENDPOINTS.USER_BY_USERNAME,
      query,
    );
    await this.storage.saveUserSnapshots(response);
    return response;
  }

  /** GET /v3/user/by-id - get a user's profile by numeric user ID. */
  async getUserById(query: TwitterQuery): Promise<TwitterApiResponse> {
    const response = await this.proxy(TWITTER_ENDPOINTS.USER_BY_ID, query);
    await this.storage.saveUserSnapshots(response);
    return response;
  }

  /** GET /v3/user/by-ids - batch lookup of user profiles by ID. */
  async getUsersByIds(query: TwitterQuery): Promise<TwitterApiResponse> {
    const response = await this.proxy(TWITTER_ENDPOINTS.USERS_BY_IDS, query);
    await this.storage.saveUserSnapshots(response);
    return response;
  }

  /** GET /v3/user/tweets - get a user's tweets. */
  async getUserTweets(query: TwitterQuery): Promise<TwitterApiResponse> {
    const response = await this.proxy(TWITTER_ENDPOINTS.USER_TWEETS, query);
    await this.storage.saveTweets(response);
    return response;
  }

  /** GET /v3/user/tweets-and-replies - get a user's tweets and replies. */
  async getUserTweetsAndReplies(
    query: TwitterQuery,
  ): Promise<TwitterApiResponse> {
    const response = await this.proxy(
      TWITTER_ENDPOINTS.USER_TWEETS_AND_REPLIES,
      query,
    );
    await this.storage.saveTweets(response);
    return response;
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
  // Derived features (not 1:1 upstream endpoints - see README)
  // ---------------------------------------------------------------------

  /**
   * Fetches a user's followers (`/v3/user/followers`) and ranks them by
   * `smartFollowerScore` (reach + a verification bonus), returning the
   * top `limit` (default 25). The ranking is also persisted so it can be
   * tracked over time.
   */
  async getSmartFollowers(query: TwitterQuery): Promise<TwitterApiResponse> {
    const username =
      query.username !== undefined ? String(query.username) : undefined;
    const limit = query.limit !== undefined ? Number(query.limit) : 25;

    const upstreamQuery: TwitterQuery = { ...query };
    delete upstreamQuery.limit;

    const response = await this.proxy(
      TWITTER_ENDPOINTS.USER_FOLLOWERS,
      upstreamQuery,
    );
    const followers = extractUsers(response);

    const ranked = followers
      .map((follower) => ({
        ...follower,
        score: smartFollowerScore(follower),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (username) {
      await this.storage.saveSmartFollowers(username, ranked);
    }

    return {
      username,
      count: ranked.length,
      smartFollowers: ranked.map((follower) => ({
        id: follower.id,
        username: follower.username,
        followersCount: follower.followersCount,
        followingCount: follower.followingCount,
        tweetsCount: follower.tweetsCount,
        verified: follower.verified,
        score: follower.score,
      })),
    };
  }

  /**
   * Fetches a user's tweets (`/v3/user/tweets`) and returns only the ones
   * flagged as paid partnership / branded content (see
   * `isPaidPartnershipTweet`). All fetched tweets are persisted, with the
   * paid-partnership flag stored alongside each one.
   */
  async getPaidPartnershipTweets(
    query: TwitterQuery,
  ): Promise<TwitterApiResponse> {
    const username =
      query.username !== undefined ? String(query.username) : undefined;

    const response = await this.proxy(TWITTER_ENDPOINTS.USER_TWEETS, query);
    await this.storage.saveTweets(response);

    const tweets = extractTweets(response).filter(isPaidPartnershipTweet);

    return {
      username,
      count: tweets.length,
      tweets: tweets.map((tweet) => ({
        id: tweet.id,
        authorId: tweet.authorId,
        authorUsername: tweet.authorUsername,
        text: tweet.text,
      })),
    };
  }

  /**
   * Fetches a user's profile (`/v3/user/by-username`) and returns derived
   * stats: an "influence score" (see `computeInfluenceScore`) and follower
   * growth since the last time this user was fetched.
   */
  async getUserStats(query: TwitterQuery): Promise<TwitterApiResponse> {
    const response = await this.proxy(
      TWITTER_ENDPOINTS.USER_BY_USERNAME,
      query,
    );
    const [user] = extractUsers(response);

    if (!user) {
      return response;
    }

    const previous = await this.storage.getLatestSnapshot(user.username);
    await this.storage.saveUserSnapshots(response);

    return {
      id: user.id,
      username: user.username,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      tweetsCount: user.tweetsCount,
      verified: user.verified,
      influenceScore: computeInfluenceScore(user),
      followerGrowth: previous
        ? user.followersCount - previous.followersCount
        : null,
      previousFetchedAt: previous?.fetchedAt ?? null,
    };
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
