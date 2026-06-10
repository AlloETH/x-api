/**
 * Helpers for pulling user/tweet records out of the raw, deeply-nested JSON
 * returned by the upstream Twitter API47 endpoints, and for deriving the
 * "smart followers" / "paid partnership" / "influence score" features that
 * the upstream API doesn't expose directly.
 *
 * The upstream responses mirror Twitter's internal GraphQL shapes, which
 * bury user/tweet objects at varying depths (timeline instructions, entries,
 * itemContent, etc.). Rather than hard-code a path that may not match every
 * endpoint (and may drift), we recursively scan the response for objects
 * that *look like* a user or a tweet based on their fields. If the upstream
 * shape turns out to differ once tested against a live (non-quota-exhausted)
 * key, adjust `isUserLike` / `isTweetLike` below - nothing else needs to
 * change.
 */

export interface ExtractedUser {
  id: string | null;
  username: string;
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
  verified: boolean;
  raw: Record<string, unknown>;
}

export interface ExtractedTweet {
  id: string;
  authorId: string | null;
  authorUsername: string | null;
  text: string | null;
  raw: Record<string, unknown>;
}

/** Recursively collects every nested object in `value` matching `predicate`. */
function findAll(
  value: unknown,
  predicate: (obj: Record<string, unknown>) => boolean,
  results: Record<string, unknown>[] = [],
): Record<string, unknown>[] {
  if (!value || typeof value !== 'object') {
    return results;
  }
  const obj = value as Record<string, unknown>;
  if (predicate(obj)) {
    results.push(obj);
  }
  for (const child of Object.values(obj)) {
    findAll(child, predicate, results);
  }
  return results;
}

function isUserLike(obj: Record<string, unknown>): boolean {
  const username = obj.screen_name ?? obj.username;
  const followers = obj.followers_count ?? obj.followers ?? obj.sub_count;
  return typeof username === 'string' && typeof followers === 'number';
}

function isTweetLike(obj: Record<string, unknown>): boolean {
  const text = obj.full_text ?? obj.text;
  return typeof text === 'string';
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return null;
}

/** Maps a raw "user-like" object to a normalized shape. */
export function toExtractedUser(obj: Record<string, unknown>): ExtractedUser {
  return {
    id: toStringOrNull(obj.id_str ?? obj.rest_id ?? obj.id),
    username: String(obj.screen_name ?? obj.username),
    followersCount: Number(
      obj.followers_count ?? obj.followers ?? obj.sub_count ?? 0,
    ),
    followingCount: Number(
      obj.friends_count ?? obj.following_count ?? obj.following ?? 0,
    ),
    tweetsCount: Number(
      obj.statuses_count ?? obj.tweets_count ?? obj.tweet_count ?? 0,
    ),
    verified: Boolean(obj.verified ?? obj.is_blue_verified ?? obj.isVerified),
    raw: obj,
  };
}

/** Maps a raw "tweet-like" object to a normalized shape. */
export function toExtractedTweet(obj: Record<string, unknown>): ExtractedTweet {
  return {
    id: String(obj.id_str ?? obj.rest_id ?? obj.tweet_id ?? obj.id ?? ''),
    authorId: toStringOrNull(obj.user_id_str ?? obj.user_id ?? null),
    authorUsername: toStringOrNull(
      (obj.user as Record<string, unknown> | undefined)?.screen_name ?? null,
    ),
    text: toStringOrNull(obj.full_text ?? obj.text ?? null),
    raw: obj,
  };
}

/** Finds every user-like object in an upstream response. */
export function extractUsers(response: unknown): ExtractedUser[] {
  return findAll(response, isUserLike).map(toExtractedUser);
}

/** Finds every tweet-like object in an upstream response. */
export function extractTweets(response: unknown): ExtractedTweet[] {
  return findAll(response, isTweetLike)
    .map(toExtractedTweet)
    .filter((tweet) => tweet.id !== '');
}

/**
 * Ranks a follower for the "smart followers" feature: reach (follower count)
 * plus a large bonus for verified accounts, so verified/influential accounts
 * surface ahead of high-follower-count bots/spam accounts.
 */
export function smartFollowerScore(user: ExtractedUser): number {
  const verifiedBonus = user.verified ? 100_000 : 0;
  return user.followersCount + verifiedBonus;
}

const PAID_PARTNERSHIP_PATTERNS: RegExp[] = [
  /paid[\s_-]?partnership/i,
  /branded[\s_-]?content/i,
  /promoted[\s_-]?tweet/i,
  /\badvertiser\b/i,
  /\bsponsorship\b/i,
];

/**
 * Best-effort detection of "Paid partnership" / branded content tweets by
 * scanning the raw tweet JSON for known disclosure indicators. The exact
 * field used by Twitter's GraphQL API for branded-content labels couldn't be
 * confirmed (RapidAPI quota was exhausted during development) - if this
 * misses real paid-partnership tweets, inspect a raw `/v3/user/tweets`
 * response for the actual field name and add a more targeted check above.
 */
export function isPaidPartnershipTweet(tweet: ExtractedTweet): boolean {
  const haystack = JSON.stringify(tweet.raw);
  return PAID_PARTNERSHIP_PATTERNS.some((pattern) => pattern.test(haystack));
}

/**
 * A simple "influence score" inspired by social analytics dashboards (e.g.
 * Sorsa's profile tiers): rewards reach (log-scaled follower count), a
 * healthy follower/following ratio, and verification.
 */
export function computeInfluenceScore(user: ExtractedUser): number {
  const reach = Math.log10(user.followersCount + 1) * 100;
  const ratio = user.followersCount / Math.max(user.followingCount, 1);
  const ratioScore = Math.min(ratio, 100);
  const verifiedBonus = user.verified ? 50 : 0;
  return Math.round(reach + ratioScore + verifiedBonus);
}
