import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmartFollowerEntity } from './entities/smart-follower.entity';
import { TweetEntity } from './entities/tweet.entity';
import { UserSnapshotEntity } from './entities/user-snapshot.entity';
import {
  ExtractedTweet,
  ExtractedUser,
  extractTweets,
  extractUsers,
  isPaidPartnershipTweet,
} from './utils/twitter-data.util';

export interface ScoredFollower extends ExtractedUser {
  score: number;
}

/**
 * Persists a copy of upstream API responses (user profiles and tweets) so
 * they can be analyzed/queried later (e.g. follower growth over time).
 * Persistence is best-effort: failures are logged but never bubble up, so a
 * database hiccup doesn't break the proxied API response.
 */
@Injectable()
export class TwitterStorageService {
  private readonly logger = new Logger(TwitterStorageService.name);

  constructor(
    @InjectRepository(UserSnapshotEntity)
    private readonly userSnapshots: Repository<UserSnapshotEntity>,
    @InjectRepository(TweetEntity)
    private readonly tweetRepo: Repository<TweetEntity>,
    @InjectRepository(SmartFollowerEntity)
    private readonly smartFollowerRepo: Repository<SmartFollowerEntity>,
  ) {}

  /** Extracts and stores every user-like object found in `response`. */
  async saveUserSnapshots(response: unknown): Promise<ExtractedUser[]> {
    const users = extractUsers(response);
    if (users.length === 0) return users;

    try {
      await this.userSnapshots.save(
        users.map((user) =>
          this.userSnapshots.create({
            userId: user.id,
            username: user.username,
            followersCount: user.followersCount,
            followingCount: user.followingCount,
            tweetsCount: user.tweetsCount,
            verified: user.verified,
            raw: user.raw,
          }),
        ),
      );
    } catch (error) {
      this.logger.warn(`Failed to save user snapshots: ${error}`);
    }

    return users;
  }

  /** Returns the most recent stored snapshot for `username`, if any. */
  async getLatestSnapshot(
    username: string,
  ): Promise<UserSnapshotEntity | null> {
    try {
      return await this.userSnapshots.findOne({
        where: { username },
        order: { fetchedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to load latest snapshot for ${username}: ${error}`,
      );
      return null;
    }
  }

  /**
   * Extracts and upserts every tweet-like object found in `response`,
   * flagging each one as a paid partnership/branded content tweet or not.
   */
  async saveTweets(response: unknown): Promise<ExtractedTweet[]> {
    const tweets = extractTweets(response);
    if (tweets.length === 0) return tweets;

    try {
      await this.tweetRepo.save(
        tweets.map((tweet) =>
          this.tweetRepo.create({
            id: tweet.id,
            authorId: tweet.authorId,
            authorUsername: tweet.authorUsername,
            text: tweet.text,
            isPaidPartnership: isPaidPartnershipTweet(tweet),
            raw: tweet.raw,
          }),
        ),
      );
    } catch (error) {
      this.logger.warn(`Failed to save tweets: ${error}`);
    }

    return tweets;
  }

  /** Upserts the ranked "smart followers" computed for `targetUsername`. */
  async saveSmartFollowers(
    targetUsername: string,
    followers: ScoredFollower[],
  ): Promise<void> {
    if (followers.length === 0) return;

    try {
      await this.smartFollowerRepo.save(
        followers.map((follower) =>
          this.smartFollowerRepo.create({
            targetUsername,
            followerUsername: follower.username,
            followerId: follower.id,
            followersCount: follower.followersCount,
            verified: follower.verified,
            score: follower.score,
            raw: follower.raw,
          }),
        ),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to save smart followers for ${targetUsername}: ${error}`,
      );
    }
  }
}
