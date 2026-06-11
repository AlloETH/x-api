import {
  computeInfluenceScore,
  extractTweets,
  extractUsers,
  isPaidPartnershipTweet,
  smartFollowerScore,
  toExtractedUser,
} from './twitter-data.util';

describe('twitter-data.util', () => {
  describe('extractUsers', () => {
    it('finds user-like objects nested anywhere in the response', () => {
      const response = {
        data: {
          user: {
            result: {
              timeline: {
                instructions: [
                  {
                    entries: [
                      {
                        content: {
                          itemContent: {
                            user_results: {
                              result: {
                                rest_id: '123',
                                legacy: {
                                  id_str: '123',
                                  screen_name: 'someone',
                                  followers_count: 42,
                                  friends_count: 10,
                                  statuses_count: 5,
                                  verified: true,
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      };

      const users = extractUsers(response);

      expect(users).toHaveLength(1);
      expect(users[0]).toMatchObject({
        id: '123',
        username: 'someone',
        followersCount: 42,
        followingCount: 10,
        tweetsCount: 5,
        verified: true,
      });
    });

    it('extracts a flat user object using the confirmed Twitter API47 field names', () => {
      const response = {
        data: {
          user: {
            id: '123',
            username: 'someone',
            followerCount: 42,
            followingCount: 10,
            tweetCount: 5,
            verified: false,
            isBlueVerified: true,
          },
        },
      };

      const users = extractUsers(response);

      expect(users).toHaveLength(1);
      expect(users[0]).toMatchObject({
        id: '123',
        username: 'someone',
        followersCount: 42,
        followingCount: 10,
        tweetsCount: 5,
        verified: true,
      });
    });

    it('returns an empty array when nothing looks like a user', () => {
      expect(extractUsers({ data: { tweets: [] } })).toEqual([]);
    });
  });

  describe('extractTweets', () => {
    it('finds tweet-like objects and resolves the author from a nested user', () => {
      const response = {
        data: {
          tweets: [
            {
              id_str: '111',
              full_text: 'hello world',
              user: { screen_name: 'alice' },
            },
          ],
        },
      };

      const tweets = extractTweets(response);

      expect(tweets).toEqual([
        {
          id: '111',
          authorId: null,
          authorUsername: 'alice',
          text: 'hello world',
          raw: response.data.tweets[0],
        },
      ]);
    });

    it('ignores objects without a usable id', () => {
      const response = { data: { tweets: [{ text: 'no id here' }] } };

      expect(extractTweets(response)).toEqual([]);
    });

    it('resolves the author from a nested `author` object (confirmed shape)', () => {
      const response = {
        data: {
          tweets: [
            {
              id: '111',
              text: 'hello world',
              isPaidPromotion: true,
              author: {
                id: '999',
                username: 'alice',
                followerCount: 5,
                followingCount: 1,
                tweetCount: 2,
              },
            },
          ],
        },
      };

      const tweets = extractTweets(response);

      expect(tweets[0]).toMatchObject({
        id: '111',
        authorId: '999',
        authorUsername: 'alice',
        text: 'hello world',
      });
    });
  });

  describe('toExtractedUser', () => {
    it('falls back across known field name variants', () => {
      const user = toExtractedUser({
        username: 'fallback',
        id: 99,
        followers: 7,
        following: 3,
        tweet_count: 1,
        is_blue_verified: true,
      });

      expect(user).toEqual({
        id: '99',
        username: 'fallback',
        followersCount: 7,
        followingCount: 3,
        tweetsCount: 1,
        verified: true,
        raw: expect.any(Object),
      });
    });

    it('maps the confirmed Twitter API47 flat user shape', () => {
      const user = toExtractedUser({
        id: '123',
        username: 'someone',
        followerCount: 42,
        followingCount: 10,
        tweetCount: 5,
        verified: false,
        isBlueVerified: true,
      });

      expect(user).toEqual({
        id: '123',
        username: 'someone',
        followersCount: 42,
        followingCount: 10,
        tweetsCount: 5,
        verified: true,
        raw: expect.any(Object),
      });
    });
  });

  describe('smartFollowerScore', () => {
    it('rewards reach and gives verified accounts a large bonus', () => {
      const unverified = toExtractedUser({
        screen_name: 'a',
        followers_count: 1000,
      });
      const verified = toExtractedUser({
        screen_name: 'b',
        followers_count: 1000,
        verified: true,
      });

      expect(smartFollowerScore(unverified)).toBe(1000);
      expect(smartFollowerScore(verified)).toBe(101000);
    });
  });

  describe('isPaidPartnershipTweet', () => {
    it('flags tweets whose raw JSON mentions paid partnership indicators', () => {
      const tweet = extractTweets({
        full_text: 'Check this out',
        id_str: '1',
        promoted_metadata: { is_promoted_tweet: true },
      })[0];

      expect(isPaidPartnershipTweet(tweet)).toBe(true);
    });

    it('does not flag ordinary tweets', () => {
      const tweet = extractTweets({
        full_text: 'Just a regular tweet',
        id_str: '2',
      })[0];

      expect(isPaidPartnershipTweet(tweet)).toBe(false);
    });

    it('flags tweets using the confirmed isPaidPromotion field regardless of text', () => {
      const tweet = extractTweets({
        id: '3',
        text: 'Just a regular-looking tweet',
        isPaidPromotion: true,
      })[0];

      expect(isPaidPartnershipTweet(tweet)).toBe(true);
    });
  });

  describe('computeInfluenceScore', () => {
    it('increases with reach, follower/following ratio, and verification', () => {
      const small = toExtractedUser({
        screen_name: 'small',
        followers_count: 10,
        following_count: 10,
      });
      const large = toExtractedUser({
        screen_name: 'large',
        followers_count: 1_000_000,
        following_count: 100,
        verified: true,
      });

      expect(computeInfluenceScore(large)).toBeGreaterThan(
        computeInfluenceScore(small),
      );
    });
  });
});
