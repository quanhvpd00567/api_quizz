import mongoose, { Schema, Document, Model } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

export interface IStudentQuiz extends Document {
  quizz: mongoose.Types.ObjectId
  number_of_attempts: Number
  status: String
  student: mongoose.Types.ObjectId
  last_history: mongoose.Types.ObjectId
}

export interface IStudentQuizModel extends Model<IStudentQuiz> {}

// Quiz Schema
const StudentQuizSchema = new Schema<IStudentQuiz>(
  {
    quizz: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz is required'],
    },
    number_of_attempts: {
      type: Number,
      default: 0,
      min: [0, 'Number of attempts cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['not_started', 'in_progress', 'completed'],
        message: 'Status must be not_started, in_progress, or completed',
      },
      default: 'not_started',
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    last_history: {
      type: Schema.Types.ObjectId,
      ref: 'QuizHistory',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes
StudentQuizSchema.index({ student: 1, quizz: 1 }, { unique: true })

// Virtual for quiz attempts
StudentQuizSchema.virtual('attempts', {
  ref: 'QuizAttempt',
  localField: '_id',
  foreignField: 'quiz',
})

// Pre-save middleware
StudentQuizSchema.pre('save', function (this: IStudentQuiz, next) {
  next()
})
// Add pagination plugin
StudentQuizSchema.plugin(paginate)

// Create and export the model
const StudentQuiz = mongoose.model<IStudentQuiz, mongoose.PaginateModel<IStudentQuizModel>>(
  'StudentQuiz',
  StudentQuizSchema
)

export default StudentQuiz
