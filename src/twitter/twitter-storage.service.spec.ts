import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SmartFollowerEntity } from './entities/smart-follower.entity';
import { TweetEntity } from './entities/tweet.entity';
import { UserSnapshotEntity } from './entities/user-snapshot.entity';
import { TwitterStorageService } from './twitter-storage.service';
import { toExtractedUser } from './utils/twitter-data.util';

const createRepoMock = () => ({
  create: jest.fn((entity) => entity),
  save: jest.fn().mockResolvedValue(undefined),
  findOne: jest.fn().mockResolvedValue(null),
});

describe('TwitterStorageService', () => {
  let service: TwitterStorageService;
  let userSnapshotRepo: ReturnType<typeof createRepoMock>;
  let tweetRepo: ReturnType<typeof createRepoMock>;
  let smartFollowerRepo: ReturnType<typeof createRepoMock>;

  beforeEach(async () => {
    userSnapshotRepo = createRepoMock();
    tweetRepo = createRepoMock();
    smartFollowerRepo = createRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwitterStorageService,
        {
          provide: getRepositoryToken(UserSnapshotEntity),
          useValue: userSnapshotRepo,
        },
        { provide: getRepositoryToken(TweetEntity), useValue: tweetRepo },
        {
          provide: getRepositoryToken(SmartFollowerEntity),
          useValue: smartFollowerRepo,
        },
      ],
    }).compile();

    service = module.get<TwitterStorageService>(TwitterStorageService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('saveUserSnapshots', () => {
    it('extracts and persists every user-like object', async () => {
      const response = {
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

      const users = await service.saveUserSnapshots(response);

      expect(users).toHaveLength(1);
      expect(userSnapshotRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({
          userId: '44196397',
          username: 'elonmusk',
          followersCount: 200000000,
          followingCount: 500,
          tweetsCount: 50000,
          verified: true,
        }),
      ]);
    });

    it('does nothing when the response has no user-like objects', async () => {
      await service.saveUserSnapshots({ data: {} });

      expect(userSnapshotRepo.save).not.toHaveBeenCalled();
    });

    it('does not throw if the repository fails', async () => {
      userSnapshotRepo.save.mockRejectedValue(new Error('db down'));

      await expect(
        service.saveUserSnapshots({
          data: { user: { screen_name: 'a', followers_count: 1 } },
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('getLatestSnapshot', () => {
    it('queries by username ordered by most recent', async () => {
      const snapshot = { username: 'elonmusk', followersCount: 1 };
      userSnapshotRepo.findOne.mockResolvedValue(snapshot);

      const result = await service.getLatestSnapshot('elonmusk');

      expect(userSnapshotRepo.findOne).toHaveBeenCalledWith({
        where: { username: 'elonmusk' },
        order: { fetchedAt: 'DESC' },
      });
      expect(result).toBe(snapshot);
    });

    it('returns null if the repository fails', async () => {
      userSnapshotRepo.findOne.mockRejectedValue(new Error('db down'));

      await expect(service.getLatestSnapshot('elonmusk')).resolves.toBeNull();
    });
  });

  describe('saveTweets', () => {
    it('extracts and upserts tweets, flagging paid partnerships', async () => {
      const response = {
        data: {
          tweets: [
            { id_str: '1', full_text: 'normal tweet' },
            {
              id_str: '2',
              full_text: 'Paid partnership with Acme',
              user: { screen_name: 'elonmusk' },
            },
          ],
        },
      };

      await service.saveTweets(response);

      expect(tweetRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({ id: '1', isPaidPartnership: false }),
        expect.objectContaining({
          id: '2',
          authorUsername: 'elonmusk',
          isPaidPartnership: true,
        }),
      ]);
    });

    it('does nothing when there are no tweets', async () => {
      await service.saveTweets({ data: {} });

      expect(tweetRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('saveSmartFollowers', () => {
    it('upserts the ranked followers for the target account', async () => {
      const follower = {
        ...toExtractedUser({
          screen_name: 'celeb',
          followers_count: 5000,
          verified: true,
        }),
        score: 105000,
      };

      await service.saveSmartFollowers('elonmusk', [follower]);

      expect(smartFollowerRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({
          targetUsername: 'elonmusk',
          followerUsername: 'celeb',
          followersCount: 5000,
          verified: true,
          score: 105000,
        }),
      ]);
    });

    it('does nothing for an empty list', async () => {
      await service.saveSmartFollowers('elonmusk', []);

      expect(smartFollowerRepo.save).not.toHaveBeenCalled();
    });
  });
});
