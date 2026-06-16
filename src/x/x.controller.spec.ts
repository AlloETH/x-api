import { Test, TestingModule } from '@nestjs/testing';
import { XController } from './x.controller';
import { XService } from './x.service';

describe('XController', () => {
  let controller: XController;
  let service: jest.Mocked<XService>;

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<XService>> = {
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
      controllers: [XController],
      providers: [{ provide: XService, useValue: serviceMock }],
    }).compile();

    controller = module.get<XController>(XController);
    service = module.get(XService);
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

    await controller.getUserById({ userId: '44196397' });

    expect(service.getUserById).toHaveBeenCalledWith({ userId: '44196397' });
  });

  it('delegates getUserTweets to the service with the raw query', async () => {
    service.getUserTweets.mockResolvedValue({ tweets: [] });

    await controller.getUserTweets({ userId: '44196397', cursor: 'abc' });

    expect(service.getUserTweets).toHaveBeenCalledWith({
      userId: '44196397',
      cursor: 'abc',
    });
  });

  it('delegates getTweetDetails to the service with the raw query', async () => {
    service.getTweetDetails.mockResolvedValue({ id: '999' });

    await controller.getTweetDetails({ tweetId: '999' });

    expect(service.getTweetDetails).toHaveBeenCalledWith({ tweetId: '999' });
  });

  it('delegates search to the service with the raw query', async () => {
    service.search.mockResolvedValue({ results: [] });

    await controller.search({ query: 'nestjs', type: 'Top' });

    expect(service.search).toHaveBeenCalledWith({
      query: 'nestjs',
      type: 'Top',
    });
  });

  it('delegates getSpaceById to the service with the raw query', async () => {
    service.getSpaceById.mockResolvedValue({ id: 'abc' });

    await controller.getSpaceById({ spaceId: 'abc' });

    expect(service.getSpaceById).toHaveBeenCalledWith({ spaceId: 'abc' });
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
