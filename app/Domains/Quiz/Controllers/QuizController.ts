import type { HttpContext } from '@adonisjs/core/http'
import Quiz from '#domains/Quiz/Models/Quiz'
import Subject from '#domains/Subject/Models/Subject'
import Question from '#domains/Question/Models/Question'
import QuizService from '#domains/Quiz/Services/QuizService'

import {
  validateCreateQuiz,
  validateUpdateQuiz,
  validateQuizQuery,
} from '#domains/Quiz/Validators/QuizValidator'
import { log } from 'node:console'

export default class QuizController {
  /**
   * Get all quizzes with pagination and filtering
   * GET /quizzes
   */
  async index({ request, response }: HttpContext) {
    try {
      const params = request.qs()
      if (!params.status) {
        delete params.status
      }
      if (!params.class) {
        delete params.class
      }
      const queryValidation = validateQuizQuery(params)
      console.log(queryValidation, params, 1)

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
        difficulty,
        instructor,
        subject,
        class: classFilter,
        isPublic,
        sortBy,
        sortOrder,
      } = queryValidation.data!

      // Build query
      let query = Quiz.find()

      // Apply filters
      if (isActive !== undefined) {
        query = query.where('isActive', isActive)
      }

      if (difficulty) {
        query = query.where('difficulty', difficulty)
      }

      if (instructor) {
        // query = query.where('instructor', instructor)
      }

      if (subject) {
        query = query.where('subject', subject)
      }

      if (classFilter) {
        query = query.where('class', classFilter)
      }

      if (isPublic !== undefined) {
        query = query.where('isPublic', isPublic)
      }

      if (search) {
        query = query.or([
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
        ])
      }

      // Execute query with pagination
      const skip = (page - 1) * limit
      const sortDirection = sortOrder === 'asc' ? 1 : -1

      const quizzes = await query
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'subject', model: Subject, select: 'name code' }) // Populate subject details

      // Get total count for pagination
      const total = await Quiz.countDocuments(query.getQuery())

      return response.ok({
        status: 'success',
        data: {
          quizzes,
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
      console.error('Get quizzes error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to retrieve quizzes',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get quiz by ID
   * GET /quizzes/:id
   */
  async show({ params, response }: HttpContext) {
    try {
      const { id } = params

      log('Fetching quiz with ID:', id) // Debug log

      const quiz = await Quiz.findById(id)
        .populate({
          path: 'subject',
          model: Subject,
          select: 'name code',
        })
        // k show filed answer isCorrect
        .populate({
          path: 'questions',
          model: Question,
          select: '-answers.isCorrect',
        })

      if (!quiz) {
        return response.status(404).json({
          status: 'error',
          message: 'Quiz not found',
          timestamp: new Date().toISOString(),
        })
      }

      return response.ok({
        status: 'success',
        data: { quiz },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Get quiz error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to retrieve quiz',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Create a new quiz
   * POST /quizzes
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const body = request.body()
      body.description = body.description || ''
      // Validate request data
      const validation = validateCreateQuiz(body)
      if (!validation.isValid) {
        console.log(validation.errors)
        return response.status(422).json({
          status: 'error',
          message: 'Validation failed',
          errors: validation.errors,
          timestamp: new Date().toISOString(),
        })
      }

      const payload = validation.data!

      payload.createdBy = auth?.user?.id

      // Check if quiz with same title already exists for this instructor
      const existingQuiz = await Quiz.findOne({
        title: { $regex: `^${payload.title}$`, $options: 'i' },
        createdBy: payload.createdBy,
      })
      if (existingQuiz) {
        return response.status(422).json({
          status: 'error',
          message: 'Quiz with this title already exists',
          timestamp: new Date().toISOString(),
        })
      }
      // Create quiz
      const quiz = new Quiz(payload)
      if (payload.isQrCode) {
        const str = JSON.stringify({
          id: quiz._id,
        })
        const encoded = btoa(unescape(encodeURIComponent(str)))
        payload.dataQrCode = `http://localhost:3000/quizz/${encoded}`
        // update quiz with QR code data
        quiz.dataQrCode = payload.dataQrCode
      }

      await quiz.save()

      return response.status(201).json({
        status: 'success',
        message: 'Quiz created successfully',
        data: { quiz },
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error('Create quiz error:', error)

      return response.status(500).json({
        status: 'error',
        message: 'Failed to create quiz',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Update quiz
   * PUT /quizzes/:id
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const body = request.body()

      // Validate request data
      const validation = validateUpdateQuiz(body)
      if (!validation.isValid) {
        return response.status(422).json({
          status: 'error',
          message: 'Validation failed 111111',
          errors: validation.errors,
          timestamp: new Date().toISOString(),
        })
      }

      const payload = validation.data!

      const quiz = await Quiz.findById(id)

      if (!quiz) {
        return response.status(404).json({
          status: 'error',
          message: 'Quiz not found',
          timestamp: new Date().toISOString(),
        })
      }

      // Check for title conflicts with other quizzes from same instructor
      if (payload.title) {
        const existingQuiz = await Quiz.findOne({
          _id: { $ne: id },
          title: { $regex: `^${payload.title}$`, $options: 'i' },
          instructor: quiz.instructor,
        })

        if (existingQuiz) {
          return response.status(422).json({
            status: 'error',
            message: 'Quiz with this title already exists',
            timestamp: new Date().toISOString(),
          })
        }
      }

      // Update quiz
      Object.assign(quiz, payload)
      await quiz.save()

      // Populate references for response
      await quiz.populate('instructor', 'name email')

      console.log(`Quiz updated: ${quiz.title}`)

      return response.ok({
        status: 'success',
        message: 'Quiz updated successfully',
        data: { quiz },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Update quiz error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to update quiz',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Delete quiz (soft delete)
   * DELETE /quizzes/:id
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const { id } = params

      const quiz = await Quiz.findById(id)

      if (!quiz) {
        return response.status(404).json({
          status: 'error',
          message: 'Quiz not found',
          timestamp: new Date().toISOString(),
        })
      }

      // Soft delete by deactivating quiz
      quiz.isActive = false
      await quiz.save()

      console.log(`Quiz deactivated: ${quiz.title}`)

      return response.ok({
        status: 'success',
        message: 'Quiz deleted successfully',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Delete quiz error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to delete quiz',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Restore deactivated quiz
   * PATCH /quizzes/:id/restore
   */
  async restore({ params, response }: HttpContext) {
    try {
      const { id } = params

      const quiz = await Quiz.findById(id)

      if (!quiz) {
        return response.status(404).json({
          status: 'error',
          message: 'Quiz not found',
          timestamp: new Date().toISOString(),
        })
      }

      quiz.isActive = true
      await quiz.save()

      console.log(`Quiz restored: ${quiz.title}`)

      return response.ok({
        status: 'success',
        message: 'Quiz restored successfully',
        data: { quiz },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Restore quiz error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to restore quiz',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Add question to quiz
   * POST /quizzes/:id/questions
   */
  async addQuestion({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const { questionId } = request.body()

      const quiz = await Quiz.findById(id)

      if (!quiz) {
        return response.status(404).json({
          status: 'error',
          message: 'Quiz not found',
          timestamp: new Date().toISOString(),
        })
      }

      await quiz.addQuestion(questionId)

      return response.ok({
        status: 'success',
        message: 'Question added to quiz successfully',
        data: { quiz },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Add question to quiz error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to add question to quiz',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get quiz statistics
   * GET /quizzes/stats
   */
  async stats({ response }: HttpContext) {
    try {
      const stats = await Promise.all([
        Quiz.countDocuments({ isActive: true }),
        Quiz.countDocuments({ isActive: false }),
        Quiz.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: null, totalQuestions: { $sum: '$totalQuestions' } } },
        ]),
        Quiz.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: null, totalAttempts: { $sum: '$totalAttempts' } } },
        ]),
        Quiz.aggregate([
          { $match: { isActive: true, averageScore: { $gt: 0 } } },
          { $group: { _id: null, averageScore: { $avg: '$averageScore' } } },
        ]),
      ])

      const [
        activeQuizzes,
        inactiveQuizzes,
        totalQuestionsResult,
        totalAttemptsResult,
        averageScoreResult,
      ] = stats

      const totalQuestions = totalQuestionsResult[0]?.totalQuestions || 0
      const totalAttempts = totalAttemptsResult[0]?.totalAttempts || 0
      const averageScore = averageScoreResult[0]?.averageScore || 0

      return response.ok({
        status: 'success',
        data: {
          total: activeQuizzes + inactiveQuizzes,
          active: activeQuizzes,
          inactive: inactiveQuizzes,
          totalQuestions,
          totalAttempts,
          averageScore: Math.round(averageScore * 100) / 100,
          averageQuestionsPerQuiz:
            activeQuizzes > 0 ? Math.round((totalQuestions / activeQuizzes) * 100) / 100 : 0,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Get quiz stats error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to retrieve quiz statistics',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get quizzes list for dropdowns (simplified response)
   * GET /quizzes/list
   */
  async list({ request, response }: HttpContext) {
    try {
      const isActive = request.input('isActive', 'true') === 'true'
      const isPublic = request.input('isPublic', 'true') === 'true'

      const quizzes = await Quiz.find({ isActive, isPublic })
        .select('id title difficulty estimatedTime totalQuestions')
        .sort({ title: 1 })

      return response.ok({
        status: 'success',
        data: { quizzes },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Get quizzes list error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to retrieve quizzes list',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Assign quiz to students
   * POST /quizzes/:id/assign
   */
  async assignQuiz({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const { studentId } = request.body()
      const result = await QuizService.assignQuizToUser(id, studentId)
      return response.ok(result)
    } catch (error) {
      console.error('Assign quiz error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Không thể giao bài kiểm tra',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Generate quiz with AI
   * POST /quizzes/generate
   */
  async generateQuiz({ request, response, auth }: HttpContext) {
    try {
      const body = request.body()
      const result = await QuizService.generateQuizWithAI(body, auth)
      return response.ok(result)
    } catch (error) {
      console.error('Generate quiz with AI error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to generate quiz',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Save AI generated quiz
   * POST /quizzes/ai-save
   */
  async saveAiQuiz({ request, response }: HttpContext) {
    try {
      const body = request.body()
      console.log('Generate quiz request body:aaaaaaaa');
      const result = await QuizService.saveAiGeneratedQuiz(body)
      return response.status(200).json({
        status: 'success',
        data: result,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Save AI quiz error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to save AI quiz',
        timestamp: new Date().toISOString(),
      })
    }
  }
}
