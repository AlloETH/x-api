import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  RAPIDAPI_KEY: Joi.string().required(),
  RAPIDAPI_HOST: Joi.string().default('twitter-api47.p.rapidapi.com'),
  RAPIDAPI_BASE_URL: Joi.string().default(
    'https://twitter-api47.p.rapidapi.com',
  ),
  RAPIDAPI_TIMEOUT: Joi.number().default(10000),
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(60),
  DATABASE_URL: Joi.string().default(
    'postgresql://postgres:postgres@localhost:5432/x_api',
  ),
  API_KEYS: Joi.string().required(),
});
