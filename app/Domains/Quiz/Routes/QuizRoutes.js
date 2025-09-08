import { Router } from 'express'
import QuizController from '../Controllers/QuizController.js'
import MakeQuizController from '../Controllers/MakeQuizController.js'

const router = Router()

// Quiz routes
router.post('/', QuizController.createQuiz)
router.get('/', QuizController.getQuizzes)
router.get('/stats', QuizController.getQuizStats)
router.get('/:id', QuizController.getQuiz)
router.put('/:id', QuizController.updateQuiz)
router.delete('/:id', QuizController.deleteQuiz)

export default router
