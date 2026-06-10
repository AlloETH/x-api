import { Test, TestingModule } from '@nestjs/testing';
import { TwitterController } from './twitter.controller';
import { TwitterService } from './twitter.service';

describe('TwitterController', () => {
  let controller: TwitterController;
  let service: jest.Mocked<TwitterService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<TwitterService>> = {
      getUserByUsername: jest.fn(),
      getUserById: jest.fn(),
      getUserTweets: jest.fn(),
      getTweetDetails: jest.fn(),
      search: jest.fn(),
      getSpaceById: jest.fn(),
      getSmartFollowers: jest.fn(),
      getPaidPartnershipTweets: jest.fn(),
      getUserStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwitterController],
      providers: [{ provide: TwitterService, useValue: serviceMock }],
    }).compile();

    controller = module.get<TwitterController>(TwitterController);
    service = module.get(TwitterService);
  });

  it('delegates getUserByUsername to the service with the raw query', async () => {
    service.getUserByUsername.mockResolvedValue({ id: '1' });

    const result = await controller.getUserByUsername({ username: 'elonmusk' });

    expect(service.getUserByUsername).toHaveBeenCalledWith({
      username: 'elonmusk',
    });
    expect(result).toEqual({ id: '1' });
  });

  it('delegates getUserById to the service with the raw query', async () => {
    service.getUserById.mockResolvedValue({ id: '44196397' });

    await controller.getUserById({ id: '44196397' });

    expect(service.getUserById).toHaveBeenCalledWith({ id: '44196397' });
  });

  it('delegates getUserTweets to the service with the raw query', async () => {
    service.getUserTweets.mockResolvedValue({ tweets: [] });

    await controller.getUserTweets({ username: 'elonmusk', cursor: 'abc' });

    expect(service.getUserTweets).toHaveBeenCalledWith({
      username: 'elonmusk',
      cursor: 'abc',
    });
  });

  it('delegates getTweetDetails to the service with the raw query', async () => {
    service.getTweetDetails.mockResolvedValue({ id: '999' });

    await controller.getTweetDetails({ id: '999' });

    expect(service.getTweetDetails).toHaveBeenCalledWith({ id: '999' });
  });

  it('delegates search to the service with the raw query', async () => {
    service.search.mockResolvedValue({ results: [] });

    await controller.search({ query: 'nestjs' });

    expect(service.search).toHaveBeenCalledWith({ query: 'nestjs' });
  });

  it('delegates getSpaceById to the service with the raw query', async () => {
    service.getSpaceById.mockResolvedValue({ id: 'abc' });

    await controller.getSpaceById({ id: 'abc' });

    expect(service.getSpaceById).toHaveBeenCalledWith({ id: 'abc' });
  });

  it('delegates getSmartFollowers to the service with the raw query', async () => {
    service.getSmartFollowers.mockResolvedValue({ smartFollowers: [] });

    await controller.getSmartFollowers({ username: 'elonmusk', limit: '10' });

    expect(service.getSmartFollowers).toHaveBeenCalledWith({
      username: 'elonmusk',
      limit: '10',
    });
  });

  it('delegates getPaidPartnershipTweets to the service with the raw query', async () => {
    service.getPaidPartnershipTweets.mockResolvedValue({ tweets: [] });

    await controller.getPaidPartnershipTweets({ username: 'elonmusk' });

    expect(service.getPaidPartnershipTweets).toHaveBeenCalledWith({
      username: 'elonmusk',
    });
  });

  it('delegates getUserStats to the service with the raw query', async () => {
    service.getUserStats.mockResolvedValue({ influenceScore: 100 });

    await controller.getUserStats({ username: 'elonmusk' });

    expect(service.getUserStats).toHaveBeenCalledWith({
      username: 'elonmusk',
    });
  });
});
