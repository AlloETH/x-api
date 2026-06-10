import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { TwitterService } from './twitter.service';
import { TWITTER_ENDPOINTS } from './constants/twitter-endpoints.constant';
import { TwitterSearchType } from './dto/search-query.dto';

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

  it('getUserByUsername calls the screenname endpoint', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ id: '1' })));

    const result = await service.getUserByUsername('elonmusk');

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.USER_BY_USERNAME,
      {
        params: { screenname: 'elonmusk' },
      },
    );
    expect(result).toEqual({ id: '1' });
  });

  it('getUserTweets forwards an optional cursor', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ tweets: [] })));

    await service.getUserTweets('elonmusk', 'cursor123');

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.USER_TWEETS,
      {
        params: { screenname: 'elonmusk', cursor: 'cursor123' },
      },
    );
  });

  it('getUserTweets omits the cursor when not provided', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ tweets: [] })));

    await service.getUserTweets('elonmusk');

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.USER_TWEETS,
      {
        params: { screenname: 'elonmusk' },
      },
    );
  });

  it('getTweetDetail calls the tweet endpoint with the tweet id', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ id: '999' })));

    await service.getTweetDetail('999');

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.TWEET_DETAIL,
      {
        params: { id: '999' },
      },
    );
  });

  it('checkRetweet sends both the tweet id and user id', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ retweeted: true })));

    await service.checkRetweet('999', '123');

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.CHECK_RETWEET,
      {
        params: { id: '999', user: '123' },
      },
    );
  });

  it('search defaults to the Top search type', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ results: [] })));

    await service.search('nestjs');

    expect(httpService.get).toHaveBeenCalledWith(TWITTER_ENDPOINTS.SEARCH, {
      params: { query: 'nestjs', search_type: TwitterSearchType.TOP },
    });
  });

  it('search forwards a custom search type and cursor', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ results: [] })));

    await service.search('nestjs', TwitterSearchType.LATEST, 'cursor123');

    expect(httpService.get).toHaveBeenCalledWith(TWITTER_ENDPOINTS.SEARCH, {
      params: {
        query: 'nestjs',
        search_type: TwitterSearchType.LATEST,
        cursor: 'cursor123',
      },
    });
  });

  it('getTrends omits woeid when not provided', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ trends: [] })));

    await service.getTrends();

    expect(httpService.get).toHaveBeenCalledWith(TWITTER_ENDPOINTS.TRENDS, {
      params: {},
    });
  });

  it('getCommunityTimeline calls the community timeline endpoint', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ tweets: [] })));

    await service.getCommunityTimeline('123', 'cursor123');

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.COMMUNITY_TIMELINE,
      {
        params: { id: '123', cursor: 'cursor123' },
      },
    );
  });

  it('getListTimeline calls the list timeline endpoint', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ tweets: [] })));

    await service.getListTimeline('456');

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.LIST_TIMELINE,
      {
        params: { list_id: '456' },
      },
    );
  });

  it('getSpaceDetails calls the space endpoint', async () => {
    httpService.get.mockReturnValue(of(mockAxiosResponse({ id: 'abc' })));

    await service.getSpaceDetails('abc');

    expect(httpService.get).toHaveBeenCalledWith(
      TWITTER_ENDPOINTS.SPACE_DETAILS,
      {
        params: { id: 'abc' },
      },
    );
  });
});
