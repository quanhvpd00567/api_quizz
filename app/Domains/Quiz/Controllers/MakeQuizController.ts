import type { HttpContext } from '@adonisjs/core/http'
// import Quiz from '#domains/Quiz/Models/Quiz'
// import Subject from '#domains/Subject/Models/Subject'
// import Question from '#domains/Question/Models/Question'
// import {
//   validateCreateQuiz,
//   validateUpdateQuiz,
//   validateQuizQuery,
// } from '#domains/Quiz/Validators/QuizValidator'
import MakeQuizService from '#domains/Quiz/Services/MakeQuizService'
import mongoose from 'mongoose'

export default class MakeQuizController {
  public async makeQuiz({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const body = request.body()

      const result = await MakeQuizService.makeQuiz(
        id,
        body,
        new mongoose.Types.ObjectId('68a04f99b40ee20a436cf0d9')
      ) // Replace with actual student ID

      return response.ok({
        status: 'success',
        data: result,
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

  public async historyQuiz({ params, response }: HttpContext) {
    try {
      const { id } = params
      const result = await MakeQuizService.getQuizResults(
        id,
        new mongoose.Types.ObjectId('68a04f99b40ee20a436cf0d9')
      ) // Replace with actual student ID

      return response.ok({
        status: 'success',
        data: result,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Get quiz history error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to retrieve quiz history',
        timestamp: new Date().toISOString(),
      })
    }
  }
}
