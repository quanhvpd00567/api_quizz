import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'

/**
 * CORS middleware to handle cross-origin requests
 */
export default class CorsMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    // Get CORS settings from environment
    const corsOrigins = env
      .get('CORS_ORIGIN', 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim())
    const corsMethods = env.get('CORS_METHODS', 'GET, POST, PUT, DELETE, OPTIONS')
    const corsHeaders = env.get('CORS_HEADERS', 'Content-Type, Authorization, X-Requested-With')

    // Get the request origin
    const requestOrigin = request.header('origin')

    // Check if request origin is allowed
    const allowedOrigin = corsOrigins.includes(requestOrigin || '') ? requestOrigin : corsOrigins[0]

    // Set CORS headers
    response.header('Access-Control-Allow-Origin', allowedOrigin || '*')
    response.header('Access-Control-Allow-Methods', corsMethods)
    response.header('Access-Control-Allow-Headers', corsHeaders)
    response.header('Access-Control-Allow-Credentials', 'true')

    // Handle preflight requests
    if (request.method() === 'OPTIONS') {
      return response.status(200).send('')
    }

    return await next()
  }
}
