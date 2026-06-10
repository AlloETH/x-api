# x-api — Twitter API47 NestJS Wrapper

A NestJS wrapper around the [Twitter API47](https://rapidapi.com/restocked-gAGxip8a_/api/twitter-api47)
RapidAPI service. Every route is a thin 1:1 proxy to the upstream `/v3/...`
endpoint, mounted under `/twitter`, with RapidAPI authentication, error
translation, rate limiting and Swagger docs handled centrally.

## How the endpoint list was obtained

RapidAPI's marketplace page is a JS-rendered SPA, so the endpoint catalog
isn't scrapeable directly. Instead, the full set of valid `/v3/...` routes
was discovered empirically against the live gateway:

- An **unknown path** returns `404 {"message":"Endpoint '<path>' does not exist"}`.
- A **valid path** returns `429 {"message":"...MONTHLY quota..."}` (the
  account's quota was already exhausted), regardless of query params.

This 404-vs-429 signal was used to enumerate every valid `/v3/...` path
without consuming request quota. The **only confirmed query parameter** is
`username` on `/v3/user/by-username` (from the example request). All other
parameter names below are best-effort guesses based on naming conventions
(`by-username` -> `username`, `by-id`/`by-ids` -> `id`/`ids`, list endpoints
-> `cursor`, etc.) and **may need adjustment** once you have a working
RapidAPI plan to test against.

Because every route is a verbatim query-param passthrough (see
[Architecture](#architecture)), you can pass whatever parameter names the
upstream actually expects and they will be forwarded unchanged - no code
changes needed if a guessed name is wrong.

## Features

- 22 routes covering users, tweets, search, communities, lists and spaces -
  mirroring the upstream `/v3/...` paths 1:1 under `/twitter`.
- Centralized RapidAPI authentication via `@nestjs/axios` (`x-rapidapi-key` /
  `x-rapidapi-host` headers configured once for all requests).
- All query parameters are forwarded to the upstream endpoint verbatim.
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

All endpoints are mounted under `/twitter` and mirror the upstream path
exactly (see [`twitter-endpoints.constant.ts`](src/twitter/constants/twitter-endpoints.constant.ts)).
For example:

```
GET /twitter/v3/user/by-username?username=elonmusk
  -> proxies to
GET https://twitter-api47.p.rapidapi.com/v3/user/by-username?username=elonmusk
```

### Users

| Method | Path                                     | Likely params              | Description                                |
| ------ | ------------------------------------------ | ----------------------------- | --------------------------------------------- |
| GET    | `/twitter/v3/user/by-username`              | `username` *(confirmed)*       | Get a user's profile by username               |
| GET    | `/twitter/v3/user/by-id`                    | `id`                            | Get a user's profile by numeric user ID        |
| GET    | `/twitter/v3/user/by-ids`                   | `ids` (comma-separated)         | Batch lookup of user profiles by ID            |
| GET    | `/twitter/v3/user/tweets`                   | `username`, `cursor`            | Get a user's tweets                            |
| GET    | `/twitter/v3/user/tweets-and-replies`       | `username`, `cursor`            | Get a user's tweets and replies                |
| GET    | `/twitter/v3/user/followers`                | `username`, `cursor`            | Get a user's followers                         |
| GET    | `/twitter/v3/user/followers-ids`            | `username`, `cursor`            | Get the numeric IDs of a user's followers      |
| GET    | `/twitter/v3/user/following`                | `username`, `cursor`            | Get the accounts a user follows                |
| GET    | `/twitter/v3/user/following-ids`            | `username`, `cursor`            | Get the numeric IDs of accounts a user follows |

### Tweets

| Method | Path                          | Likely params     | Description                       |
| ------ | -------------------------------- | -------------------- | ------------------------------------- |
| GET    | `/twitter/v3/tweet/details`      | `id`, `cursor`        | Get a tweet's details                  |
| GET    | `/twitter/v3/tweet/retweets`     | `id`, `cursor`        | Get the users who retweeted a tweet    |
| GET    | `/twitter/v3/tweet/quotes`       | `id`, `cursor`        | Get the quote tweets of a tweet        |

### Search

| Method | Path              | Likely params       | Description           |
| ------ | -------------------- | ---------------------- | ------------------------- |
| GET    | `/twitter/v3/search`  | `query`, `cursor`       | Search tweets/users        |

### Communities

| Method | Path                              | Likely params     | Description                  |
| ------ | ------------------------------------ | -------------------- | --------------------------------- |
| GET    | `/twitter/v3/community/details`      | `id`                  | Get details about a Community      |
| GET    | `/twitter/v3/community/tweets`       | `id`, `cursor`        | Get a Community's tweet timeline   |
| GET    | `/twitter/v3/community/members`      | `id`, `cursor`        | Get a Community's members          |
| GET    | `/twitter/v3/community/search`       | `query`, `cursor`     | Search Communities                 |

### Lists

| Method | Path                          | Likely params     | Description             |
| ------ | -------------------------------- | -------------------- | --------------------------- |
| GET    | `/twitter/v3/list/tweets`        | `id`, `cursor`        | Get a List's tweet timeline   |
| GET    | `/twitter/v3/list/members`       | `id`, `cursor`        | Get a List's members          |
| GET    | `/twitter/v3/list/details`       | `id`                  | Get details about a List      |
| GET    | `/twitter/v3/list/followers`     | `id`, `cursor`        | Get a List's followers        |

### Spaces

| Method | Path                       | Likely params | Description               |
| ------ | ----------------------------- | ---------------- | ------------------------------ |
| GET    | `/twitter/v3/space/by-id`      | `id`              | Get details about a Space        |

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

## Project structure

```
src/
├── app.module.ts            # Root module (config, throttling, Twitter module)
├── main.ts                  # Bootstrap, global pipes/filters, Swagger
├── config/                   # Environment configuration & validation
├── common/
│   ├── filters/               # Upstream error -> HTTP exception translation
│   └── interceptors/          # Request logging
└── twitter/
    ├── twitter.module.ts      # HttpModule config (RapidAPI base URL/headers)
    ├── twitter.controller.ts  # REST endpoints (1:1 proxy to upstream /v3/...)
    ├── twitter.service.ts     # Upstream API calls
    ├── constants/              # Upstream endpoint path map
    └── interfaces/             # Response typings
```
