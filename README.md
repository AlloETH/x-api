# x-api — Twitter API47 NestJS Wrapper

A NestJS wrapper around the [Twitter API47](https://rapidapi.com/restocked-gAGxip8a_/api/twitter-api47)
RapidAPI service. It exposes a clean, typed, RESTful interface and proxies
requests to the upstream RapidAPI endpoint, handling authentication,
validation, error translation and request logging.

## Features

- REST endpoints covering users, tweets, search, trends, communities, lists
  and spaces.
- Centralized RapidAPI authentication via `@nestjs/axios` (`x-rapidapi-key` /
  `x-rapidapi-host` headers configured once for all requests).
- Request validation with `class-validator` DTOs.
- Upstream error translation into consistent JSON error responses
  (`RapidApiExceptionFilter`).
- Built-in rate limiting (`@nestjs/throttler`) to help stay within your
  RapidAPI plan's quota.
- OpenAPI/Swagger docs served at `/docs`.
- Unit tests for the service and controller layers.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

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

### 3. Run the app

```bash
npm run start:dev
```

The API is available at `http://localhost:3000` and interactive Swagger docs
at `http://localhost:3000/docs`.

### 4. Run tests

```bash
npm run test       # unit tests
npm run test:e2e   # end-to-end tests
npm run test:cov   # coverage
```

## API Endpoints

All endpoints are mounted under `/twitter` and proxy to the corresponding
Twitter API47 upstream endpoint (see
[`twitter-endpoints.constant.ts`](src/twitter/constants/twitter-endpoints.constant.ts)).

### Users

| Method | Path                                       | Upstream endpoint        | Description                       |
| ------ | ------------------------------------------ | ------------------------- | ---------------------------------- |
| GET    | `/twitter/users/:username`                  | `/screenname.php`          | Get a user's profile               |
| GET    | `/twitter/users/:username/tweets`           | `/timeline.php`            | Get a user's tweets                |
| GET    | `/twitter/users/:username/tweets-and-replies` | `/timeline_replies.php`  | Get a user's tweets and replies    |
| GET    | `/twitter/users/:username/media`            | `/usermedia.php`           | Get a user's media                 |
| GET    | `/twitter/users/:username/likes`            | `/likes.php`               | Get tweets liked by a user         |
| GET    | `/twitter/users/:username/followers`        | `/followers.php`           | Get a user's followers             |
| GET    | `/twitter/users/:username/following`        | `/following.php`           | Get accounts a user follows        |
| GET    | `/twitter/users/:username/highlights`       | `/highlights.php`          | Get a user's highlighted tweets    |
| GET    | `/twitter/users/:username/affiliates`       | `/affilates.php`           | Get a user's affiliate accounts    |

List-style endpoints accept an optional `?cursor=` query parameter for
pagination.

### Tweets

| Method | Path                                  | Upstream endpoint    | Description                          |
| ------ | -------------------------------------- | --------------------- | -------------------------------------- |
| GET    | `/twitter/tweets/:id`                  | `/tweet.php`           | Get a tweet by ID                      |
| GET    | `/twitter/tweets/:id/replies`          | `/tweet_thread.php`    | Get the reply thread for a tweet       |
| GET    | `/twitter/tweets/:id/retweets`         | `/retweets.php`        | Get the users who retweeted a tweet    |
| GET    | `/twitter/tweets/:id/check-retweet`    | `/checkretweet.php`    | Check if a user retweeted a tweet (`?userId=`) |

### Search & trends

| Method | Path               | Upstream endpoint | Description                                        |
| ------ | ------------------- | ------------------- | ----------------------------------------------------- |
| GET    | `/twitter/search`    | `/search.php`        | Search tweets/users (`?query=&searchType=&cursor=`)    |
| GET    | `/twitter/trends`    | `/trends.php`        | Get trending topics (`?woeid=`)                        |

`searchType` accepts `Top`, `Latest`, `People`, `Photos`, `Videos` (defaults
to `Top`).

### Communities, Lists & Spaces

| Method | Path                                  | Upstream endpoint        | Description                          |
| ------ | -------------------------------------- | --------------------------- | --------------------------------------- |
| GET    | `/twitter/communities/:id`             | `/community_about.php`       | Get details about a Community           |
| GET    | `/twitter/communities/:id/timeline`    | `/community_timeline.php`    | Get a Community's tweet timeline        |
| GET    | `/twitter/lists/:id/timeline`          | `/list_timeline.php`         | Get a List's tweet timeline             |
| GET    | `/twitter/spaces/:id`                  | `/space.php`                 | Get details about a Space               |

### Health

| Method | Path      | Description       |
| ------ | ---------- | -------------------- |
| GET    | `/health`  | Service health check |

## Adjusting upstream endpoint paths

If your RapidAPI subscription exposes the Twitter API47 endpoints under
different paths or query parameter names, update
[`src/twitter/constants/twitter-endpoints.constant.ts`](src/twitter/constants/twitter-endpoints.constant.ts)
and the corresponding parameter names in
[`src/twitter/twitter.service.ts`](src/twitter/twitter.service.ts) — all
upstream calls are centralized through these two files.

## Project structure

```
src/
├── app.module.ts            # Root module (config, throttling, Twitter module)
├── main.ts                  # Bootstrap, global pipes/filters, Swagger
├── config/                   # Environment configuration & validation
├── common/
│   ├── dto/                  # Shared DTOs (cursor pagination)
│   ├── filters/               # Upstream error -> HTTP exception translation
│   └── interceptors/          # Request logging
└── twitter/
    ├── twitter.module.ts      # HttpModule config (RapidAPI base URL/headers)
    ├── twitter.controller.ts  # REST endpoints
    ├── twitter.service.ts     # Upstream API calls
    ├── constants/              # Upstream endpoint path map
    ├── dto/                    # Request validation DTOs
    └── interfaces/             # Response typings
```
