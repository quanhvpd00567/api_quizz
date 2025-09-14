import StudentQuiz from '#domains/Quiz/Models/StudentQuiz'
import Quiz from '#domains/Quiz/Models/Quiz'
import mongoose from 'mongoose'
import StudentQuizHistory from '#domains/Quiz/Models/StudentQuizHistory'

export default class StudentQuizService {
  // Get list of quizzes assigned to a student
  public static async getQuizzesForStudent(studentId: mongoose.Types.ObjectId): Promise<any> {
    try {
      const quizzes = await StudentQuiz.find({ student: studentId })
        .populate({
          path: 'quizz',
          model: Quiz,
        })
        .populate({
          path: 'last_history',
          model: StudentQuizHistory,
        })

      return {
        status: 'success',
        data: quizzes,
        timestamp: new Date().toISOString(),
      }
    } catch {
      return {
        status: 'error',
        message: 'Không thể lấy danh sách bài kiểm tra',
        timestamp: new Date().toISOString(),
      }
    }
  }

  // Update quiz status for a student
  public static async updateQuizStatus(
    studentQuizId: mongoose.Types.ObjectId,
    status: 'not_started' | 'in_progress' | 'completed',
    userId: mongoose.Types.ObjectId
  ): Promise<any> {
    try {
      const studentQuiz = await StudentQuiz.findOne({
        _id: studentQuizId,
        student: userId,
      })
      if (!studentQuiz) {
        return {
          status: 'error',
          message: 'Bài kiểm tra không tìm thấy',
          timestamp: new Date().toISOString(),
        }
      }

      // nếu số lần làm bài đã đạt maxAttempts thì không cho phép update trạng thái
      const quiz = await Quiz.findById(studentQuiz.quizz)
      if (quiz && Number(studentQuiz.number_of_attempts || 0) + 1 > quiz.maxAttempts) {
        return {
          status: 'error',
          message: 'Bạn đã hết lần làm bài kiểm tra này',
          timestamp: new Date().toISOString(),
        }
      }

      studentQuiz.status = status
      await studentQuiz.save()

      return {
        status: 'success',
        message: 'Cập nhật trạng thái bài kiểm tra thành công',
        data: studentQuiz,
        timestamp: new Date().toISOString(),
      }
    } catch {
      return {
        status: 'error',
        message: 'Không thể cập nhật trạng thái bài kiểm tra',
        timestamp: new Date().toISOString(),
      }
    }
  }
}
