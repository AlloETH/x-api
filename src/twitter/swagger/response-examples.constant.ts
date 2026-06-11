/**
 * Example response payloads used to document `TwitterController` in
 * Swagger.
 *
 * The shapes used here for `user/by-username`, `user/by-id`, `user/tweets`,
 * `user/tweets-and-replies` and `user/followers` are confirmed against the
 * live upstream Twitter API47 (see README "How the endpoint list was
 * obtained" / `twitter-data.util.ts`). Endpoints whose shape hasn't been
 * confirmed (e.g. `user/by-ids`, `tweet/*`, `search`, `community/*`,
 * `list/*`, `space/by-id`) are documented as raw passthroughs without a
 * fabricated example.
 */

const EXAMPLE_USER = {
  id: '44196397',
  username: 'elonmusk',
  name: 'Elon Musk',
  bio: 'Mars, cars, chips, internet tunnels, AI, robots & more',
  location: 'Austin, Texas',
  website: 'https://x.com',
  avatar: 'https://pbs.twimg.com/profile_images/1234567890/avatar_normal.jpg',
  verified: true,
  isBlueVerified: true,
  followerCount: 200000000,
  followingCount: 700,
  tweetCount: 75000,
  createdAt: '2009-06-02T20:12:29.000Z',
};

/** `GET /v3/user/by-username` and `GET /v3/user/by-id`. */
export const USER_RESPONSE_EXAMPLE = {
  data: { user: EXAMPLE_USER },
};

const EXAMPLE_TWEET = {
  id: '2064841162351878274',
  conversationId: '2064841162351878274',
  text: 'GN 💤 https://x.com/elonmusk/status/2064841162351878274/photo/1',
  createdAt: '2026-06-10T22:44:30.000Z',
  isPaidPromotion: false,
  isPromoted: false,
  lang: 'en',
  source: 'Twitter for iPhone',
  viewCount: 1776,
  likeCount: 111,
  retweetCount: 9,
  replyCount: 77,
  quoteCount: 0,
  bookmarkCount: 0,
  author: EXAMPLE_USER,
};

/** `GET /v3/user/tweets` and `GET /v3/user/tweets-and-replies`. */
export const TWEETS_RESPONSE_EXAMPLE = {
  data: [EXAMPLE_TWEET],
  pagination: {
    nextCursor:
      'DAAHCgABHKhud0X__-sLAAIAAAATMjA2NDA3MDUyMTg4OTYyMDMzOAgAAwAAAAIAAA',
    prevCursor:
      'DAAHCgABHKhud0YAJxELAAIAAAATMjA2NDg0MTE2MjM1MTg3ODI3NAgAAwAAAAEAAA',
  },
};

/** `GET /v3/user/followers`. */
export const FOLLOWERS_RESPONSE_EXAMPLE = {
  data: { followers: [EXAMPLE_USER] },
};

/**
 * `GET /v3/user/following`. Presumed (but not independently confirmed) to
 * mirror the `user/followers` shape.
 */
export const FOLLOWING_RESPONSE_EXAMPLE = {
  data: { following: [EXAMPLE_USER] },
};

/** `GET /v3/user/smart-followers` (derived endpoint). */
export const SMART_FOLLOWERS_RESPONSE_EXAMPLE = {
  username: 'elonmusk',
  count: 1,
  smartFollowers: [
    {
      id: '12345678',
      username: 'celeb',
      followersCount: 5000000,
      followingCount: 200,
      tweetsCount: 10000,
      verified: true,
      score: 5100000,
    },
  ],
};

/** `GET /v3/user/paid-partnership-tweets` (derived endpoint). */
export const PAID_PARTNERSHIP_RESPONSE_EXAMPLE = {
  username: 'elonmusk',
  period: '30d',
  count: 1,
  tweets: [
    {
      id: '2064841162351878274',
      authorId: '44196397',
      authorUsername: 'elonmusk',
      text: 'Check out this product - paid partnership with Acme',
      createdAt: '2026-06-01T12:00:00.000Z',
    },
  ],
};

/** `GET /v3/user/stats` (derived endpoint). */
export const USER_STATS_RESPONSE_EXAMPLE = {
  id: '44196397',
  username: 'elonmusk',
  followersCount: 200000000,
  followingCount: 700,
  tweetsCount: 75000,
  verified: true,
  influenceScore: 980,
  followerGrowth: 15234,
  previousFetchedAt: '2026-06-04T08:00:00.000Z',
};
