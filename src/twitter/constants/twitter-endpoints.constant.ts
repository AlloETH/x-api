/**
 * Map of Twitter API47 (RapidAPI) upstream endpoint paths.
 *
 * This list was derived empirically: the RapidAPI gateway responds with
 * `404 {"message":"Endpoint '<path>' does not exist"}` for unknown paths and
 * `429 {"message":"...MONTHLY quota..."}` for valid ones (independent of
 * query params), which made it possible to enumerate the real `/v3/...`
 * routes exposed by this API without consuming request quota.
 *
 * @see https://rapidapi.com/restocked-gAGxip8a_/api/twitter-api47
 */
export const TWITTER_ENDPOINTS = {
  // Users
  USER_BY_USERNAME: '/v3/user/by-username',
  USER_BY_ID: '/v3/user/by-id',
  USERS_BY_IDS: '/v3/user/by-ids',
  USER_TWEETS: '/v3/user/tweets',
  USER_TWEETS_AND_REPLIES: '/v3/user/tweets-and-replies',
  USER_FOLLOWERS: '/v3/user/followers',
  USER_FOLLOWERS_IDS: '/v3/user/followers-ids',
  USER_FOLLOWING: '/v3/user/following',
  USER_FOLLOWING_IDS: '/v3/user/following-ids',

  // Tweets
  TWEET_DETAILS: '/v3/tweet/details',
  TWEET_RETWEETS: '/v3/tweet/retweets',
  TWEET_QUOTES: '/v3/tweet/quotes',

  // Search
  SEARCH: '/v3/search',

  // Communities
  COMMUNITY_DETAILS: '/v3/community/details',
  COMMUNITY_TWEETS: '/v3/community/tweets',
  COMMUNITY_MEMBERS: '/v3/community/members',
  COMMUNITY_SEARCH: '/v3/community/search',

  // Lists
  LIST_TWEETS: '/v3/list/tweets',
  LIST_MEMBERS: '/v3/list/members',
  LIST_DETAILS: '/v3/list/details',
  LIST_FOLLOWERS: '/v3/list/followers',

  // Spaces
  SPACE_BY_ID: '/v3/space/by-id',
} as const;
