import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import JwtService from '#domains/Auth/Services/JwtService'
import User from '#domains/Auth/Models/User'

/**
 * Auth middleware to protect routes that require authentication
 */
export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx

    // Extract token from Authorization header
    const authorization = request.header('authorization')
    const token = JwtService.extractTokenFromHeader(authorization)

    if (!token) {
      return response.status(401).json({
        status: 'error',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      })
    }

    try {
      // Verify token and get payload
      const payload = JwtService.verifyToken(token)

      // Find user in database
      const user = await User.findById(payload.userId)
      if (!user) {
        return response.status(401).json({
          status: 'error',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        })
      }

      // Check if user is active
      if (!user.isActive) {
        return response.status(401).json({
          status: 'error',
          message: 'Account is deactivated',
          timestamp: new Date().toISOString(),
        })
      }

      // Add user to request context
      ctx.auth = {
        user,
        token: payload,
      }

      return await next()
    } catch (error) {
      return response.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
      })
    }
  }
}

/**
 * Extend HttpContext to include auth property
 */
declare module '@adonisjs/core/http' {
  interface HttpContext {
    auth?: {
      user: any
      token: {
        userId: string
        email: string
        role: string
      }
    }
  }
}
