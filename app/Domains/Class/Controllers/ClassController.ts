import type { HttpContext } from '@adonisjs/core/http'
import Class from '#domains/Class/Models/Class'
import {
  validateCreateClass,
  validateUpdateClass,
  validateClassQuery,
} from '#domains/Class/Validators/ClassValidator'

export default class ClassController {
  /**
   * Get all classes with pagination and filtering
   * GET /classes
   */
  async index({ request, response }: HttpContext) {
    try {
      const queryValidation = validateClassQuery(request.qs())
      if (!queryValidation.isValid) {
        return response.status(422).json({
          status: 'error',
          message: 'Invalid query parameters',
          errors: queryValidation.errors,
          timestamp: new Date().toISOString(),
        })
      }

      const { page, limit, search, status, grade, sortBy, sortOrder } = queryValidation.data!

      // Build query
      let query = Class.find()

      // Apply filters
      if (status !== undefined) {
        query = query.where('status', status)
      }

      if (grade !== undefined) {
        query = query.where('grade', grade)
      }

      if (search) {
        query = query.or([{ name: { $regex: search, $options: 'i' } }])
      }

      // Execute query with pagination
      const skip = (page - 1) * limit
      const sortDirection = sortOrder === 'asc' ? 1 : -1

      const classes = await query
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)

      // Get total count for pagination
      const total = await Class.countDocuments(query.getQuery())
      const totalPages = Math.ceil(total / limit)

      return response.json({
        status: 'success',
        message: 'Classes retrieved successfully',
        data: {
          classes,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching classes:', error)
      return response.status(500).json({
        status: 'error',
        message: 'An error occurred while fetching classes',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get class statistics
   * GET /classes/stats
   */
  async stats({ response }: HttpContext) {
    try {
      const total = await Class.countDocuments()
      const active = await Class.countDocuments({ status: true })
      const inactive = await Class.countDocuments({ status: false })

      // Count by grade
      const gradeStats = await Class.aggregate([
        {
          $group: {
            _id: '$grade',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])

      return response.json({
        status: 'success',
        message: 'Class statistics retrieved successfully',
        data: {
          total,
          active,
          inactive,
          byGrade: gradeStats.map((stat) => ({
            grade: stat._id,
            count: stat.count,
          })),
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching class statistics:', error)
      return response.status(500).json({
        status: 'error',
        message: 'An error occurred while fetching class statistics',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get a list of classes (simplified for dropdowns)
   * GET /classes/list
   */
  async list({ request, response }: HttpContext) {
    try {
      const { status } = request.qs()

      let query = Class.find()

      if (status !== undefined) {
        query = query.where('status', status === 'true')
      }

      const classes = await query.select('name status grade').sort({ grade: 1, name: 1 })

      return response.json({
        status: 'success',
        message: 'Class list retrieved successfully',
        data: classes,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching class list:', error)
      return response.status(500).json({
        status: 'error',
        message: 'An error occurred while fetching class list',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Create a new class
   * POST /classes
   */
  async store({ request, response }: HttpContext) {
    try {
      const validation = validateCreateClass(request.body())
      if (!validation.isValid) {
        return response.status(422).json({
          status: 'error',
          message: 'Validation failed',
          errors: validation.errors,
          timestamp: new Date().toISOString(),
        })
      }

      const { name, status } = validation.data!

      // Check if class with same name already exists
      const existingClass = await Class.findOne({ name: new RegExp(`^${name}$`, 'i') })
      if (existingClass) {
        return response.status(409).json({
          status: 'error',
          message: 'Class with this name already exists',
          errors: [{ field: 'name', message: 'A class with this name already exists' }],
          timestamp: new Date().toISOString(),
        })
      }

      const newClass = new Class({
        name,
        status,
      })

      await newClass.save()

      return response.status(201).json({
        status: 'success',
        message: 'Class created successfully',
        data: newClass,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error creating class:', error)
      return response.status(500).json({
        status: 'error',
        message: 'An error occurred while creating the class',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get a single class
   * GET /classes/:id
   */
  async show({ params, response }: HttpContext) {
    try {
      const classItem = await Class.findById(params.id)

      if (!classItem) {
        return response.status(404).json({
          status: 'error',
          message: 'Class not found',
          timestamp: new Date().toISOString(),
        })
      }

      return response.json({
        status: 'success',
        message: 'Class retrieved successfully',
        data: classItem,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching class:', error)
      return response.status(500).json({
        status: 'error',
        message: 'An error occurred while fetching the class',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Update a class
   * PUT /classes/:id
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const classItem = await Class.findById(params.id)

      if (!classItem) {
        return response.status(404).json({
          status: 'error',
          message: 'Class not found',
          timestamp: new Date().toISOString(),
        })
      }

      const validation = validateUpdateClass(request.body())
      if (!validation.isValid) {
        return response.status(422).json({
          status: 'error',
          message: 'Validation failed',
          errors: validation.errors,
          timestamp: new Date().toISOString(),
        })
      }

      const updateData = validation.data!

      // Check if another class with same name already exists (if name is being updated)
      if (updateData.name && updateData.name !== classItem.name) {
        const existingClass = await Class.findOne({
          name: new RegExp(`^${updateData.name}$`, 'i'),
          _id: { $ne: params.id },
        })

        if (existingClass) {
          return response.status(409).json({
            status: 'error',
            message: 'Class with this name already exists',
            errors: [{ field: 'name', message: 'A class with this name already exists' }],
            timestamp: new Date().toISOString(),
          })
        }
      }

      Object.assign(classItem, updateData)
      await classItem.save()

      return response.json({
        status: 'success',
        message: 'Class updated successfully',
        data: classItem,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error updating class:', error)
      return response.status(500).json({
        status: 'error',
        message: 'An error occurred while updating the class',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Delete a class
   * DELETE /classes/:id
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const classItem = await Class.findById(params.id)

      if (!classItem) {
        return response.status(404).json({
          status: 'error',
          message: 'Class not found',
          timestamp: new Date().toISOString(),
        })
      }

      await Class.findByIdAndDelete(params.id)

      return response.json({
        status: 'success',
        message: 'Class deleted successfully',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error deleting class:', error)

      return response.status(500).json({
        status: 'error',
        message: 'An error occurred while deleting the class',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Restore a soft-deleted class (if soft delete is implemented)
   * PATCH /classes/:id/restore
   */
  async restore({ params, response }: HttpContext) {
    try {
      const classItem = await Class.findById(params.id)

      if (!classItem) {
        return response.status(404).json({
          status: 'error',
          message: 'Class not found',
          timestamp: new Date().toISOString(),
        })
      }

      classItem.status = true
      await classItem.save()

      return response.json({
        status: 'success',
        message: 'Class restored successfully',
        data: classItem,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error restoring class:', error)

      return response.status(500).json({
        status: 'error',
        message: 'An error occurred while restoring the class',
        timestamp: new Date().toISOString(),
      })
    }
  }
}
