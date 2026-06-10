/**
 * Centralized map of Twitter API47 (RapidAPI) upstream endpoint paths.
 *
 * If your RapidAPI subscription exposes these endpoints under different
 * paths/parameter names, this is the only place that needs to change -
 * every service method below resolves its upstream path from here.
 *
 * @see https://rapidapi.com/restocked-gAGxip8a_/api/twitter-api47
 */
export const TWITTER_ENDPOINTS = {
  USER_BY_USERNAME: '/screenname.php',
  USER_TWEETS: '/timeline.php',
  USER_TWEETS_AND_REPLIES: '/timeline_replies.php',
  USER_MEDIA: '/usermedia.php',
  USER_LIKES: '/likes.php',
  USER_FOLLOWERS: '/followers.php',
  USER_FOLLOWING: '/following.php',
  USER_HIGHLIGHTS: '/highlights.php',
  USER_AFFILIATES: '/affilates.php',
  TWEET_DETAIL: '/tweet.php',
  TWEET_THREAD: '/tweet_thread.php',
  TWEET_RETWEETS: '/retweets.php',
  CHECK_RETWEET: '/checkretweet.php',
  SEARCH: '/search.php',
  TRENDS: '/trends.php',
  COMMUNITY_TIMELINE: '/community_timeline.php',
  COMMUNITY_DETAILS: '/community_about.php',
  LIST_TIMELINE: '/list_timeline.php',
  SPACE_DETAILS: '/space.php',
} as const;
