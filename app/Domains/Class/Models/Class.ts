import { Schema, model, Document } from 'mongoose'

export interface IClass extends Document {
  id: string
  name: string
  status: boolean
  grade?: number // Extracted from name (e.g., "Lớp 1" -> 1)
  createdAt: Date
  updatedAt: Date
  __v?: any // optional
}

const classSchema = new Schema<IClass>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },
    status: {
      type: Boolean,
      default: true,
      index: true,
    },
    grade: {
      type: Number,
      min: 1,
      max: 12,
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
classSchema.index({ name: 1, status: 1 })
classSchema.index({ grade: 1, status: 1 })
classSchema.index({ createdAt: -1 })

// Ensure name uniqueness
classSchema.index({ name: 1 }, { unique: true })

// Pre-save middleware to extract grade from name
classSchema.pre('save', function (next) {
  if (this.name) {
    // Extract grade number from names like "Lớp 1", "Lớp 2", etc.
    const gradeMatch = this.name.match(/lớp\s*(\d+)/i)
    if (gradeMatch) {
      const gradeNumber = Number.parseInt(gradeMatch[1])
      if (gradeNumber >= 1 && gradeNumber <= 12) {
        this.grade = gradeNumber
      }
    }
  }
  next()
})

const Class = model<IClass>('Class', classSchema)

export default Class
