import { Schema, model, Document } from 'mongoose'
import paginate from 'mongoose-paginate-v2'

export interface IAnswer {
  id: string
  text: string
  isCorrect: boolean
  explanation?: string
}

export interface IQuestion extends Document {
  id: string
  title: string
  content: string
  type: string
  answers: IAnswer[]
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  subject?: string // Reference to Subject
  class?: string // Class code (LOP_1, LOP_2, etc.)
  tags: string[]
  isActive: boolean
  createdBy?: string // Reference to User
  createdAt: Date
  updatedAt: Date
  __v?: any
}

const answerSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false,
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { _id: true }
)

const questionSchema = new Schema<IQuestion>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      required: true,
      // enum: ['true_false', 'multiple_choice', 'single_choice', 'fill_blank'],
      index: true,
    },
    answers: {
      type: [answerSchema],
      required: true,
      validate: {
        validator: function (answers: IAnswer[]) {
          const type = this.type

          // Validate based on question type
          switch (type) {
            case 'true_false':
              return answers.length === 2 && answers.filter((a) => a.isCorrect).length === 1

            case 'single_choice':
              return (
                answers.length >= 2 &&
                answers.length <= 6 &&
                answers.filter((a) => a.isCorrect).length === 1
              )

            case 'multiple_choice':
              return (
                answers.length >= 2 &&
                answers.length <= 6 &&
                answers.filter((a) => a.isCorrect).length >= 1
              )

            case 'fill_blank':
              return answers.length >= 1 && answers.filter((a) => a.isCorrect).length >= 1

            default:
              return false
          }
        },
        message: 'Invalid answers configuration for question type',
      },
    },
    explanation: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true,
    },
    points: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 1,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      index: true,
    },
    class: {
      type: String,
      trim: true,
      maxlength: 20,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags: string[]) {
          return tags.length <= 10 && tags.every((tag) => tag.length <= 50)
        },
        message: 'Maximum 10 tags allowed, each tag must be 50 characters or less',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret?.__v
        return ret
      },
    },
  }
)

// Indexes for performance
questionSchema.index({ title: 1, isActive: 1 })
questionSchema.index({ type: 1, difficulty: 1 })
questionSchema.index({ subject: 1, class: 1 })
questionSchema.index({ createdAt: -1 })
questionSchema.index({ tags: 1 })

// Pre-save middleware to validate answers based on type
questionSchema.pre('save', function (next) {
  // Ensure tags are unique and trimmed
  if (this.tags) {
    this.tags = [...new Set(this.tags.map((tag) => tag.trim().toLowerCase()))]
  }

  // Auto-generate true/false answers if type is true_false and no answers provided
  if (this.type === 'true_false' && this.answers.length === 0) {
    this.answers = [
      { text: 'Đúng', isCorrect: false },
      { text: 'Sai', isCorrect: false },
    ] as any
  }

  next()
})

questionSchema.plugin(paginate)

const Question = model<IQuestion>('Question', questionSchema)

export default Question
