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

export default class MakeQuizController {
  public async makeQuiz({ params, request, response, auth }: HttpContext) {
    try {
      const { id } = params
      const body = request.body()

      const result = await MakeQuizService.makeQuiz(id, body, auth?.user.id, {
        fullName: auth?.user.fullName,
      })

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

  public async historyQuiz({ params, request, response, auth }: HttpContext) {
    try {
      const { id } = params
      console.log(id)

      let childId = auth?.user.id
      if (auth?.user.role === 'parent') {
        const { child_id } = request.qs()
        childId = child_id
        console.log(childId)
        if (!childId) {
          return response.status(400).json({
            status: 'error',
            message: 'child_id is required for non-parent users',
            timestamp: new Date().toISOString(),
          })
        }
      }

      const result = await MakeQuizService.getQuizResults(id, childId)

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
