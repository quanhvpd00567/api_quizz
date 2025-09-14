import type { HttpContext } from '@adonisjs/core/http'
import User from '#domains/Auth/Models/User'
import JwtService, { JwtPayload } from '#domains/Auth/Services/JwtService'

export default class AuthController {
  /**
   * Admin login endpoint
   * POST /auth/admin/login
   */
  async adminLogin({ request, response }: HttpContext) {
    try {
      const { email, password } = request.only(['email', 'password'])

      // Basic validation
      if (!email || !password) {
        return response.status(422).json({
          status: 'error',
          message: 'Email and password are required',
          timestamp: new Date().toISOString(),
        })
      }

      // Find user by email or username with password field
      const user = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: email.toLowerCase() }],
      }).select('+password')

      if (!user) {
        return response.status(401).json({
          status: 'error',
          message: 'Invalid credentials',
          timestamp: new Date().toISOString(),
        })
      }

      // Check if user is administrator
      // if (user.role !== UserRole.ADMINISTRATOR) {
      //   return response.status(403).json({
      //     status: 'error',
      //     message: 'Access denied. Administrator access required.',
      //     timestamp: new Date().toISOString(),
      //   })
      // }

      // Check if account is active
      if (!user.isActive) {
        return response.status(401).json({
          status: 'error',
          message: 'Account is deactivated',
          timestamp: new Date().toISOString(),
        })
      }

      const isPasswordValid = await user.comparePassword(password)
      if (!isPasswordValid) {
        // Increment failed login attempts
        await user.incrementLoginAttempts()
        return response.status(401).json({
          status: 'error',
          message: 'Invalid credentials',
          timestamp: new Date().toISOString(),
        })
      }

      // Reset login attempts on successful login
      user.loginAttempts = 0
      user.lockUntil = undefined
      user.lastLoginAt = new Date()
      await user.save()

      // Generate JWT token
      const payload: JwtPayload = {
        userId: user._id?.toString() || '',
        email: user.email,
        role: user.role,
      }
      const token = JwtService.generateToken(payload)

      return response.ok({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            id: user._id?.toString() || '',
            email: user.email,
            name: user.getFullName(),
            role: user.role,
            lastLoginAt: user.lastLoginAt,
          },
          token,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.status(500).json({
        status: 'error',
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Admin logout endpoint
   * POST /auth/admin/logout
   */
  async adminLogout({ response }: HttpContext) {
    return response.ok({
      status: 'success',
      message: 'Logout successful',
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Get current authenticated admin user
   * GET /auth/admin/me
   */
  async adminMe({ response, auth }: HttpContext) {
    try {
      if (!auth?.user) {
        return response.status(401).json({
          status: 'error',
          message: 'Not authenticated',
          timestamp: new Date().toISOString(),
        })
      }

      const user = auth.user

      return response.ok({
        status: 'success',
        data: {
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.getFullName(),
            role: user.role,
            isActive: user.isActive,
            isEmailVerified: user.isEmailVerified,
            lastLoginAt: user.lastLoginAt,
            preferences: user.preferences,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Admin me error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
      })
    }
  }
}
