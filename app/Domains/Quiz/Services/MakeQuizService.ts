import mongoose from 'mongoose'
import StudentQuiz from '#domains/Quiz/Models/StudentQuiz'
import Quiz from '#domains/Quiz/Models/Quiz'
import StudentQuizHistory from '#domains/Quiz/Models/StudentQuizHistory'
import Question from '#domains/Question/Models/Question'
import queue from '@rlanz/bull-queue/services/main'
import JobPushNotificationMakeQuizSuccess from '#jobs/JobPushNotificationMakeQuizSuccess'
import User from '#domains/Auth/Models/User'

export default class MakeQuizService {
  public static async makeQuiz(
    studentQuizId: mongoose.Types.ObjectId,
    data: any,
    studentId: mongoose.Types.ObjectId,
    user: { fullName: string }
  ): Promise<any> {
    // find student quiz by studentQuizId and studentId
    const studentQuiz = await StudentQuiz.findOne({
      _id: studentQuizId,
      student: studentId,
    }).populate({
      path: 'quizz',
      model: Quiz,
      select: 'title description questions duration maxAttempts totalPoints passingScore',
      populate: {
        path: 'questions',
        model: Question,
        select: 'title type points answers',
      },
    })
    if (!studentQuiz) {
      console.log('StudentQuiz not found for ID:', studentQuizId, 'and student ID:', studentId) // Debug log
      return { message: 'StudentQuiz not found', data: null }
    }

    const questions =
      studentQuiz.quizz && 'questions' in studentQuiz.quizz
        ? (studentQuiz.quizz.questions as Array<{
            _id: mongoose.Types.ObjectId
            type: string
            title: string
            points: number
            answers: any[]
          }>)
        : []

    const studentAnswers = data.answers || {}
    let totalScore = 0
    let isCorrect = false
    let listQuestionPassed = []
    let listQuestionFailed = []
    for (const question of questions) {
      const answer = studentAnswers[question._id.toString()]
      if (!answer) {
        listQuestionFailed.push(question._id)
        continue
      }

      let points = question.points || 0
      switch (question.type) {
        case 'true_false':
        case 'single_choice':
          // dựa vào id câu trả lời để so sánh
          isCorrect = question.answers.some(
            (ans) =>
              ans.isCorrect && ans._id.toString().toLowerCase() === String(answer).toLowerCase()
          )
          break
        case 'multiple_choice':
          if (Array.isArray(answer)) {
            const correctAnswers = question.answers
              .filter((ans) => ans.isCorrect)
              .map((ans) => ans._id.toString().toLowerCase())
            const providedAnswers = answer.map((ans: string) => ans.toLowerCase())
            isCorrect =
              correctAnswers.length === providedAnswers.length &&
              correctAnswers.every((val) => providedAnswers.includes(val))
          }
          break
        case 'fill_blank':
          isCorrect = question.answers.some(
            (ans) => ans.isCorrect && ans.text.toLowerCase() === String(answer).toLowerCase()
          )
          break
        default:
          isCorrect = false
      }

      if (isCorrect) {
        totalScore += points
        listQuestionPassed.push(question._id)
      } else {
        listQuestionFailed.push(question._id)
      }
      // Reset isCorrect for next iteration
      isCorrect = false
    }

    // save history
    const history = new StudentQuizHistory({
      student_quiz: studentQuiz._id,
      number_of_attempts: Number(studentQuiz.number_of_attempts) + 1,
      total_score: totalScore,
      list_question_passed: listQuestionPassed,
      list_question_failed: listQuestionFailed,
      student_answers: studentAnswers,
      student: studentId,
      submissionTime: data.submissionTime || 0,
      status: totalScore >= (studentQuiz.quizz as any).passingScore ? 'passed' : 'failed',
    })

    const rateActual = (totalScore / (studentQuiz.quizz as any).totalPoints) * 100
    if (rateActual >= (studentQuiz.quizz as any).passingScore) {
      history.status = 'passed'
    } else {
      history.status = 'failed'
    }

    await history.save()
    // Update student quiz record
    studentQuiz.number_of_attempts = Number(studentQuiz.number_of_attempts) + 1
    studentQuiz.last_history = history._id as mongoose.Types.ObjectId
    studentQuiz.status = 'completed'
    await studentQuiz.save()

    const student = await User.findById(studentId).populate('parent')
    const telegramChatId =
      student && student.parent ? (student.parent as any).preferences.telegram_id : null
    if (student && telegramChatId) {
      const message = await this.buildTelegramMessage({
        parentName: student.parent ? (student.parent as any).fullName : 'Phụ huynh',
        fullName: user.fullName,
        title: (studentQuiz.quizz as any).title,
        score: totalScore,
        result: history.status === 'passed' ? 'Đạt' : 'Không đạt',
        totalPoints: (studentQuiz.quizz as any).totalPoints,
      })
      queue.dispatch(
        JobPushNotificationMakeQuizSuccess,
        {
          message,
          telegramChatId,
        },
        {
          queueName: 'makeQuizSuccess',
        }
      )
    }

    // Implement your business logic here
    return { message: 'Quiz made successfully', history }
  }

  public static async getQuizResults(
    historyId: mongoose.Types.ObjectId,
    studentId: mongoose.Types.ObjectId
  ): Promise<any> {
    const history = await StudentQuizHistory.findOne({
      _id: historyId,
      student: studentId,
    }).populate({
      path: 'student_quiz',
      model: StudentQuiz,
      populate: {
        path: 'quizz',
        model: Quiz,
        populate: {
          path: 'questions',
          model: Question,
        },
      },
    })

    if (!history) {
      return { message: 'History not found', data: null }
    }

    return { message: 'Quiz results retrieved successfully', history }
  }

  private static async buildTelegramMessage({
    parentName,
    fullName,
    title,
    score,
    result,
    totalPoints,
  }: {
    parentName: string
    fullName: string
    title: string
    score: number
    result: string
    totalPoints?: number
  }) {
    return `Chào a/c: ${parentName}
  Chúc mừng cháu <b>${fullName}</b> đã hoàn thành bài trắc nghiệm
  Dưới đây là kết quả: 
    + Tên bài trắc nghiệm: <b>🔥 ${title}</b>
    + Điểm: <b>${score}/${totalPoints}</b>
    + Kết quả: <b>🔥 ${result}</b>`
  }
}
