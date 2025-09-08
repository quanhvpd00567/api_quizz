import mongoose, { Schema, Document, Model } from 'mongoose'

// Interface for Quiz document
export interface IQuiz extends Document {
  title: string
  description?: string
  subject: mongoose.Types.ObjectId
  class: string
  // instructor: mongoose.Types.ObjectId
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedTime: number
  timeLimit?: number
  instructions?: string
  passingScore: number
  maxAttempts: number
  isActive: boolean
  isPublic: boolean
  allowReview: boolean
  shuffleQuestions: boolean
  shuffleAnswers: boolean
  showCorrectAnswers: boolean
  questions: mongoose.Types.ObjectId[]
  tags: string[]
  totalQuestions: number
  totalPoints: number
  totalAttempts: number
  averageScore: number
  createdAt: Date
  updatedAt: Date
  createdBy: mongoose.Types.ObjectId
  password: string
  isQrCode: boolean
  dataQrCode: string
  releaseDate: Date
  showResultsImmediately: boolean

  // Instance methods
  addQuestion(questionId: mongoose.Types.ObjectId): Promise<void>
  removeQuestion(questionId: mongoose.Types.ObjectId): Promise<void>
  updateStats(): Promise<void>
  canUserTakeQuiz(userId: mongoose.Types.ObjectId): Promise<boolean>
}

// Interface for Quiz model with static methods
export interface IQuizModel extends Model<IQuiz> {
  findByInstructor(instructorId: mongoose.Types.ObjectId): Promise<IQuiz[]>
  findPublic(): Promise<IQuiz[]>
  findBySubject(subjectId: mongoose.Types.ObjectId): Promise<IQuiz[]>
  findByClass(className: string): Promise<IQuiz[]>
  findByDifficulty(difficulty: string): Promise<IQuiz[]>
}

// Quiz Schema
const QuizSchema = new Schema<IQuiz>(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    class: {
      type: String,
      required: [true, 'Class is required'],
      trim: true,
      maxlength: [20, 'Class cannot exceed 20 characters'],
    },
    // instructor: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'User',
    //   required: [true, 'Instructor is required'],
    // },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'Difficulty must be easy, medium, or hard',
      },
      default: 'easy',
    },
    passingScore: {
      type: Number,
      default: 70,
      min: [0, 'Passing score must be at least 0'],
      max: [100, 'Passing score cannot exceed 100'],
    },
    maxAttempts: {
      type: Number,
      default: 1,
      min: [1, 'Maximum attempts must be at least 1'],
      max: [10, 'Maximum attempts cannot exceed 10'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    allowReview: {
      type: Boolean,
      default: true,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true,
    },
    timeLimit: {
      type: Number,
      min: [1, 'Time limit must be at least 1 minute'],
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [50, 'Tag cannot exceed 50 characters'],
      },
    ],
    totalQuestions: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    password: {
      type: String,
      default: null,
    },
    isQrCode: {
      type: Boolean,
      default: false,
    },
    dataQrCode: {
      type: String,
      default: null,
    },
    releaseDate: {
      type: Date,
      default: null,
    },
    showResultsImmediately: {
      type: Boolean,
      default: true,
    },
    shuffleAnswers: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes
QuizSchema.index({ instructor: 1 })
QuizSchema.index({ isActive: 1, isPublic: 1 })
QuizSchema.index({ subject: 1, class: 1 })
QuizSchema.index({ difficulty: 1 })
QuizSchema.index({ tags: 1 })
QuizSchema.index({ title: 'text', description: 'text' })

// Virtual for quiz attempts
QuizSchema.virtual('attempts', {
  ref: 'QuizAttempt',
  localField: '_id',
  foreignField: 'quiz',
})

// Virtual to populate questions
QuizSchema.virtual('questionDetails', {
  ref: 'Question',
  localField: 'questions',
  foreignField: '_id',
})

// Virtual to populate subject
QuizSchema.virtual('subjectDetails', {
  ref: 'Subject',
  localField: 'subject',
  foreignField: '_id',
  justOne: true,
})

// Pre-save middleware
QuizSchema.pre('save', function (this: IQuiz, next) {
  this.totalQuestions = this.questions.length
  next()
})

// Instance Methods
QuizSchema.methods.addQuestion = async function (
  this: IQuiz,
  questionId: mongoose.Types.ObjectId
): Promise<void> {
  if (!this.questions.includes(questionId)) {
    this.questions.push(questionId)
    this.totalQuestions = this.questions.length
    await this.save()
  }
}

// QuizSchema.methods.removeQuestion = async function(questionId: mongoose.Types.ObjectId): Promise<void> {
//   this.questions = this.questions.filter(id => !id.equals(questionId))
//   this.totalQuestions = this.questions.length
//   await this.save()
// }

QuizSchema.methods.updateStats = async function (this: IQuiz): Promise<void> {
  const QuizAttempt = mongoose.model('QuizAttempt')

  const stats = await QuizAttempt.aggregate([
    { $match: { quiz: this._id, status: 'completed' } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$score' },
      },
    },
  ])

  if (stats.length > 0) {
    this.totalAttempts = stats[0].totalAttempts
    this.averageScore = Math.round(stats[0].averageScore * 100) / 100
  } else {
    this.totalAttempts = 0
    this.averageScore = 0
  }

  await this.save()
}

QuizSchema.methods.canUserTakeQuiz = async function (
  this: IQuiz,
  userId: mongoose.Types.ObjectId
): Promise<boolean> {
  if (!this.isActive || !this.isPublic) {
    return false
  }

  const QuizAttempt = mongoose.model('QuizAttempt')
  const userAttempts = await QuizAttempt.countDocuments({
    quiz: this._id,
    student: userId,
    status: 'completed',
  })

  return userAttempts < this.maxAttempts
}

// Static Methods
QuizSchema.statics.findByInstructor = function (instructorId: mongoose.Types.ObjectId) {
  return this.find({ instructor: instructorId })
    .populate('instructor subject')
    .sort({ createdAt: -1 })
}

QuizSchema.statics.findPublic = function () {
  return this.find({
    isActive: true,
    isPublic: true,
  })
    .populate('instructor subject')
    .sort({ createdAt: -1 })
}

QuizSchema.statics.findBySubject = function (subjectId: mongoose.Types.ObjectId) {
  return this.find({
    subject: subjectId,
    isActive: true,
    isPublic: true,
  })
    .populate('instructor subject')
    .sort({ createdAt: -1 })
}

QuizSchema.statics.findByClass = function (className: string) {
  return this.find({
    class: className,
    isActive: true,
    isPublic: true,
  })
    .populate('instructor subject')
    .sort({ createdAt: -1 })
}

QuizSchema.statics.findByDifficulty = function (difficulty: string) {
  return this.find({
    difficulty,
    isActive: true,
    isPublic: true,
  })
    .populate('instructor subject')
    .sort({ createdAt: -1 })
}

// Create and export the model
const Quiz = mongoose.model<IQuiz, IQuizModel>('Quiz', QuizSchema)

export default Quiz
