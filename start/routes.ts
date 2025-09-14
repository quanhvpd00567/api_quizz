/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Default route
router.get('/', async () => {
  return {
    message: 'Learning Management Backend API',
    version: '1.0.0',
    documentation: '/api/v1/health',
  }
})

// API v1 routes group
router
  .group(() => {
    // Health check routes
    router
      .group(() => {
        router.get('/', '#app/Domains/Shared/Controllers/HealthController.index')
        router.get('/database', '#app/Domains/Shared/Controllers/HealthController.database')
      })
      .prefix('/health')

    // Auth routes
    router
      .group(() => {
        router.post('/admin/login', '#domains/Auth/Controllers/AuthController.adminLogin')
        // Protected auth routes
        router
          .group(() => {
            router.post('/admin/logout', '#domains/Auth/Controllers/AuthController.adminLogout')
            router.get('/admin/me', '#domains/Auth/Controllers/AuthController.adminMe')
          })
          .middleware([middleware.auth()])
      })
      .prefix('/auth')

    // Users CRUD routes (protected)
    router
      .group(() => {
        router.get('/stats', '#domains/Auth/Controllers/UserController.stats')
        router.get('/', '#domains/Auth/Controllers/UserController.index')
        router.post('/', '#domains/Auth/Controllers/UserController.store')
        router.get('/:id', '#domains/Auth/Controllers/UserController.show')
        router.put('/:id', '#domains/Auth/Controllers/UserController.update')
        router.delete('/:id', '#domains/Auth/Controllers/UserController.destroy')
        router.patch('/:id/restore', '#domains/Auth/Controllers/UserController.restore')
      })
      .prefix('/users')
      .middleware([middleware.auth()])

    // Subjects CRUD routes (protected)
    router
      .group(() => {
        router.get('/stats', '#domains/Subject/Controllers/SubjectController.stats')
        router.get('/list', '#domains/Subject/Controllers/SubjectController.list')
        router.get('/class/:classCode', '#domains/Subject/Controllers/SubjectController.getByClass')
        router.get('/', '#domains/Subject/Controllers/SubjectController.index')
        router.post('/', '#domains/Subject/Controllers/SubjectController.store')
        router.get('/:id', '#domains/Subject/Controllers/SubjectController.show')
        router.put('/:id', '#domains/Subject/Controllers/SubjectController.update')
        router.delete('/:id', '#domains/Subject/Controllers/SubjectController.destroy')
        router.patch('/:id/restore', '#domains/Subject/Controllers/SubjectController.restore')
      })
      .prefix('/subjects')
      .middleware([middleware.auth()])

    // Questions CRUD routes (protected)
    router
      .group(() => {
        router.get('/stats', '#domains/Question/Controllers/QuestionController.stats')
        router.post('/bulk', '#domains/Question/Controllers/QuestionController.bulk')
        router.get('/', '#domains/Question/Controllers/QuestionController.index')
        router.post('/', '#domains/Question/Controllers/QuestionController.store')
        router.get('/:id', '#domains/Question/Controllers/QuestionController.show')
        router.put('/:id', '#domains/Question/Controllers/QuestionController.update')
        router.delete('/:id', '#domains/Question/Controllers/QuestionController.destroy')
        router.patch('/:id/restore', '#domains/Question/Controllers/QuestionController.restore')
      })
      .prefix('/questions')
      .middleware([middleware.auth()])

    // Quizzes CRUD routes (protected)
    router
      .group(() => {
        router.get('/stats', '#domains/Quiz/Controllers/QuizController.stats')
        router.get('/list', '#domains/Quiz/Controllers/QuizController.list')
        router.get('/', '#domains/Quiz/Controllers/QuizController.index')
        router.post('/', '#domains/Quiz/Controllers/QuizController.store')
        router.get('/:id', '#domains/Quiz/Controllers/QuizController.show')
        router.put('/:id', '#domains/Quiz/Controllers/QuizController.update')
        router.delete('/:id', '#domains/Quiz/Controllers/QuizController.destroy')
        router.patch('/:id/restore', '#domains/Quiz/Controllers/QuizController.restore')
        router.post('/:id/questions', '#domains/Quiz/Controllers/QuizController.addQuestion')
        router.post('/:id/assign', '#domains/Quiz/Controllers/QuizController.assignQuiz')
        router.post('/generate_ai', '#domains/Quiz/Controllers/QuizController.generateQuiz')

        // make quiz and history quiz routes
        router.post('/:id/make', '#domains/Quiz/Controllers/MakeQuizController.makeQuiz')
        router.get('/:id/history', '#domains/Quiz/Controllers/MakeQuizController.historyQuiz')
      })
      .prefix('/quizzes')
      .middleware([middleware.auth()])

    // Student Quiz routes (protected)
    router
      .group(() => {
        router.get(
          '/:studentId/quizzes',
          '#domains/Quiz/Controllers/StudentQuizController.getQuizzes'
        )
        router.post(
          '/quizzes/:studentQuizId/start',
          '#domains/Quiz/Controllers/StudentQuizController.updateQuizStatusStart'
        )
        router.get(
          '/quizzes/:studentQuizId/show',
          '#domains/Quiz/Controllers/StudentQuizController.showQuiz'
        )
      })
      .prefix('/students')
      .middleware([middleware.auth()])

    // Child routes (protected)
    router
      .group(() => {
        router.get('/', '#domains/Child/Controllers/ChildController.getChildren')
        router.post('/', '#domains/Child/Controllers/ChildController.addChild')
        router.put('/:id', '#domains/Child/Controllers/ChildController.updateChild')
        // get child results
        router.get('/:id/results', '#domains/Child/Controllers/ChildController.getChildResults')
      })
      .prefix('/children')
      .middleware([middleware.auth(), middleware.parentAccess()])

    // AI routes (protected)
    router
      .group(() => {
        router.get('/generate-process', '#domains/Ai/Controllers/AiController.list')
      })
      .prefix('/ai')
      .middleware([middleware.auth()])
  })
  .prefix('/api/v1')
