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

  it('getUserById forwards the id param', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ id: '44196397' })));

    await service.getUserById({ id: '44196397' });

    expect(httpService.get).toHaveBeenCalledWith(TWITTER_ENDPOINTS.USER_BY_ID, {
      params: { id: '44196397' },
    });
  });

  it('getUserTweets forwards an optional cursor and persists fetched tweets', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ tweets: [] })));

    await service.getUserTweets({ username: 'elonmusk', cursor: 'cursor123' });

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.USER_TWEETS,
      {
        params: { username: 'elonmusk', cursor: 'cursor123' },
      },
    );
    expect(storageService.saveTweets).toHaveBeenCalledWith({ tweets: [] });
  });

  it('strips undefined and empty values from query params', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ tweets: [] })));

    await service.getUserTweets({
      username: 'elonmusk',
      cursor: undefined,
      extra: '',
    });

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.USER_TWEETS,
      {
        params: { username: 'elonmusk' },
      },
    );
  });

  it('getTweetDetails calls the tweet details endpoint', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ id: '999' })));

    await service.getTweetDetails({ id: '999' });

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.TWEET_DETAILS,
      {
        params: { id: '999' },
      },
    );
  });

  it('search forwards the query param', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ results: [] })));

    await service.search({ query: 'nestjs' });

    expect(httpService.get).toHaveBeenCalledWith(TWITTER_ENDPOINTS.SEARCH, {
      params: { query: 'nestjs' },
    });
  });

  it('getCommunityTweets calls the community tweets endpoint', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ tweets: [] })));

    await service.getCommunityTweets({ id: '123', cursor: 'cursor123' });

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.COMMUNITY_TWEETS,
      {
        params: { id: '123', cursor: 'cursor123' },
      },
    );
  });

  it('getListTweets calls the list tweets endpoint', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ tweets: [] })));

    await service.getListTweets({ id: '456' });

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.LIST_TWEETS,
      {
        params: { id: '456' },
      },
    );
  });

  it('getSpaceById calls the space endpoint', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ id: 'abc' })));

    await service.getSpaceById({ id: 'abc' });

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.SPACE_BY_ID,
      {
        params: { id: 'abc' },
      },
    );
  });

  describe('getSmartFollowers', () => {
    it('ranks followers by reach/verification, limits results, and persists the ranking', async () => {
      const followersResponse = {
        data: {
          followers: [
            { screen_name: 'small_fan', followers_count: 100, verified: false },
            { screen_name: 'celeb', followers_count: 5000, verified: true },
            {
              screen_name: 'big_acct',
              followers_count: 200000,
              verified: false,
            },
          ],
        },
      };
      httpService.get.mockReturnValue(of(mockAxiosResponse(followersResponse)));

      const result = await service.getSmartFollowers({
        username: 'elonmusk',
        limit: '2',
      });

      expect(httpService.get).toHaveBeenCalledWith(
        TWITTER_ENDPOINTS.USER_FOLLOWERS,
        { params: { username: 'elonmusk' } },
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
  });

  describe('getPaidPartnershipTweets', () => {
    it('returns only tweets flagged as paid partnership and persists all fetched tweets', async () => {
      const tweetsResponse = {
        data: {
          tweets: [
            { id_str: '1', full_text: 'just a normal tweet' },
            {
              id_str: '2',
              full_text: 'Paid partnership with Acme',
              user: { screen_name: 'elonmusk' },
            },
          ],
        },
      };
      httpService.get.mockReturnValue(of(mockAxiosResponse(tweetsResponse)));

      const result = await service.getPaidPartnershipTweets({
        username: 'elonmusk',
      });

      expect(storageService.saveTweets).toHaveBeenCalledWith(tweetsResponse);
      expect(result).toEqual({
        username: 'elonmusk',
        count: 1,
        tweets: [
          {
            id: '2',
            authorId: null,
            authorUsername: 'elonmusk',
            text: 'Paid partnership with Acme',
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
