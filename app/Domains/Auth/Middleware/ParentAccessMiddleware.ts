import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Auth middleware to protect routes that require authentication
 */
export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // check user is parent
    const { auth } = ctx
    if (!auth || auth.user.role !== 'parent') {
      return ctx.response.status(403).json({
        status: 'error',
        message: 'Access denied. Parent role required.',
        timestamp: new Date().toISOString(),
      })
    }

    await next()
  }
}
