import type { HttpContext } from '@adonisjs/core/http'
import Subject from '#domains/Subject/Models/Subject'
import {
  validateCreateSubject,
  validateUpdateSubject,
  validateSubjectQuery,
} from '#domains/Subject/Validators/SubjectValidator'

export default class SubjectController {
  /**
   * Get all subjects with pagination and filtering
   * GET /subjects
   */
  async index({ request, response }: HttpContext) {
    try {
      const queryValidation = validateSubjectQuery(request.qs())
      if (!queryValidation.isValid) {
        return response.status(422).json({
          status: 'error',
          message: 'Invalid query parameters',
          errors: queryValidation.errors,
          timestamp: new Date().toISOString(),
        })
      }

      const {
        page,
        limit,
        search,
        isActive,
        class: classFilter,
        sortBy,
        sortOrder,
      } = queryValidation.data!

      // Build query
      let query = Subject.find()

      // Apply filters
      if (isActive !== undefined) {
        query = query.where('isActive', isActive)
      }

      if (classFilter) {
        query = query.where('class', { $in: [classFilter] })
      }

      if (search) {
        query = query.or([
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ])
      }

      // Execute query with pagination
      const skip = (page - 1) * limit
      const sortDirection = sortOrder === 'asc' ? 1 : -1

      const subjects = await query
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)

      // Get total count for pagination
      const total = await Subject.countDocuments(query.getQuery())

      return response.ok({
        status: 'success',
        data: {
          subjects,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Get subjects error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to retrieve subjects',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get subject by ID
   * GET /subjects/:id
   */
  async show({ params, response }: HttpContext) {
    try {
      const { id } = params

      const subject = await Subject.findById(id)

      if (!subject) {
        return response.status(404).json({
          status: 'error',
          message: 'Subject not found',
          timestamp: new Date().toISOString(),
        })
      }

      return response.ok({
        status: 'success',
        data: { subject },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Get subject error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to retrieve subject',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Create a new subject
   * POST /subjects
   */
  async store({ request, response }: HttpContext) {
    try {
      const body = request.body()
      body.description = body.description || '' // Ensure description is always a string
      // Validate request data
      const validation = validateCreateSubject(body)
      if (!validation.isValid) {
        return response.status(422).json({
          status: 'error',
          message: 'Validation failed',
          errors: validation.errors,
          timestamp: new Date().toISOString(),
        })
      }

      const payload = validation.data!

      // Check if subject with same name or code already exists
      const existingSubject = await Subject.findOne({
        $or: [
          { name: { $regex: `^${payload.name}$`, $options: 'i' } },
          { code: payload.code.toUpperCase() },
        ],
      })

      if (existingSubject) {
        return response.status(422).json({
          status: 'error',
          message: 'Subject with this name or code already exists',
          timestamp: new Date().toISOString(),
        })
      }

      // Create subject
      const subject = new Subject(payload)
      await subject.save()

      console.log(`New subject created: ${subject.name} (${subject.code})`)

      return response.status(201).json({
        status: 'success',
        message: 'Subject created successfully',
        data: { subject },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error('Create subject error:', error)

      if (error.code === 11000) {
        return response.status(422).json({
          status: 'error',
          message: 'Subject with this name or code already exists',
          timestamp: new Date().toISOString(),
        })
      }

      return response.status(500).json({
        status: 'error',
        message: 'Failed to create subject',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Update subject
   * PUT /subjects/:id
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const body = request.body()
      body.description = body.description || '' // Ensure description is always a string

      // Validate request data
      const validation = validateUpdateSubject(body)
      if (!validation.isValid) {
        return response.status(422).json({
          status: 'error',
          message: 'Validation failed',
          errors: validation.errors,
          timestamp: new Date().toISOString(),
        })
      }

      const payload = validation.data!

      const subject = await Subject.findById(id)

      if (!subject) {
        return response.status(404).json({
          status: 'error',
          message: 'Subject not found',
          timestamp: new Date().toISOString(),
        })
      }

      // Check for name/code conflicts with other subjects
      if (payload.name || payload.code) {
        const conditions = []
        if (payload.name) {
          conditions.push({ name: { $regex: `^${payload.name}$`, $options: 'i' } })
        }
        if (payload.code) {
          conditions.push({ code: payload.code.toUpperCase() })
        }

        const existingSubject = await Subject.findOne({
          _id: { $ne: id },
          $or: conditions,
        })

        if (existingSubject) {
          return response.status(422).json({
            status: 'error',
            message: 'Subject with this name or code already exists',
            timestamp: new Date().toISOString(),
          })
        }
      }

      // Update subject
      Object.assign(subject, payload)
      await subject.save()

      return response.ok({
        status: 'success',
        message: 'Subject updated successfully',
        data: { subject },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Update subject error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to update subject',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Delete subject (soft delete)
   * DELETE /subjects/:id
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const { id } = params

      const subject = await Subject.findById(id)

      if (!subject) {
        return response.status(404).json({
          status: 'error',
          message: 'Subject not found',
          timestamp: new Date().toISOString(),
        })
      }

      // Soft delete by deactivating subject
      subject.isActive = false
      await subject.save()

      console.log(`Subject deactivated: ${subject.name} (${subject.code})`)

      return response.ok({
        status: 'success',
        message: 'Subject deleted successfully',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Delete subject error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to delete subject',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Restore deactivated subject
   * PATCH /subjects/:id/restore
   */
  async restore({ params, response }: HttpContext) {
    try {
      const { id } = params

      const subject = await Subject.findById(id)

      if (!subject) {
        return response.status(404).json({
          status: 'error',
          message: 'Subject not found',
          timestamp: new Date().toISOString(),
        })
      }

      subject.isActive = true
      await subject.save()

      console.log(`Subject restored: ${subject.name} (${subject.code})`)

      return response.ok({
        status: 'success',
        message: 'Subject restored successfully',
        data: { subject },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Restore subject error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to restore subject',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get subject statistics
   * GET /subjects/stats
   */
  async stats({ response }: HttpContext) {
    try {
      const stats = await Promise.all([
        Subject.countDocuments({ isActive: true }),
        Subject.countDocuments({ isActive: false }),
        Subject.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: null, totalCourses: { $sum: '$totalCourses' } } },
        ]),
        Subject.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: null, totalStudents: { $sum: '$totalStudents' } } },
        ]),
      ])

      const [activeSubjects, inactiveSubjects, totalCoursesResult, totalStudentsResult] = stats

      const totalCourses = totalCoursesResult[0]?.totalCourses || 0
      const totalStudents = totalStudentsResult[0]?.totalStudents || 0

      return response.ok({
        status: 'success',
        data: {
          total: activeSubjects + inactiveSubjects,
          active: activeSubjects,
          inactive: inactiveSubjects,
          totalCourses,
          totalStudents,
          averageCoursesPerSubject:
            activeSubjects > 0 ? Math.round((totalCourses / activeSubjects) * 100) / 100 : 0,
          averageStudentsPerSubject:
            activeSubjects > 0 ? Math.round((totalStudents / activeSubjects) * 100) / 100 : 0,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Get subject stats error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to retrieve subject statistics',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get subjects list for dropdowns (simplified response)
   * GET /subjects/list
   */
  async list({ request, response }: HttpContext) {
    try {
      const isActive = request.input('isActive', 'true') === 'true'

      const subjects = await Subject.find({ isActive })
        .select('id name code color icon')
        .sort({ name: 1 })

      return response.ok({
        status: 'success',
        data: { subjects },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.status(500).json({
        status: 'error',
        message: 'Failed to retrieve subjects list',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get subjects by class/grade level
   * GET /subjects/class/:classCode
   */
  async getByClass({ params, response }: HttpContext) {
    try {
      const { classCode } = params

      if (!classCode) {
        return response.status(400).json({
          status: 'error',
          message: 'Class code is required',
          timestamp: new Date().toISOString(),
        })
      }

      console.log(`Fetching subjects for class: ${classCode}`)

      // Find subjects that are applicable to the specified class
      // This assumes subjects have a 'classes' field that contains applicable grade levels
      const subjects = await Subject.find({
        isActive: true,
        $or: [{ class: { $in: [classCode] } }],
      })
        .select('id name code color icon description')
        .sort({ name: 1 })

      return response.ok({
        status: 'success',
        data: subjects,
        meta: {
          classCode,
          count: subjects.length,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Get subjects by class error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to retrieve subjects for the specified class',
        timestamp: new Date().toISOString(),
      })
    }
  }
}
