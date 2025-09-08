import type { HttpContext } from '@adonisjs/core/http'
import User, { UserRole } from '#domains/Auth/Models/User'
import { validateCreateUser, validateUpdateUser } from '#domains/Auth/Validators/UserValidator'
import bcrypt from 'bcryptjs'

export default class UserController {
  /**
   * Get all users with pagination and filtering
   * GET /users
   */
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 10)
      const role = request.input('role')
      const search = request.input('search')
      const isActive = request.input('isActive')

      // Build query
      let query = User.find()

      // Apply filters
      if (role) {
        query = query.where('role', role)
      }

      if (isActive !== undefined && isActive !== '') {
        query = query.where('isActive', isActive === 'true')
      }

      if (search) {
        query = query.or([
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
        ])
      }

      // Execute query with pagination
      const skip = (page - 1) * limit
      const users = await query
        .select('-password -passwordResetToken -emailVerificationToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number.parseInt(limit))

      // Get total count for pagination
      const total = await User.countDocuments(query.getQuery())

      return response.ok({
        status: 'success',
        data: {
          users,
          pagination: {
            page: Number.parseInt(page),
            limit: Number.parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Get users error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to retrieve users',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get user by ID
   * GET /users/:id
   */
  async show({ params, response }: HttpContext) {
    try {
      const { id } = params

      const user = await User.findById(id).select(
        '-password -passwordResetToken -emailVerificationToken'
      )

      if (!user) {
        return response.status(404).json({
          status: 'error',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        })
      }

      return response.ok({
        status: 'success',
        data: { user },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Get user error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to retrieve user',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Create a new user
   * POST /users
   */
  async store({ request, response }: HttpContext) {
    try {
      const body = request.body()
      // Validate request data
      const validation = validateCreateUser(body)
      if (!validation.isValid) {
        return response.status(422).json({
          status: 'error',
          message: 'Validation failed',
          errors: validation.errors,
          timestamp: new Date().toISOString(),
        })
      }

      const payload = validation.data!

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: payload.email }, { username: payload.username }],
      })

      if (existingUser) {
        return response.status(422).json({
          status: 'error',
          message: 'User with this email or username already exists',
          timestamp: new Date().toISOString(),
        })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(payload.password, 12)

      // Create user
      const user = new User({
        ...payload,
        password: hashedPassword,
        isActive: payload.isActive ?? true,
        isEmailVerified: payload.isEmailVerified ?? false,
      })

      await user.save()

      // Return user without password
      const userResponse = { ...user.toJSON() }
      if ('password' in userResponse) {
        delete (userResponse as any).password
      }

      console.log(`New user created: ${user.email} with role ${user.role}`)

      return response.status(201).json({
        status: 'success',
        message: 'User created successfully',
        data: { user: userResponse },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error('Create user error:', error)

      if (error.code === 11000) {
        return response.status(422).json({
          status: 'error',
          message: 'User with this email or username already exists',
          timestamp: new Date().toISOString(),
        })
      }

      return response.status(500).json({
        status: 'error',
        message: 'Failed to create user',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Update user
   * PUT /users/:id
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const body = request.body()

      // Validate request data
      const validation = validateUpdateUser(body)
      if (!validation.isValid) {
        return response.status(422).json({
          status: 'error',
          message: 'Validation failed',
          errors: validation.errors,
          timestamp: new Date().toISOString(),
        })
      }

      const payload = validation.data!

      const user = await User.findById(id)

      if (!user) {
        return response.status(404).json({
          status: 'error',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        })
      }

      // Check for email/username conflicts with other users
      if (payload.email || payload.username) {
        const existingUser = await User.findOne({
          _id: { $ne: id },
          $or: [
            ...(payload.email ? [{ email: payload.email }] : []),
            ...(payload.username ? [{ username: payload.username }] : []),
          ],
        })

        if (existingUser) {
          return response.status(422).json({
            status: 'error',
            message: 'User with this email or username already exists',
            timestamp: new Date().toISOString(),
          })
        }
      }

      // Handle password update
      if (payload.password) {
        payload.password = await bcrypt.hash(payload.password, 12)
      }

      // Update user
      Object.assign(user, payload)
      await user.save()

      // Return user without password
      const userResponse = { ...user.toJSON() }
      if ('password' in userResponse) {
        delete (userResponse as any).password
      }

      console.log(`User updated: ${user.email}`)

      return response.ok({
        status: 'success',
        message: 'User updated successfully',
        data: { user: userResponse },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Update user error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to update user',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Delete user (soft delete)
   * DELETE /users/:id
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const { id } = params

      const user = await User.findById(id)

      if (!user) {
        return response.status(404).json({
          status: 'error',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        })
      }

      // Soft delete by deactivating user
      user.isActive = false
      await user.save()

      console.log(`User deactivated: ${user.email}`)

      return response.ok({
        status: 'success',
        message: 'User deleted successfully',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Delete user error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to delete user',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Restore deactivated user
   * PATCH /users/:id/restore
   */
  async restore({ params, response }: HttpContext) {
    try {
      const { id } = params

      const user = await User.findById(id)

      if (!user) {
        return response.status(404).json({
          status: 'error',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        })
      }

      user.isActive = true
      await user.save()

      console.log(`User restored: ${user.email}`)

      return response.ok({
        status: 'success',
        message: 'User restored successfully',
        data: { user: user.toJSON() },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Restore user error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to restore user',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get user statistics
   * GET /users/stats
   */
  async stats({ response }: HttpContext) {
    try {
      const stats = await Promise.all([
        User.countDocuments({ isActive: true }),
        User.countDocuments({ isActive: false }),
        User.countDocuments({ role: UserRole.ADMINISTRATOR }),
        User.countDocuments({ role: UserRole.PARENT }),
        User.countDocuments({ role: UserRole.STUDENT }),
        User.countDocuments({ isEmailVerified: true }),
        User.countDocuments({ isEmailVerified: false }),
      ])

      const [
        activeUsers,
        inactiveUsers,
        administrators,
        parents,
        students,
        verifiedUsers,
        unverifiedUsers,
      ] = stats

      return response.ok({
        status: 'success',
        data: {
          total: activeUsers + inactiveUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          roles: {
            administrators,
            parents,
            students,
          },
          emailVerification: {
            verified: verifiedUsers,
            unverified: unverifiedUsers,
          },
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Get user stats error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to retrieve user statistics',
        timestamp: new Date().toISOString(),
      })
    }
  }
}
