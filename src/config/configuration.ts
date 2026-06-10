export interface AppConfig {
  port: number;
  rapidApi: {
    key: string;
    host: string;
    baseUrl: string;
    timeout: number;
  };
  throttle: {
    ttl: number;
    limit: number;
  };
  database: {
    url: string;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  rapidApi: {
    key: process.env.RAPIDAPI_KEY ?? '',
    host: process.env.RAPIDAPI_HOST ?? 'twitter-api47.p.rapidapi.com',
    baseUrl:
      process.env.RAPIDAPI_BASE_URL ?? 'https://twitter-api47.p.rapidapi.com',
    timeout: parseInt(process.env.RAPIDAPI_TIMEOUT ?? '10000', 10),
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '60', 10),
  },
  database: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/x_api',
  },
});
