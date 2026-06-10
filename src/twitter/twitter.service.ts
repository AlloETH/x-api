import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { TWITTER_ENDPOINTS } from './constants/twitter-endpoints.constant';
import { TwitterApiResponse } from './interfaces/twitter-api-response.interface';
import { TwitterSearchType } from './dto/search-query.dto';

type QueryParams = Record<string, string | number | boolean | undefined>;

@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name);

  constructor(private readonly httpService: HttpService) {}

  // ---------------------------------------------------------------------
  // User endpoints
  // ---------------------------------------------------------------------

  /** Get a user's profile by their @username (screen name). */
  getUserByUsername(username: string): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.USER_BY_USERNAME, {
      screenname: username,
    });
  }

  /** Get a user's tweet timeline. */
  getUserTweets(
    username: string,
    cursor?: string,
  ): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.USER_TWEETS, {
      screenname: username,
      cursor,
    });
  }

  /** Get a user's timeline including replies. */
  getUserTweetsAndReplies(
    username: string,
    cursor?: string,
  ): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.USER_TWEETS_AND_REPLIES, {
      screenname: username,
      cursor,
    });
  }

  /** Get the photos/videos a user has posted. */
  getUserMedia(username: string, cursor?: string): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.USER_MEDIA, {
      screenname: username,
      cursor,
    });
  }

  /** Get the tweets a user has liked. */
  getUserLikes(username: string, cursor?: string): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.USER_LIKES, {
      screenname: username,
      cursor,
    });
  }

  /** Get a user's followers. */
  getUserFollowers(
    username: string,
    cursor?: string,
  ): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.USER_FOLLOWERS, {
      screenname: username,
      cursor,
    });
  }

  /** Get the accounts a user follows. */
  getUserFollowing(
    username: string,
    cursor?: string,
  ): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.USER_FOLLOWING, {
      screenname: username,
      cursor,
    });
  }

  /** Get a user's highlighted tweets. */
  getUserHighlights(
    username: string,
    cursor?: string,
  ): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.USER_HIGHLIGHTS, {
      screenname: username,
      cursor,
    });
  }

  /** Get a user's verified affiliate accounts. */
  getUserAffiliates(username: string): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.USER_AFFILIATES, {
      screenname: username,
    });
  }

  // ---------------------------------------------------------------------
  // Tweet endpoints
  // ---------------------------------------------------------------------

  /** Get a single tweet by ID, including its conversation thread. */
  getTweetDetail(
    tweetId: string,
    cursor?: string,
  ): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.TWEET_DETAIL, { id: tweetId, cursor });
  }

  /** Get the reply thread for a tweet. */
  getTweetReplies(
    tweetId: string,
    cursor?: string,
  ): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.TWEET_THREAD, { id: tweetId, cursor });
  }

  /** Get the users who retweeted a tweet. */
  getTweetRetweets(
    tweetId: string,
    cursor?: string,
  ): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.TWEET_RETWEETS, { id: tweetId, cursor });
  }

  /** Check whether a given user has retweeted a given tweet. */
  checkRetweet(tweetId: string, userId: string): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.CHECK_RETWEET, {
      id: tweetId,
      user: userId,
    });
  }

  // ---------------------------------------------------------------------
  // Search & trends
  // ---------------------------------------------------------------------

  /** Search tweets, users, photos or videos. */
  search(
    query: string,
    searchType: TwitterSearchType = TwitterSearchType.TOP,
    cursor?: string,
  ): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.SEARCH, {
      query,
      search_type: searchType,
      cursor,
    });
  }

  /** Get trending topics for a location (defaults to worldwide). */
  getTrends(woeid?: string): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.TRENDS, { woeid });
  }

  // ---------------------------------------------------------------------
  // Communities
  // ---------------------------------------------------------------------

  /** Get metadata about a Twitter Community. */
  getCommunityDetails(communityId: string): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.COMMUNITY_DETAILS, { id: communityId });
  }

  /** Get the tweet timeline of a Twitter Community. */
  getCommunityTimeline(
    communityId: string,
    cursor?: string,
  ): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.COMMUNITY_TIMELINE, {
      id: communityId,
      cursor,
    });
  }

  // ---------------------------------------------------------------------
  // Lists
  // ---------------------------------------------------------------------

  /** Get the tweet timeline of a Twitter List. */
  getListTimeline(
    listId: string,
    cursor?: string,
  ): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.LIST_TIMELINE, {
      list_id: listId,
      cursor,
    });
  }

  // ---------------------------------------------------------------------
  // Spaces
  // ---------------------------------------------------------------------

  /** Get details about a Twitter Space. */
  getSpaceDetails(spaceId: string): Promise<TwitterApiResponse> {
    return this.get(TWITTER_ENDPOINTS.SPACE_DETAILS, { id: spaceId });
  }

  // ---------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------

  private async get(
    endpoint: string,
    params: QueryParams = {},
  ): Promise<TwitterApiResponse> {
    const config: AxiosRequestConfig = { params: this.cleanParams(params) };
    this.logger.debug(`GET ${endpoint} ${JSON.stringify(config.params)}`);
    const response = await firstValueFrom(
      this.httpService.get<TwitterApiResponse>(endpoint, config),
    );
    return response.data;
  }

  /** Strips undefined/empty values so they aren't forwarded as query params. */
  private cleanParams(params: QueryParams): QueryParams {
    return Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== '',
      ),
    );
  }
}
