import { Test, TestingModule } from '@nestjs/testing';
import { TwitterController } from './twitter.controller';
import { TwitterService } from './twitter.service';
import { TwitterSearchType } from './dto/search-query.dto';

describe('TwitterController', () => {
  let controller: TwitterController;
  let service: jest.Mocked<TwitterService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<TwitterService>> = {
      getUserByUsername: jest.fn(),
      getUserTweets: jest.fn(),
      getTweetDetail: jest.fn(),
      search: jest.fn(),
      getTrends: jest.fn(),
      checkRetweet: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwitterController],
      providers: [{ provide: TwitterService, useValue: serviceMock }],
    }).compile();

    controller = module.get<TwitterController>(TwitterController);
    service = module.get(TwitterService);
  });

  it('delegates getUserByUsername to the service', async () => {
    service.getUserByUsername.mockResolvedValue({ id: '1' });

    const result = await controller.getUserByUsername('elonmusk');

    expect(service.getUserByUsername).toHaveBeenCalledWith('elonmusk');
    expect(result).toEqual({ id: '1' });
  });

  it('delegates getUserTweets with the cursor query param', async () => {
    service.getUserTweets.mockResolvedValue({ tweets: [] });

    await controller.getUserTweets('elonmusk', { cursor: 'abc' });

    expect(service.getUserTweets).toHaveBeenCalledWith('elonmusk', 'abc');
  });

  it('delegates getTweetDetail to the service', async () => {
    service.getTweetDetail.mockResolvedValue({ id: '999' });

    await controller.getTweetDetail('999', {});

    expect(service.getTweetDetail).toHaveBeenCalledWith('999', undefined);
  });

  it('delegates search with a default search type of Top', async () => {
    service.search.mockResolvedValue({ results: [] });

    await controller.search({ query: 'nestjs' });

    expect(service.search).toHaveBeenCalledWith(
      'nestjs',
      TwitterSearchType.TOP,
      undefined,
    );
  });

  it('delegates checkRetweet with the tweet id and user id', async () => {
    service.checkRetweet.mockResolvedValue({ retweeted: false });

    await controller.checkRetweet('999', { userId: '123' });

    expect(service.checkRetweet).toHaveBeenCalledWith('999', '123');
  });

  it('delegates getTrends with the woeid query param', async () => {
    service.getTrends.mockResolvedValue({ trends: [] });

    await controller.getTrends({ woeid: '1' });

    expect(service.getTrends).toHaveBeenCalledWith('1');
  });
});
