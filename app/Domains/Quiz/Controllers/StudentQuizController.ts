import StudentQuizService from '#domains/Quiz/Services/StudentQuizService'
import { HttpContext } from '@adonisjs/core/http'
import StudentQuiz from '#domains/Quiz/Models/StudentQuiz'
import Quiz from '#domains/Quiz/Models/Quiz'
import Subject from '#domains/Subject/Models/Subject'
import Question from '#domains/Question/Models/Question'
import mongoose from 'mongoose'

export default class StudentQuizController {
  // Get quizzes assigned to a student
  public async getQuizzes({ params, response }: any) {
    try {
      const { studentId } = params
      const result = await StudentQuizService.getQuizzesForStudent(studentId)
      return response.ok(result)
    } catch (error) {
      console.error('Get quizzes error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Không thể lấy danh sách bài kiểm tra',
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Update quiz status to in_progress
  public async updateQuizStatusStart({ params, response }: any) {
    try {
      const { studentQuizId } = params
      const result = await StudentQuizService.updateQuizStatus(studentQuizId, 'in_progress')
      if (!result) {
        return response.status(404).json({
          status: 'error',
          message: 'Bài kiểm tra không tìm thấy hoặc không thể cập nhật trạng thái',
          timestamp: new Date().toISOString(),
        })
      }
      return response.ok({
        status: 'success',
        message: 'Cập nhật trạng thái bài kiểm tra thành công',
        data: result,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Update quiz status error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Không thể cập nhật trạng thái bài kiểm tra',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get quiz by ID
   * GET /quizzes/:id
   */
  public async showQuiz({ params, response }: HttpContext) {
    try {
      const { studentQuizId } = params
      // get student quiz by id
      const studentQuiz = await StudentQuiz.findById(studentQuizId)
      if (!studentQuiz || !studentQuiz?.quizz) {
        return response.status(404).json({
          status: 'error',
          message: 'Student quiz not found',
          timestamp: new Date().toISOString(),
        })
      }

      const quiz = await Quiz.findById(studentQuiz?.quizz._id)
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
}
