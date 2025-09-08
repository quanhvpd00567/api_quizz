import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IStudentHistoryQuiz extends Document {
  student_quiz: mongoose.Types.ObjectId
  student: mongoose.Types.ObjectId
  number_of_attempts: Number
  total_score: Number
  student_answers: any
  list_question_passed: [mongoose.Types.ObjectId]
  list_question_failed: [mongoose.Types.ObjectId]
  submissionTime: Number
  status: String
  ai_comment?: String
}

export interface IStudentQuizHistoryModel extends Model<IStudentHistoryQuiz> {}

// Quiz Schema
const StudentQuizHistorySchema = new Schema<IStudentHistoryQuiz>(
  {
    student_quiz: {
      type: Schema.Types.ObjectId,
      ref: 'StudentQuiz',
      required: [true, 'StudentQuiz is required'],
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
      index: true,
    },
    number_of_attempts: {
      type: Number,
      default: 1,
      min: [1, 'Number of attempts cannot be negative'],
    },
    total_score: {
      type: Number,
      required: true,
      min: [0, 'Total score cannot be negative'],
      default: 0,
    },
    list_question_passed: {
      type: [Schema.Types.ObjectId],
      ref: 'Question',
      default: [],
    },
    list_question_failed: {
      type: [Schema.Types.ObjectId],
      ref: 'Question',
      default: [],
    },
    student_answers: {
      type: Schema.Types.Mixed,
      default: {},
    },
    submissionTime: {
      type: Number,
      default: 0, // in seconds
      min: [0, 'Submission time cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['passed', 'failed'],
        message: 'Status must be passed or failed',
      },
      required: true,
    },
    ai_comment: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'AI comment cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Pre-save middleware
StudentQuizHistorySchema.pre('save', function (this: IStudentHistoryQuiz, next) {
  next()
})

// Create and export the model
const StudentQuizHistory = mongoose.model<IStudentHistoryQuiz, IStudentQuizHistoryModel>(
  'StudentQuizHistory',
  StudentQuizHistorySchema
)

export default StudentQuizHistory
