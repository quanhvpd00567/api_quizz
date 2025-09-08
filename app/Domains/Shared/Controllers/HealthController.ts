import type { HttpContext } from '@adonisjs/core/http'

export default class HealthController {
  /**
   * Health check endpoint for API monitoring
   * GET /api/v1/health
   */
  async index({ response }: HttpContext) {
    return response.ok({
      status: 'success',
      message: 'Learning Management Backend API is running',
      data: {
        server: 'AdonisJS 6.x',
        architecture: 'Portal (Domain-driven)',
        database: 'MongoDB with Mongoose',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
    })
  }

  /**
   * Database connection status check
   * GET /api/v1/health/database
   */
  async database({ response }: HttpContext) {
    try {
      const MongodbService = (await import('#config/mongodb')).default
      const isConnected = MongodbService.isConnected()

      return response.ok({
        status: 'success',
        message: isConnected ? 'Database connected' : 'Database disconnected',
        data: {
          connected: isConnected,
          database: 'MongoDB',
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Database connection check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}
