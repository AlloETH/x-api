import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { X_ENDPOINTS } from './constants/x-endpoints.constant';
import { XApiResponse } from './interfaces/x-api-response.interface';
import { XStorageService } from './x-storage.service';
import {
  computeInfluenceScore,
  ExtractedTweet,
  ExtractedUser,
  extractTweets,
  extractUsers,
  isPaidPartnershipTweet,
  smartFollowerScore,
} from './utils/x-data.util';
import { parsePeriodDays } from './utils/period.util';

export type XQuery = Record<string, string | number | boolean | undefined>;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Default `period` for `getPaidPartnershipTweets` if none is given. */
const PAID_PARTNERSHIP_DEFAULT_PERIOD = '30d';

/**
 * However long a `period` is requested, `getPaidPartnershipTweets` only ever
 * re-fetches this many days from the upstream API; anything older is served
 * from previously-stored tweets.
 */
const PAID_PARTNERSHIP_REFRESH_DAYS = 7;

/**
 * Hard cap on `/v3/user/tweets` pages fetched per `getPaidPartnershipTweets`
 * call, so a very high-volume account can't exhaust the upstream quota in a
 * single request.
 */
const PAID_PARTNERSHIP_MAX_PAGES = 10;

/**
 * Hard cap on `/v3/user/followers` pages fetched per `getSmartFollowers`
 * call, so a high-follower-count account can't exhaust the upstream quota in
 * a single request.
 */
const SMART_FOLLOWERS_MAX_PAGES = 5;

/**
 * Thin 1:1 wrapper around the upstream API's `/v3` endpoints.
 *
 * Every method forwards the given query params verbatim to the matching
 * upstream endpoint (see `x-endpoints.constant.ts`), so any parameter
 * accepted by the upstream API can be passed through unchanged.
 *
 * User profiles and tweets fetched via this service are also persisted to
 * the local database (see `XStorageService`) so they can be analyzed
 * later (follower growth, smart followers, paid partnership tweets, etc.).
 */
@Injectable()
export class XService {
  private readonly logger = new Logger(XService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly storage: XStorageService,
  ) {}

  // ---------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------

  /** GET /v3/user/by-username - get a user's profile by @username. */
  async getUserByUsername(query: XQuery): Promise<XApiResponse> {
    const response = await this.proxy(X_ENDPOINTS.USER_BY_USERNAME, query);
    await this.storage.saveUserSnapshots(response);
    return response;
  }

  /** GET /v3/user/by-id - get a user's profile by numeric user ID. */
  async getUserById(query: XQuery): Promise<XApiResponse> {
    const response = await this.proxy(X_ENDPOINTS.USER_BY_ID, query);
    await this.storage.saveUserSnapshots(response);
    return response;
  }

  /** GET /v3/user/by-ids - batch lookup of user profiles by ID. */
  async getUsersByIds(query: XQuery): Promise<XApiResponse> {
    const response = await this.proxy(X_ENDPOINTS.USERS_BY_IDS, query);
    await this.storage.saveUserSnapshots(response);
    return response;
  }

  /** GET /v3/user/tweets - get a user's tweets. */
  async getUserTweets(query: XQuery): Promise<XApiResponse> {
    const response = await this.proxy(X_ENDPOINTS.USER_TWEETS, query);
    await this.storage.saveTweets(response);
    return response;
  }

  /** GET /v3/user/tweets-and-replies - get a user's tweets and replies. */
  async getUserTweetsAndReplies(query: XQuery): Promise<XApiResponse> {
    const response = await this.proxy(
      X_ENDPOINTS.USER_TWEETS_AND_REPLIES,
      query,
    );
    await this.storage.saveTweets(response);
    return response;
  }

  /** GET /v3/user/followers - get a user's followers. */
  getUserFollowers(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.USER_FOLLOWERS, query);
  }

  /** GET /v3/user/followers-ids - get the numeric IDs of a user's followers. */
  getUserFollowersIds(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.USER_FOLLOWERS_IDS, query);
  }

  /** GET /v3/user/following - get the accounts a user follows. */
  getUserFollowing(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.USER_FOLLOWING, query);
  }

  /** GET /v3/user/following-ids - get the numeric IDs of accounts a user follows. */
  getUserFollowingIds(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.USER_FOLLOWING_IDS, query);
  }

  // ---------------------------------------------------------------------
  // Tweets
  // ---------------------------------------------------------------------

  /** GET /v3/tweet/details - get a tweet's details. */
  getTweetDetails(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.TWEET_DETAILS, query);
  }

  /** GET /v3/tweet/retweets - get the users who retweeted a tweet. */
  getTweetRetweets(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.TWEET_RETWEETS, query);
  }

  /** GET /v3/tweet/quotes - get the quote tweets of a tweet. */
  getTweetQuotes(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.TWEET_QUOTES, query);
  }

  // ---------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------

  /** GET /v3/search - search tweets/users. */
  search(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.SEARCH, query);
  }

  // ---------------------------------------------------------------------
  // Communities
  // ---------------------------------------------------------------------

  /** GET /v3/community/details - get details about a Community. */
  getCommunityDetails(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.COMMUNITY_DETAILS, query);
  }

  /** GET /v3/community/tweets - get a Community's tweet timeline. */
  getCommunityTweets(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.COMMUNITY_TWEETS, query);
  }

  /** GET /v3/community/members - get a Community's members. */
  getCommunityMembers(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.COMMUNITY_MEMBERS, query);
  }

  /** GET /v3/community/search - search Communities. */
  searchCommunities(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.COMMUNITY_SEARCH, query);
  }

  // ---------------------------------------------------------------------
  // Lists
  // ---------------------------------------------------------------------

  /** GET /v3/list/tweets - get a List's tweet timeline. */
  getListTweets(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.LIST_TWEETS, query);
  }

  /** GET /v3/list/members - get a List's members. */
  getListMembers(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.LIST_MEMBERS, query);
  }

  /** GET /v3/list/details - get details about a List. */
  getListDetails(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.LIST_DETAILS, query);
  }

  /** GET /v3/list/followers - get a List's followers. */
  getListFollowers(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.LIST_FOLLOWERS, query);
  }

  // ---------------------------------------------------------------------
  // Spaces
  // ---------------------------------------------------------------------

  /** GET /v3/space/by-id - get details about a Space. */
  getSpaceById(query: XQuery): Promise<XApiResponse> {
    return this.proxy(X_ENDPOINTS.SPACE_BY_ID, query);
  }

  // ---------------------------------------------------------------------
  // Derived features (not 1:1 upstream endpoints - see README)
  // ---------------------------------------------------------------------

  /**
   * Fetches a user's followers (`/v3/user/followers`, paginating via
   * `pagination.nextCursor` up to `SMART_FOLLOWERS_MAX_PAGES` pages) and
   * ranks them by `smartFollowerScore` (reach + a verification bonus),
   * returning the top `limit` (default 25). The ranking is also persisted
   * so it can be tracked over time.
   */
  async getSmartFollowers(query: XQuery): Promise<XApiResponse> {
    const username =
      query.username !== undefined ? String(query.username) : undefined;
    const limit = query.limit !== undefined ? Number(query.limit) : 25;
    const userId = await this.resolveUserId(query);

    let cursor = query.cursor !== undefined ? String(query.cursor) : undefined;
    const followers: ExtractedUser[] = [];

    for (let page = 0; page < SMART_FOLLOWERS_MAX_PAGES; page++) {
      const response = await this.proxy(X_ENDPOINTS.USER_FOLLOWERS, {
        userId,
        cursor,
      });
      const pageFollowers = extractUsers(response);
      if (pageFollowers.length === 0) break;
      followers.push(...pageFollowers);

      const nextCursor: string | undefined = response.pagination?.nextCursor;
      if (!nextCursor) break;
      cursor = nextCursor;
    }

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
   * Returns a user's tweets flagged as paid partnership / branded content
   * (see `isPaidPartnershipTweet`) over the last `period` (default
   * `PAID_PARTNERSHIP_DEFAULT_PERIOD`, e.g. `7d`, `30d`, `3m`, `6m`, `1y`,
   * `2y`).
   *
   * However long `period` is, only the most recent
   * `PAID_PARTNERSHIP_REFRESH_DAYS` are re-fetched from `/v3/user/tweets`
   * (paginating back via `pagination.nextCursor`, up to
   * `PAID_PARTNERSHIP_MAX_PAGES` pages - tweets are returned newest-first).
   * Every fetched tweet is persisted, with its `createdAt` and
   * paid-partnership flag stored alongside it. The remainder of `period`, if
   * any, is served from previously-stored tweets instead of hitting the
   * upstream API again.
   */
  async getPaidPartnershipTweets(query: XQuery): Promise<XApiResponse> {
    const username =
      query.username !== undefined ? String(query.username) : undefined;
    const period =
      query.period !== undefined
        ? String(query.period)
        : PAID_PARTNERSHIP_DEFAULT_PERIOD;
    const periodDays = parsePeriodDays(period);
    const userId = await this.resolveUserId(query);

    const now = Date.now();
    const periodCutoff = now - periodDays * MS_PER_DAY;
    const refreshCutoff = now - PAID_PARTNERSHIP_REFRESH_DAYS * MS_PER_DAY;

    let cursor = query.cursor !== undefined ? String(query.cursor) : undefined;
    const freshTweets: ExtractedTweet[] = [];

    for (let page = 0; page < PAID_PARTNERSHIP_MAX_PAGES; page++) {
      const response = await this.proxy(X_ENDPOINTS.USER_TWEETS, {
        userId,
        cursor,
      });
      await this.storage.saveTweets(response);

      const pageTweets = extractTweets(response);
      if (pageTweets.length === 0) break;

      let reachedRefreshCutoff = false;
      for (const tweet of pageTweets) {
        const createdAt = tweet.createdAt ? Date.parse(tweet.createdAt) : NaN;
        if (!Number.isNaN(createdAt) && createdAt < refreshCutoff) {
          reachedRefreshCutoff = true;
          break;
        }
        freshTweets.push(tweet);
      }
      if (reachedRefreshCutoff) break;

      const nextCursor: string | undefined = response.pagination?.nextCursor;
      if (!nextCursor) break;
      cursor = nextCursor;
    }

    const tweets = freshTweets
      .filter((tweet) => {
        const createdAt = tweet.createdAt ? Date.parse(tweet.createdAt) : NaN;
        return !Number.isNaN(createdAt) && createdAt >= periodCutoff;
      })
      .filter(isPaidPartnershipTweet)
      .map((tweet) => ({
        id: tweet.id,
        authorId: tweet.authorId,
        authorUsername: tweet.authorUsername,
        text: tweet.text,
        createdAt: tweet.createdAt,
      }));

    if (periodDays > PAID_PARTNERSHIP_REFRESH_DAYS && userId) {
      const stored = await this.storage.getStoredPaidPartnershipTweets(
        userId,
        new Date(periodCutoff),
        new Date(refreshCutoff),
      );
      tweets.push(
        ...stored.map((tweet) => ({
          id: tweet.id,
          authorId: tweet.authorId,
          authorUsername: tweet.authorUsername,
          text: tweet.text,
          createdAt: tweet.tweetCreatedAt?.toISOString() ?? null,
        })),
      );
    }

    tweets.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

    return {
      username,
      period,
      count: tweets.length,
      tweets,
    };
  }

  /**
   * Fetches a user's profile (`/v3/user/by-username`) and returns derived
   * stats: an "influence score" (see `computeInfluenceScore`) and follower
   * growth since the last time this user was fetched.
   */
  async getUserStats(query: XQuery): Promise<XApiResponse> {
    const response = await this.proxy(X_ENDPOINTS.USER_BY_USERNAME, query);
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

  /**
   * Resolves the numeric `userId` needed by `/v3/user/followers` and
   * `/v3/user/tweets`: returns `query.userId` as-is if given, otherwise
   * looks it up via `/v3/user/by-username` from `query.username`.
   */
  private async resolveUserId(query: XQuery): Promise<string | undefined> {
    if (query.userId !== undefined) {
      return String(query.userId);
    }
    if (query.username === undefined) {
      return undefined;
    }
    const profile = await this.proxy(X_ENDPOINTS.USER_BY_USERNAME, {
      username: query.username,
    });
    return extractUsers(profile)[0]?.id ?? undefined;
  }

  private async proxy(endpoint: string, query: XQuery): Promise<XApiResponse> {
    const params = this.cleanParams(query);
    this.logger.debug(`GET ${endpoint} ${JSON.stringify(params)}`);
    const response = await firstValueFrom(
      this.httpService.get<XApiResponse>(endpoint, { params }),
    );
    return response.data;
  }

  /** Strips undefined/empty values so they aren't forwarded as query params. */
  private cleanParams(query: XQuery): XQuery {
    return Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== undefined && value !== '',
      ),
    );
  }
}
