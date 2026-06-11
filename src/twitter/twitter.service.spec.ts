import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { TwitterService } from './twitter.service';
import { TwitterStorageService } from './twitter-storage.service';
import { TWITTER_ENDPOINTS } from './constants/twitter-endpoints.constant';

const mockAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

describe('TwitterService', () => {
  let service: TwitterService;
  let httpService: { get: jest.Mock };
  let storageService: jest.Mocked<TwitterStorageService>;

  beforeEach(async () => {
    httpService = { get: jest.fn() };
    storageService = {
      saveUserSnapshots: jest.fn().mockResolvedValue([]),
      saveTweets: jest.fn().mockResolvedValue([]),
      saveSmartFollowers: jest.fn().mockResolvedValue(undefined),
      getLatestSnapshot: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<TwitterStorageService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwitterService,
        { provide: HttpService, useValue: httpService },
        { provide: TwitterStorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get<TwitterService>(TwitterService);
  });

  afterEach(() => jest.clearAllMocks());

  it('getUserByUsername forwards the username param and persists the user snapshot', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ id: '1' })));

    const result = await service.getUserByUsername({ username: 'elonmusk' });

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.USER_BY_USERNAME,
      {
        params: { username: 'elonmusk' },
      },
    );
    expect(result).toEqual({ id: '1' });
    expect(storageService.saveUserSnapshots).toHaveBeenCalledWith({ id: '1' });
  });

  it('getUserById forwards the userId param', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ id: '44196397' })));

    await service.getUserById({ userId: '44196397' });

    expect(httpService.get).toHaveBeenCalledWith(TWITTER_ENDPOINTS.USER_BY_ID, {
      params: { userId: '44196397' },
    });
  });

  it('getUserTweets forwards an optional cursor and persists fetched tweets', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ tweets: [] })));

    await service.getUserTweets({ userId: '44196397', cursor: 'cursor123' });

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.USER_TWEETS,
      {
        params: { userId: '44196397', cursor: 'cursor123' },
      },
    );
    expect(storageService.saveTweets).toHaveBeenCalledWith({ tweets: [] });
  });

  it('strips undefined and empty values from query params', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ tweets: [] })));

    await service.getUserTweets({
      userId: '44196397',
      cursor: undefined,
      extra: '',
    });

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.USER_TWEETS,
      {
        params: { userId: '44196397' },
      },
    );
  });

  it('getTweetDetails calls the tweet details endpoint', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ id: '999' })));

    await service.getTweetDetails({ tweetId: '999' });

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.TWEET_DETAILS,
      {
        params: { tweetId: '999' },
      },
    );
  });

  it('search forwards the query and type params', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ results: [] })));

    await service.search({ query: 'nestjs', type: 'Top' });

    expect(httpService.get).toHaveBeenCalledWith(TWITTER_ENDPOINTS.SEARCH, {
      params: { query: 'nestjs', type: 'Top' },
    });
  });

  it('getCommunityTweets calls the community tweets endpoint', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ tweets: [] })));

    await service.getCommunityTweets({
      communityId: '123',
      cursor: 'cursor123',
    });

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.COMMUNITY_TWEETS,
      {
        params: { communityId: '123', cursor: 'cursor123' },
      },
    );
  });

  it('getListTweets calls the list tweets endpoint', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ tweets: [] })));

    await service.getListTweets({ listId: '456' });

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.LIST_TWEETS,
      {
        params: { listId: '456' },
      },
    );
  });

  it('getSpaceById calls the space endpoint', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ id: 'abc' })));

    await service.getSpaceById({ spaceId: 'abc' });

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.SPACE_BY_ID,
      {
        params: { spaceId: 'abc' },
      },
    );
  });

  describe('getSmartFollowers', () => {
    it('resolves the userId from username, ranks followers by reach/verification, limits results, and persists the ranking', async () => {
      const profileResponse = {
        data: {
          user: {
            id: '44196397',
            username: 'elonmusk',
            followerCount: 200000000,
            followingCount: 500,
            tweetCount: 50000,
            verified: true,
          },
        },
      };
      const followersResponse = {
        data: {
          followers: [
            { username: 'small_fan', followerCount: 100, verified: false },
            { username: 'celeb', followerCount: 5000, verified: true },
            { username: 'big_acct', followerCount: 200000, verified: false },
          ],
        },
      };
      httpService.get
        .mockReturnValueOnce(of(mockAxiosResponse(profileResponse)))
        .mockReturnValueOnce(of(mockAxiosResponse(followersResponse)));

      const result = await service.getSmartFollowers({
        username: 'elonmusk',
        limit: '2',
      });

      expect(httpService.get).toHaveBeenNthCalledWith(
        1,
        TWITTER_ENDPOINTS.USER_BY_USERNAME,
        { params: { username: 'elonmusk' } },
      );
      expect(httpService.get).toHaveBeenNthCalledWith(
        2,
        TWITTER_ENDPOINTS.USER_FOLLOWERS,
        { params: { userId: '44196397' } },
      );
      expect(result).toEqual({
        username: 'elonmusk',
        count: 2,
        smartFollowers: [
          expect.objectContaining({ username: 'big_acct', score: 200000 }),
          expect.objectContaining({ username: 'celeb', score: 105000 }),
        ],
      });
      expect(storageService.saveSmartFollowers).toHaveBeenCalledWith(
        'elonmusk',
        expect.any(Array),
      );
    });

    it('uses a given userId directly without resolving it from username', async () => {
      const followersResponse = {
        data: {
          followers: [
            { username: 'celeb', followerCount: 5000, verified: true },
          ],
        },
      };
      httpService.get.mockReturnValueOnce(
        of(mockAxiosResponse(followersResponse)),
      );

      await service.getSmartFollowers({ userId: '44196397' });

      expect(httpService.get).toHaveBeenCalledTimes(1);
      expect(httpService.get).toHaveBeenCalledWith(
        TWITTER_ENDPOINTS.USER_FOLLOWERS,
        { params: { userId: '44196397' } },
      );
    });
  });

  describe('getPaidPartnershipTweets', () => {
    it('resolves the userId from username, returns only tweets flagged as paid partnership, and persists all fetched tweets', async () => {
      const profileResponse = {
        data: {
          user: {
            id: '44196397',
            username: 'elonmusk',
            followerCount: 200000000,
            followingCount: 500,
            tweetCount: 50000,
            verified: true,
          },
        },
      };
      const tweetsResponse = {
        data: {
          tweets: [
            { id: '1', text: 'just a normal tweet', isPaidPromotion: false },
            {
              id: '2',
              text: 'Check out this product',
              isPaidPromotion: true,
              author: { id: '44196397', username: 'elonmusk' },
            },
          ],
        },
      };
      httpService.get
        .mockReturnValueOnce(of(mockAxiosResponse(profileResponse)))
        .mockReturnValueOnce(of(mockAxiosResponse(tweetsResponse)));

      const result = await service.getPaidPartnershipTweets({
        username: 'elonmusk',
      });

      expect(httpService.get).toHaveBeenNthCalledWith(
        1,
        TWITTER_ENDPOINTS.USER_BY_USERNAME,
        { params: { username: 'elonmusk' } },
      );
      expect(httpService.get).toHaveBeenNthCalledWith(
        2,
        TWITTER_ENDPOINTS.USER_TWEETS,
        { params: { userId: '44196397' } },
      );
      expect(storageService.saveTweets).toHaveBeenCalledWith(tweetsResponse);
      expect(result).toEqual({
        username: 'elonmusk',
        count: 1,
        tweets: [
          {
            id: '2',
            authorId: '44196397',
            authorUsername: 'elonmusk',
            text: 'Check out this product',
          },
        ],
      });
    });
  });

  describe('getUserStats', () => {
    const profileResponse = {
      data: {
        user: {
          screen_name: 'elonmusk',
          id_str: '44196397',
          followers_count: 200000000,
          friends_count: 500,
          statuses_count: 50000,
          verified: true,
        },
      },
    };

    it('returns the influence score and follower growth since the previous snapshot', async () => {
      httpService.get.mockReturnValue(of(mockAxiosResponse(profileResponse)));
      storageService.getLatestSnapshot.mockResolvedValue({
        followersCount: 199000000,
        fetchedAt: new Date('2024-01-01T00:00:00.000Z'),
      } as any);

      const result = await service.getUserStats({ username: 'elonmusk' });

      expect(storageService.getLatestSnapshot).toHaveBeenCalledWith('elonmusk');
      expect(storageService.saveUserSnapshots).toHaveBeenCalledWith(
        profileResponse,
      );
      expect(result).toMatchObject({
        username: 'elonmusk',
        id: '44196397',
        followersCount: 200000000,
        followerGrowth: 1000000,
      });
      expect(result.influenceScore).toBeGreaterThan(0);
    });

    it('returns followerGrowth: null when there is no previous snapshot', async () => {
      httpService.get.mockReturnValue(of(mockAxiosResponse(profileResponse)));
      storageService.getLatestSnapshot.mockResolvedValue(null);

      const result = await service.getUserStats({ username: 'elonmusk' });

      expect(result.followerGrowth).toBeNull();
      expect(result.previousFetchedAt).toBeNull();
    });
  });
});
