import type { HttpContext } from '@adonisjs/core/http'
import Question from '#domains/Question/Models/Question'
import {
  validateCreateQuestion,
  validateUpdateQuestion,
  validateQuestionQuery,
} from '#domains/Question/Validators/QuestionValidator'

export default class QuestionController {
  /**
   * Get all questions with pagination and filtering
   * GET /questions
   */
  async index({ request, response }: HttpContext) {
    try {
      const queryValidation = validateQuestionQuery(request.qs())
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
        type,
        difficulty,
        subject,
        class: classFilter,
        tags,
        isActive,
        sortBy,
        sortOrder,
      } = queryValidation.data!

      // Build query
      let query = Question.find()

      // Apply filters
      if (isActive !== undefined) {
        query = query.where('isActive', isActive)
      }

      if (type) {
        query = query.where('type', type)
      }

      if (difficulty) {
        query = query.where('difficulty', difficulty)
      }

      if (subject) {
        query = query.where('subject', subject)
      }

      if (classFilter) {
        query = query.where('class', classFilter)
      }

      if (tags && tags.length > 0) {
        query = query.where('tags').in(tags)
      }

      if (search) {
        query = query.or([
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ])
      }

      // Execute query with pagination
      const skip = (page - 1) * limit
      const sortDirection = sortOrder === 'asc' ? 1 : -1

      const questions = await query
        .populate('subject', 'name code')
        .populate('createdBy', 'username email')
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)

      // Get total count for pagination
      const total = await Question.countDocuments(query.getQuery())

      return response.ok({
        status: 'success',
        data: {
          questions,
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
      console.error('Get questions error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to retrieve questions',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get question by ID
   * GET /questions/:id
   */
  async show({ params, response }: HttpContext) {
    try {
      const { id } = params

      const question = await Question.findById(id)
        .populate('subject', 'name code')
        .populate('createdBy', 'username email')

      if (!question) {
        return response.status(404).json({
          status: 'error',
          message: 'Question not found',
          timestamp: new Date().toISOString(),
        })
      }

      return response.ok({
        status: 'success',
        data: { question },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Get question error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to retrieve question',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Create a new question
   * POST /questions
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const body = request.body()
      body.explanation = body.explanation || ''

      // Validate request data
      const validation = validateCreateQuestion(body)
      if (!validation.isValid) {
        console.log('Validation errors:', validation.errors)

        return response.status(422).json({
          status: 'error',
          message: 'Validation failed',
          errors: validation.errors,
          timestamp: new Date().toISOString(),
        })
      }

      const payload = validation.data!

      // Add created by user if authenticated
      if (auth?.user) {
        payload.createdBy = auth.user.id as any
      }

      // Create question
      const question = new Question(payload)
      await question.save()

      // Populate references for response
      await question.populate('subject', 'name code')
      await question.populate('createdBy', 'username email')

      console.log(`New question created: ${question.title} (${question.type})`)

      return response.status(201).json({
        status: 'success',
        message: 'Question created successfully',
        data: { question },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error('Create question error:', error)

      return response.status(500).json({
        status: 'error',
        message: 'Failed to create question',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Update question
   * PUT /questions/:id
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const body = request.body()

      // Validate request data
      const validation = validateUpdateQuestion(body)
      if (!validation.isValid) {
        return response.status(422).json({
          status: 'error',
          message: 'Validation failed',
          errors: validation.errors,
          timestamp: new Date().toISOString(),
        })
      }

      const payload = validation.data!

      const question = await Question.findById(id)

      if (!question) {
        return response.status(404).json({
          status: 'error',
          message: 'Question not found',
          timestamp: new Date().toISOString(),
        })
      }

      // Update question
      Object.assign(question, payload)
      await question.save()

      // Populate references for response
      await question.populate('subject', 'name code')
      await question.populate('createdBy', 'username email')

      console.log(`Question updated: ${question.title} (${question.type})`)

      return response.ok({
        status: 'success',
        message: 'Question updated successfully',
        data: { question },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Update question error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to update question',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Delete question (soft delete)
   * DELETE /questions/:id
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const { id } = params

      const question = await Question.findById(id)

      if (!question) {
        return response.status(404).json({
          status: 'error',
          message: 'Question not found',
          timestamp: new Date().toISOString(),
        })
      }

      // Soft delete by deactivating question
      question.isActive = false
      await question.save()

      console.log(`Question deactivated: ${question.title} (${question.type})`)

      return response.ok({
        status: 'success',
        message: 'Question deleted successfully',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Delete question error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to delete question',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Restore deactivated question
   * PATCH /questions/:id/restore
   */
  async restore({ params, response }: HttpContext) {
    try {
      const { id } = params

      const question = await Question.findById(id)

      if (!question) {
        return response.status(404).json({
          status: 'error',
          message: 'Question not found',
          timestamp: new Date().toISOString(),
        })
      }

      // Restore question
      question.isActive = true
      await question.save()

      console.log(`Question restored: ${question.title} (${question.type})`)

      return response.ok({
        status: 'success',
        message: 'Question restored successfully',
        data: { question },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Restore question error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to restore question',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Bulk operations on questions
   * POST /questions/bulk
   */
  async bulk({ request, response }: HttpContext) {
    try {
      const { action, questionIds, data } = request.body()

      if (!action || !questionIds || !Array.isArray(questionIds)) {
        return response.status(422).json({
          status: 'error',
          message: 'Action and questionIds are required',
          timestamp: new Date().toISOString(),
        })
      }

      let result
      switch (action) {
        case 'activate':
          result = await Question.updateMany({ _id: { $in: questionIds } }, { isActive: true })
          break

        case 'deactivate':
          result = await Question.updateMany({ _id: { $in: questionIds } }, { isActive: false })
          break

        case 'delete':
          result = await Question.deleteMany({ _id: { $in: questionIds } })
          break

        case 'update':
          if (!data) {
            return response.status(422).json({
              status: 'error',
              message: 'Data is required for update action',
              timestamp: new Date().toISOString(),
            })
          }
          result = await Question.updateMany({ _id: { $in: questionIds } }, data)
          break

        default:
          return response.status(422).json({
            status: 'error',
            message: 'Invalid action. Supported actions: activate, deactivate, delete, update',
            timestamp: new Date().toISOString(),
          })
      }

      return response.ok({
        status: 'success',
        message: `Bulk ${action} completed successfully`,
        data: {
          affected: result.modifiedCount || result.deletedCount || 0,
          total: questionIds.length,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Bulk questions error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to perform bulk operation',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get question statistics
   * GET /questions/stats
   */
  async stats({ response }: HttpContext) {
    try {
      const [total, active, byType, byDifficulty, totalTags] = await Promise.all([
        Question.countDocuments(),
        Question.countDocuments({ isActive: true }),
        Question.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
        Question.aggregate([{ $group: { _id: '$difficulty', count: { $sum: 1 } } }]),
        Question.aggregate([
          { $unwind: '$tags' },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
      ])

      return response.ok({
        status: 'success',
        data: {
          total,
          active,
          inactive: total - active,
          byType: byType.reduce((acc, item) => {
            acc[item._id] = item.count
            return acc
          }, {}),
          byDifficulty: byDifficulty.reduce((acc, item) => {
            acc[item._id] = item.count
            return acc
          }, {}),
          popularTags: totalTags,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Get question stats error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to retrieve question statistics',
        timestamp: new Date().toISOString(),
      })
    }
  }
}
