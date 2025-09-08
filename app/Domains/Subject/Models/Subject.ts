import { Schema, model, Document } from 'mongoose'

export interface ISubject extends Document {
  id: string
  name: string
  description?: string
  code: string
  color?: string
  icon?: string
  classes?: string[] // Changed from single class to array of classes
  class?: string // Single class code for backward compatibility
  isActive: boolean
  totalCourses: number
  totalStudents: number
  createdAt: Date
  updatedAt: Date
  __v?: any // optional
}

const subjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 10,
      index: true,
    },
    color: {
      type: String,
      trim: true,
      default: '#3B82F6', // Blue color as default
      match: /^#[0-9A-F]{6}$/i, // Hex color validation
    },
    icon: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    class: {
      type: String, // Single class code
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    totalCourses: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalStudents: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        // delete ret._id
        delete ret?.__v
        return ret
      },
    },
  }
)

// Indexes for performance
subjectSchema.index({ name: 1, isActive: 1 })
subjectSchema.index({ classes: 1, isActive: 1 }) // Index for class filtering
// subjectSchema.index({ code: 1 }, { unique: true })
subjectSchema.index({ createdAt: -1 })

// Ensure code is always uppercase
subjectSchema.pre('save', function (next) {
  if (this.code) {
    this.code = this.code.toUpperCase()
  }
  next()
})

const Subject = model<ISubject>('Subject', subjectSchema)

export default Subject
