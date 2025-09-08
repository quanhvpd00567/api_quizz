/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  // MongoDB Configuration
  DB_CONNECTION: Env.schema.string.optional(),
  MONGODB_URI: Env.schema.string.optional(),
  MONGODB_DB_NAME: Env.schema.string.optional(),

  // Authentication Configuration
  JWT_SECRET: Env.schema.string.optional(),
  JWT_EXPIRES_IN: Env.schema.string.optional(),
  BCRYPT_ROUNDS: Env.schema.number.optional(),

  // CORS Configuration
  CORS_ENABLED: Env.schema.boolean.optional(),
  CORS_ORIGIN: Env.schema.string.optional(),
  CORS_METHODS: Env.schema.string.optional(),
  CORS_HEADERS: Env.schema.string.optional(),

  // Rate Limiting
  RATE_LIMIT_ENABLED: Env.schema.boolean.optional(),
  RATE_LIMIT_MAX_REQUESTS: Env.schema.number.optional(),
  RATE_LIMIT_WINDOW_MS: Env.schema.number.optional(),

  // File Upload Configuration
  MAX_FILE_SIZE: Env.schema.string.optional(),
  UPLOAD_DIR: Env.schema.string.optional(),
  ALLOWED_FILE_TYPES: Env.schema.string.optional(),
})
