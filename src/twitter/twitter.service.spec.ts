import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { TwitterService } from './twitter.service';
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

  beforeEach(async () => {
    httpService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwitterService,
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    service = module.get<TwitterService>(TwitterService);
  });

  afterEach(() => jest.clearAllMocks());

  it('getUserByUsername forwards the username param', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ id: '1' })));

    const result = await service.getUserByUsername({ username: 'elonmusk' });

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.USER_BY_USERNAME,
      {
        params: { username: 'elonmusk' },
      },
    );
    expect(result).toEqual({ id: '1' });
  });

  it('getUserById forwards the id param', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ id: '44196397' })));

    await service.getUserById({ id: '44196397' });

    expect(httpService.get).toHaveBeenCalledWith(TWITTER_ENDPOINTS.USER_BY_ID, {
      params: { id: '44196397' },
    });
  });

  it('getUserTweets forwards an optional cursor', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ tweets: [] })));

    await service.getUserTweets({ username: 'elonmusk', cursor: 'cursor123' });

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.USER_TWEETS,
      {
        params: { username: 'elonmusk', cursor: 'cursor123' },
      },
    );
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
});
