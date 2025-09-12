import mongoose, { Schema, Document, Model } from 'mongoose'
import paginate from 'mongoose-paginate-v2';

export interface ISGenerateQuizHistory extends Document {
  user: mongoose.Types.ObjectId
  data: any
  provider: string
  modelName: string
  data_error: any;
  data_ai: any;
  status: String
}

export interface IStGenerateQuizHistoryModel extends Model<ISGenerateQuizHistory> {}

// Quiz Schema
const StudentQuizSchema = new Schema<ISGenerateQuizHistory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    provider: {
      type: String,
      required: [true, 'Provider is required'],
    },
    modelName: {
      type: String,
      required: [true, 'Model is required'],
    },
    data: {
      type: Schema.Types.Mixed,
      required: [true, 'Data is required'],
    },
    data_error: {
      type: Schema.Types.Mixed,
      default: null,
    },
    data_ai: {
      type: Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['not_started', 'in_progress', 'failed', 'completed'],
        message: 'Status must be not_started, in_progress, failed, or completed',
      },
      default: 'not_started',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Virtual for quiz attempts
StudentQuizSchema.virtual('attempts', {
  ref: 'QuizAttempt',
  localField: '_id',
  foreignField: 'quiz',
})

// Pre-save middleware
StudentQuizSchema.pre('save', function (this: ISGenerateQuizHistory, next) {
  next()
})

StudentQuizSchema.plugin(paginate);

// Create and export the model
const GenerateQuizHistory = mongoose.model<ISGenerateQuizHistory, mongoose.PaginateModel<IStGenerateQuizHistoryModel>>(
  'GenerateQuizHistory',
  StudentQuizSchema
)

export default GenerateQuizHistory
