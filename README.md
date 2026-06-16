# x-api — X (Twitter) Data API

A NestJS wrapper around an upstream X (Twitter) data API. Every route is a
thin 1:1 proxy to the upstream `/v3/...` endpoint, mounted under `/twitter`,
with upstream authentication, error translation, rate limiting and API docs
handled centrally.

## How the endpoint list was obtained

The upstream provider's marketplace page is a JS-rendered SPA, so the
endpoint catalog isn't scrapeable directly. Instead, the full set of valid
`/v3/...` routes was discovered empirically against the live gateway:

- An **unknown path** returns `404 {"message":"Endpoint '<path>' does not exist"}`.
- A **valid path** returns `429 {"message":"...MONTHLY quota..."}` (when the
  account's quota is exhausted), or `400 {"error":{"code":"VALIDATION_ERROR",
  "message":"Required - query,<param>"}}` (when called with a working key but
  a missing required parameter), regardless of which other params are passed.

This was used to enumerate every valid `/v3/...` path, and - using a working
upstream API key - every endpoint's required query parameter names, by
reading the `VALIDATION_ERROR` responses. All parameter names in the tables
below are **confirmed** against the live API this way.

Because every route is a verbatim query-param passthrough (see
[Architecture](#architecture)), you can still pass any extra parameter names
the upstream accepts (e.g. pagination/filter params not listed below) and
they will be forwarded unchanged.

## Features

- 22 routes covering users, tweets, search, communities, lists and spaces -
  mirroring the upstream `/v3/...` paths 1:1 under `/twitter`.
- Centralized upstream API authentication via `@nestjs/axios` (auth headers
  configured once for all requests).
- All query parameters are forwarded to the upstream endpoint verbatim.
- Upstream error translation into consistent JSON error responses
  (`UpstreamExceptionFilter`).
- Built-in rate limiting (`@nestjs/throttler`) to help stay within your
  upstream API plan's quota.
- **Persistence**: user profiles and tweets fetched through the API are
  stored in a PostgreSQL database via TypeORM (see
  [Database & persistence](#database--persistence)).
- **Derived analytics endpoints** (computed locally, inspired by
  [app.sorsa.io](https://app.sorsa.io)):
  - `GET /twitter/v3/user/smart-followers` - a user's followers ranked by
    reach + verification.
  - `GET /twitter/v3/user/paid-partnership-tweets` - a user's tweets flagged
    as paid partnership / branded content.
  - `GET /twitter/v3/user/stats` - influence score and follower growth since
    the last fetch.
- Interactive API docs powered by [Scalar](https://scalar.com) at `/docs`,
  with example requests/responses and documented error shapes for every
  route (see [API documentation](#api-documentation)).
- Unit tests for the service, storage and controller layers.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

This starts a local Postgres instance (`postgres:16-alpine`) matching the
default `DATABASE_URL` below, with data persisted in a `postgres-data` Docker
volume.

### 3. Configure environment variables

Copy `.env.example` to `.env` and set your RapidAPI credentials:

```bash
cp .env.example .env
```

| Variable             | Description                                              | Default                              |
| -------------------- | --------------------------------------------------------- | ------------------------------------- |
| `PORT`                | Port the NestJS server listens on                          | `3000`                                 |
| `RAPIDAPI_KEY`        | Your RapidAPI key (**required**)                           | -                                       |
| `RAPIDAPI_HOST`       | RapidAPI host header for Twitter API47                     | `twitter-api47.p.rapidapi.com`         |
| `RAPIDAPI_BASE_URL`   | Base URL of the upstream API                               | `https://twitter-api47.p.rapidapi.com` |
| `RAPIDAPI_TIMEOUT`    | Upstream request timeout (ms)                              | `10000`                                |
| `THROTTLE_TTL`        | Rate limit window (ms)                                     | `60000`                                |
| `THROTTLE_LIMIT`      | Max requests per window                                    | `60`                                   |
| `DATABASE_URL`        | PostgreSQL connection string used to persist fetched data  | `postgresql://postgres:postgres@localhost:5432/x_api` |

### 4. Run the app

```bash
npm run start:dev
```

The API is available at `http://localhost:3000` and interactive API docs at
`http://localhost:3000/docs`.

### 5. Run tests

```bash
npm run test       # unit tests
npm run test:e2e   # end-to-end tests (requires Postgres - see step 2)
npm run test:cov   # coverage
```

## API documentation

The full OpenAPI spec is generated from the route decorators and served in
two forms:

- [`/docs`](http://localhost:3000/docs) - a [Scalar](https://scalar.com) API
  reference with a searchable sidebar, syntax-highlighted examples and a
  built-in "try it out" client.
- `/docs-json` (and `/docs-yaml`) - the raw OpenAPI spec, e.g. for importing
  into Postman or Insomnia.

Each route documents:

- Its query parameters (confirmed names, plus a note that any extra upstream
  parameter is forwarded unchanged).
- An example success response - a real, confirmed response shape for
  endpoints that have been validated against the live API (see
  [How the endpoint list was obtained](#how-the-endpoint-list-was-obtained)),
  or a "raw passthrough, shape not yet confirmed" note otherwise.
- The error responses every route can return (see
  [Error responses](#error-responses) below).

It's grouped into **Users**, **Analytics**, **Tweets**, **Search**,
**Communities**, **Lists** and **Spaces**, matching the sections below.

### Error responses

| Status | When                                                                 | Shape |
| ------ | -------------------------------------------------------------------- | ----- |
| `400`  | This server's `ValidationPipe` rejected the request (e.g. an unknown query parameter), or a route-specific check (e.g. an invalid `period`) failed | `{ "statusCode": 400, "message": "...", "error": "Bad Request" }` |
| `400`  | The upstream API rejected the request as invalid                       | `{ "statusCode": 400, "message": "Upstream API request failed", "upstreamStatus": 400, "upstreamMessage": "..." }` |
| `429`  | This server's own rate limit (`THROTTLE_TTL`/`THROTTLE_LIMIT`) was exceeded | `{ "statusCode": 429, "message": "ThrottlerException: Too Many Requests" }` |
| `429`  | The upstream API plan's monthly quota was exhausted                    | `{ "statusCode": 429, "message": "Upstream API request failed", "upstreamStatus": 429, "upstreamMessage": "...MONTHLY quota..." }` |
| `502`  | The upstream request failed for any other reason (e.g. invalid/expired upstream API credentials) | `{ "statusCode": 502, "message": "Upstream API request failed", "upstreamStatus": <code>, "upstreamMessage": "..." }` |

All of these are produced centrally by the global `ValidationPipe` and
`UpstreamExceptionFilter` (`src/common/filters/upstream-exception.filter.ts`),
documented for every route via `ApiUpstreamErrorResponses`
(`src/common/decorators/api-upstream-response.decorator.ts`).

## API Endpoints

All endpoints are mounted under `/twitter` and mirror the upstream path
exactly (see [`twitter-endpoints.constant.ts`](src/twitter/constants/twitter-endpoints.constant.ts)).
For example:

```
GET /twitter/v3/user/by-username?username=elonmusk
  -> proxies to
GET <RAPIDAPI_BASE_URL>/v3/user/by-username?username=elonmusk
```

### Users

| Method | Path                                     | Params                          | Description                                |
| ------ | ------------------------------------------ | ----------------------------- | --------------------------------------------- |
| GET    | `/twitter/v3/user/by-username`              | `username` *(required)*        | Get a user's profile by username               |
| GET    | `/twitter/v3/user/by-id`                    | `userId` *(required)*           | Get a user's profile by numeric user ID        |
| GET    | `/twitter/v3/user/by-ids`                   | `userIds` *(required, comma-separated)* | Batch lookup of user profiles by ID    |
| GET    | `/twitter/v3/user/tweets`                   | `userId` *(required)*, `cursor` | Get a user's tweets                            |
| GET    | `/twitter/v3/user/tweets-and-replies`       | `userId` *(required)*, `cursor` | Get a user's tweets and replies                |
| GET    | `/twitter/v3/user/followers`                | `userId` *(required)*, `cursor` | Get a user's followers                         |
| GET    | `/twitter/v3/user/followers-ids`            | `userId` *(required)*, `cursor` | Get the numeric IDs of a user's followers      |
| GET    | `/twitter/v3/user/following`                | `userId` *(required)*, `cursor` | Get the accounts a user follows                |
| GET    | `/twitter/v3/user/following-ids`            | `userId` *(required)*, `cursor` | Get the numeric IDs of accounts a user follows |

### Derived analytics (computed locally)

These routes are **not** 1:1 upstream proxies - they fetch the underlying
upstream data, derive a result locally, and persist it. See
[Smart followers, paid partnerships & stats](#smart-followers-paid-partnerships--stats)
for how each one is computed.

| Method | Path                                     | Params                          | Description                                          |
| ------ | ------------------------------------------ | ----------------------------- | ----------------------------------------------------- |
| GET    | `/twitter/v3/user/smart-followers`          | `username` or `userId` *(one required)*, `limit` (default 25), `cursor` | A user's followers ranked by reach + verification |
| GET    | `/twitter/v3/user/paid-partnership-tweets`  | `username` or `userId` *(one required)*, `period` (default `30d`, e.g. `7d`/`3m`/`1y`), `cursor` | A user's tweets flagged as paid partnership / branded content over `period` (only the last 7 days are re-fetched live; older data comes from the database) |
| GET    | `/twitter/v3/user/stats`                    | `username` *(required)*        | Influence score + follower growth since the last fetch |

### Tweets

| Method | Path                          | Params             | Description                       |
| ------ | -------------------------------- | -------------------- | ------------------------------------- |
| GET    | `/twitter/v3/tweet/details`      | `tweetId` *(required)*, `cursor` | Get a tweet's details                  |
| GET    | `/twitter/v3/tweet/retweets`     | `tweetId` *(required)*, `cursor` | Get the users who retweeted a tweet    |
| GET    | `/twitter/v3/tweet/quotes`       | `tweetId` *(required)*, `cursor` | Get the quote tweets of a tweet        |

### Search

| Method | Path              | Params               | Description           |
| ------ | -------------------- | ---------------------- | ------------------------- |
| GET    | `/twitter/v3/search`  | `query` *(required)*, `type` *(required, e.g. "Top", "Latest", "People")*, `cursor` | Search tweets/users        |

### Communities

| Method | Path                              | Params             | Description                  |
| ------ | ------------------------------------ | -------------------- | --------------------------------- |
| GET    | `/twitter/v3/community/details`      | `communityId` *(required)* | Get details about a Community      |
| GET    | `/twitter/v3/community/tweets`       | `communityId` *(required)*, `cursor` | Get a Community's tweet timeline   |
| GET    | `/twitter/v3/community/members`      | `communityId` *(required)*, `cursor` | Get a Community's members          |
| GET    | `/twitter/v3/community/search`       | `query` *(required)*, `cursor` | Search Communities                 |

### Lists

| Method | Path                          | Params             | Description             |
| ------ | -------------------------------- | -------------------- | --------------------------- |
| GET    | `/twitter/v3/list/tweets`        | `listId` *(required)*, `cursor` | Get a List's tweet timeline   |
| GET    | `/twitter/v3/list/members`       | `listId` *(required)*, `cursor` | Get a List's members          |
| GET    | `/twitter/v3/list/details`       | `listId` *(required)* | Get details about a List      |
| GET    | `/twitter/v3/list/followers`     | `listId` *(required)*, `cursor` | Get a List's followers        |

### Spaces

| Method | Path                       | Params       | Description               |
| ------ | ----------------------------- | ---------------- | ------------------------------ |
| GET    | `/twitter/v3/space/by-id`      | `spaceId` *(required)* | Get details about a Space        |

### Health

| Method | Path      | Description       |
| ------ | ---------- | -------------------- |
| GET    | `/health`  | Service health check |

## Architecture

Each controller route accepts `@Query() query: Record<string, string>` and
passes it straight through to `TwitterService`, which forwards it verbatim
as query params to the matching upstream endpoint
(`src/twitter/constants/twitter-endpoints.constant.ts`). This means:

- The wrapper stays correct even if a guessed parameter name above is wrong
  - just pass the correct param name and it's forwarded as-is.
- Adding/adjusting an endpoint is a two-line change: add the path to
  `twitter-endpoints.constant.ts`, add a method to `TwitterService`, and a
  route to `TwitterController`.

## Database & persistence

The app uses [TypeORM](https://typeorm.io) with PostgreSQL (`pg` driver) to
persist data fetched from the upstream API, configured via `DATABASE_URL`
(defaults to the `docker-compose.yml` Postgres instance; `synchronize: true`
auto-creates the schema, which is fine at this scale - swap to migrations if
you outgrow it). Persistence is best-effort: a database error is logged but
never breaks the proxied API response.

| Table             | Populated by                                                          | Contents                                                |
| ------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| `user_snapshots`    | `user/by-username`, `user/by-id`, `user/by-ids`, `user/stats`             | One row per fetch (id, username, follower/following/tweet counts, verified, raw JSON, timestamp) - enables follower-growth tracking over time |
| `tweets`            | `user/tweets`, `user/tweets-and-replies`, `user/paid-partnership-tweets`  | One row per tweet, upserted by ID (author, text, `tweetCreatedAt`, `isPaidPartnership` flag, raw JSON) - `tweetCreatedAt` lets `paid-partnership-tweets` serve longer `period`s from the database |
| `smart_followers`   | `user/smart-followers`                                                    | The latest ranked "smart followers" per target account (upserted by target + follower username) |

## InfoFi data (migrated from infoeye)

The user and leaderboard data from the **infoeye** project has been migrated
into this API. The schema is defined as TypeORM entities under
`src/infofi/entities/` (created automatically by `synchronize: true`), and the
data is served read-only under `/infofi`:

| Endpoint                          | Description                                                        |
| --------------------------------- | ----------------------------------------------------------------- |
| `GET /infofi/projects`            | All tracked projects                                              |
| `GET /infofi/platforms`           | All InfoFi platforms                                              |
| `GET /infofi/users/:identifier`   | An InfoFi user (by Twitter ID or username) + per-platform metrics |
| `GET /infofi/leaderboards/cookie` | Cookie.fun leaderboard (`projectId`, `periodId`, `language`, `capital`, `limit`, `offset`) |
| `GET /infofi/leaderboards/kaito`  | Kaito leaderboard (`projectId`, `periodId`, `language`, `limit`, `offset`) |
| `GET /infofi/leaderboards/wallchain` | Wallchain leaderboard (`epochId`, `limit`, `offset`)          |

Leaderboard rows are enriched with the referenced user's profile from
`infofi_users` (username, display name, image). The migrated tables are:
the identity registry (`infofi_users`), per-platform user metrics
(`kaito_users`, `cookie_users`, `wallchain_users`, `platform_user_metrics`),
the leaderboards (`cookie_leaderboard`, `cookie_leaderboard_capital`,
`kaito_leaderboard`, `kaito_leaderboard_history`, `wallchain_leaderboard`)
and their parents (`projects`, `platforms`, `cookie_periods`, `kaito_periods`,
`cookie_languages`, `wallchain_epochs`).

> Foreign-key links (`project_id`, `period_id`, `user_id`, …) are modeled as
> indexed columns **without** database-level FK constraints, so the import is
> resilient to orphaned rows and insertion order. Auth/admin tables and
> RLS policies from infoeye are intentionally **not** carried over.

### Running the migration

The one-off ETL (`scripts/migrate-infoeye.ts`) reads from infoeye's Supabase
Postgres via the REST client (using the **service role** key, which bypasses
RLS) and bulk-upserts into this project's Postgres in foreign-key order. It is
idempotent — re-running updates existing rows.

```bash
# 1. Make sure the target Postgres is up and DATABASE_URL points at it
docker compose up -d

# 2. Set the source credentials (see .env.example)
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 3. Run the copy
npm run migrate:infoeye
```

## Smart followers, paid partnerships & stats

The upstream API has **no endpoints** for "smart followers",
"paid partnership" posts, or influence scoring (inspired by
[app.sorsa.io](https://app.sorsa.io)'s profile dashboard). These are computed
locally on top of the existing `/v3/user/followers` and `/v3/user/tweets`
responses by `src/twitter/utils/twitter-data.util.ts`.

`/v3/user/followers` and `/v3/user/tweets` require a numeric `userId`, so
both derived endpoints accept either `username` or `userId` and resolve a
`username` to its `userId` via `/v3/user/by-username` first
(`TwitterService.resolveUserId`).

- **Smart followers** (`/v3/user/smart-followers`): fetches `/v3/user/followers`,
  paginating via `pagination.nextCursor` for up to `SMART_FOLLOWERS_MAX_PAGES`
  (5) pages (or until a page comes back empty or without a `nextCursor`).
  Every follower collected across those pages is scored via
  `smartFollowerScore` - follower count plus a large bonus if the account is
  verified (`verified` or `isBlueVerified`) - then sorted descending and
  truncated to `limit` (default 25).
- **Paid partnership tweets** (`/v3/user/paid-partnership-tweets`): covers a
  configurable lookback `period` - a number followed by `d`/`m`/`y`, e.g.
  `7d`, `30d`, `3m`, `6m`, `1y`, `2y` (default `30d`, see
  `PAID_PARTNERSHIP_DEFAULT_PERIOD` in `twitter.service.ts`; `m` = 30 days,
  `y` = 365 days). However long `period` is, **only the most recent
  `PAID_PARTNERSHIP_REFRESH_DAYS` (7) days are re-fetched from
  `/v3/user/tweets`** - paginating via `pagination.nextCursor` (tweets are
  returned newest-first), stopping as soon as it sees a tweet older than 7
  days, or after `PAID_PARTNERSHIP_MAX_PAGES` (10) pages, whichever comes
  first. The rest of `period` is served from previously-stored tweets
  (`tweets.tweetCreatedAt`), so longer periods (`6m`, `1y`, `2y`) get more
  complete the longer this endpoint has been polled regularly, without
  costing extra upstream requests. Every fetched tweet is persisted with its
  `createdAt`; each one is checked by `isPaidPartnershipTweet`, which uses the
  confirmed `isPaidPromotion` boolean returned by the upstream API, falling
  back to a keyword scan of the raw tweet JSON (`paid partnership`, `branded
  content`, `promoted tweet`, `advertiser`, `sponsorship`) for any tweet that
  doesn't set that field. The matching tweets (fresh + stored) are merged,
  sorted newest-first, and returned with their `createdAt` timestamp.
- **Stats** (`/v3/user/stats`): re-fetches the user's profile, computes an
  `influenceScore` (log-scaled reach + follower/following ratio + a
  verification bonus) via `computeInfluenceScore`, and diffs the new
  follower count against the most recent `user_snapshots` row to return
  `followerGrowth`.

The user/tweet extraction (`isUserLike` / `isTweetLike` /
`toExtractedUser` / `toExtractedTweet`) recognizes the confirmed flat
upstream API shape (`id`, `username`, `followerCount`, `followingCount`,
`tweetCount`, `verified`, `isBlueVerified` for users; `id`, `text`,
`isPaidPromotion`, a nested `author` for tweets), with the legacy
GraphQL-style field names (`screen_name`, `followers_count`, etc.) kept as
fallbacks for endpoints whose shape hasn't been confirmed (communities,
lists, spaces).

## Project structure

```
src/
├── app.module.ts            # Root module (config, throttling, DB, Twitter + InfoFi modules)
├── main.ts                  # Bootstrap, global pipes/filters, Swagger
├── config/                   # Environment configuration & validation
├── database/
│   └── database.module.ts    # TypeORM (PostgreSQL) setup
├── common/
│   ├── filters/               # Upstream error -> HTTP exception translation
│   └── interceptors/          # Request logging
├── twitter/
│   ├── twitter.module.ts      # HttpModule + TypeORM feature config
│   ├── twitter.controller.ts  # REST endpoints (1:1 proxy + derived analytics)
│   ├── twitter.service.ts     # Upstream API calls + persistence
│   ├── twitter-storage.service.ts  # Persists user/tweet/follower data
│   ├── constants/              # Upstream endpoint path map
│   ├── entities/               # TypeORM entities (user_snapshots, tweets, smart_followers)
│   ├── utils/                  # Extraction & scoring heuristics
│   └── interfaces/             # Response typings
└── infofi/                    # User & leaderboard data migrated from infoeye
    ├── infofi.module.ts        # TypeORM feature config
    ├── infofi.controller.ts    # /infofi read endpoints
    ├── infofi.service.ts       # Leaderboard queries + user enrichment
    ├── infofi.datasource.ts    # Standalone DataSource for the ETL script
    ├── dto/                    # Leaderboard query/pagination DTOs
    └── entities/               # TypeORM entities (infofi_users, *_leaderboard, …)

scripts/
└── migrate-infoeye.ts        # One-off ETL: infoeye Supabase -> this Postgres
```
