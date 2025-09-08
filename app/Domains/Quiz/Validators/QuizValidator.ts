import { z } from 'zod'
import mongoose from 'mongoose'

// Create Quiz Validation Schema
const createQuizSchema = z.object({
  title: z
    .string()
    .min(1, 'Quiz title is required')
    .max(200, 'Quiz title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional(),
  subject: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), 'Invalid subject ID')
    .transform((val) => new mongoose.Types.ObjectId(val)),
  class: z.string().min(1, 'Class is required').max(20, 'Class cannot exceed 20 characters').trim(),
  // instructor: z
  //   .string()
  //   .refine((val) => mongoose.Types.ObjectId.isValid(val), 'Invalid instructor ID')
  //   .transform((val) => new mongoose.Types.ObjectId(val)),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .refine(
      (val) => ['easy', 'medium', 'hard'].includes(val),
      'Difficulty must be easy, medium, or hard'
    ),
  // estimatedTime: z
  //   .number()
  //   .min(1, 'Estimated time must be at least 1 minute')
  //   .max(300, 'Estimated time cannot exceed 300 minutes'),
  passingScore: z
    .number()
    .min(0, 'Passing score must be at least 0')
    .max(100, 'Passing score cannot exceed 100')
    .optional()
    .default(70),
  maxAttempts: z
    .number()
    .min(1, 'Maximum attempts must be at least 1')
    .max(10, 'Maximum attempts cannot exceed 10')
    .optional()
    .default(3),
  timeLimit: z
    .number()
    .min(1, 'Time limit must be at least 1 minute')
    .max(300, 'Time limit cannot exceed 300 minutes')
    .optional(),
  // instructions: z
  //   .string()
  //   .max(2000, 'Instructions cannot exceed 2000 characters')
  //   .trim()
  //   .optional(),
  questions: z
    .array(z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), 'Invalid question ID'))
    .transform((arr) => arr.map((id) => new mongoose.Types.ObjectId(id)))
    .optional()
    .default([]),
  tags: z
    .array(z.string().trim().toLowerCase().max(50, 'Tag cannot exceed 50 characters'))
    .optional()
    .default([]),
  isActive: z.boolean().optional().default(true),
  isPublic: z.boolean().optional().default(true),
  allowReview: z.boolean().optional().default(true),
  shuffleQuestions: z.boolean().optional().default(false),
  showCorrectAnswers: z.boolean().optional().default(true),
  createdBy: z
    .string()
    .transform((val) => new mongoose.Types.ObjectId(val))
    .optional()
    .default(undefined),
  password: z.string().min(6).optional().default(undefined),
  isQrCode: z.boolean().optional().default(false),
  dataQrCode: z.string().optional().default(undefined),
  releaseDate: z.date().optional().default(undefined),
})

// Update Quiz Validation Schema (all fields optional)
const updateQuizSchema = z.object({
  title: z
    .string()
    .min(1, 'Quiz title is required')
    .max(200, 'Quiz title must be less than 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional(),
  subject: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), 'Invalid subject ID')
    .transform((val) => new mongoose.Types.ObjectId(val))
    .optional(),
  class: z
    .string()
    .min(1, 'Class is required')
    .max(20, 'Class cannot exceed 20 characters')
    .trim()
    .optional(),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .refine(
      (val) => ['easy', 'medium', 'hard'].includes(val),
      'Difficulty must be easy, medium, or hard'
    )
    .optional(),
  estimatedTime: z
    .number()
    .min(1, 'Estimated time must be at least 1 minute')
    .max(300, 'Estimated time cannot exceed 300 minutes')
    .optional(),
  passingScore: z
    .number()
    .min(0, 'Passing score must be at least 0')
    .max(100, 'Passing score cannot exceed 100')
    .optional(),
  maxAttempts: z
    .number()
    .min(1, 'Maximum attempts must be at least 1')
    .max(10, 'Maximum attempts cannot exceed 10')
    .optional(),
  timeLimit: z
    .number()
    .min(1, 'Time limit must be at least 1 minute')
    .max(300, 'Time limit cannot exceed 300 minutes')
    .optional(),
  instructions: z
    .string()
    .max(2000, 'Instructions cannot exceed 2000 characters')
    .trim()
    .optional(),
  questions: z
    .array(z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), 'Invalid question ID'))
    .transform((arr) => arr.map((id) => new mongoose.Types.ObjectId(id)))
    .optional(),
  tags: z
    .array(z.string().trim().toLowerCase().max(50, 'Tag cannot exceed 50 characters'))
    .optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  allowReview: z.boolean().optional(),
  shuffleQuestions: z.boolean().optional(),
  showCorrectAnswers: z.boolean().optional(),
})

// Query Parameters Validation Schema
const quizQuerySchema = z.object({
  page: z
    .string()
    .transform((val: string) => Number.parseInt(val, 10))
    .refine((val: number) => val > 0, 'Page must be a positive number')
    .optional()
    .default(1),
  limit: z
    .string()
    .transform((val: string) => Number.parseInt(val, 10))
    .refine((val: number) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
    .optional()
    .default(10),
  search: z.string().trim().optional(),
  isActive: z
    .string()
    .transform((val: string) => val === 'true')
    .optional(),
  isPublic: z
    .string()
    .transform((val: string) => val === 'true')
    .optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  subject: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), 'Invalid subject ID')
    .optional(),
  class: z
    .string()
    .min(1, 'Class is required')
    .max(20, 'Class cannot exceed 20 characters')
    .trim()
    .optional(),
  instructor: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), 'Invalid instructor ID')
    .optional(),
  sortBy: z
    .enum([
      'title',
      'difficulty',
      'estimatedTime',
      'createdAt',
      'updatedAt',
      'totalQuestions',
      'averageScore',
    ])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// Validation Functions
export function validateCreateQuiz(data: any) {
  try {
    console.log('Validating create quiz data:', data)

    const validatedData = createQuizSchema.parse(data)
    console.log('Validation successful:', validatedData)
    return {
      isValid: true,
      data: validatedData,
      errors: null,
    }
  } catch (error: any) {
    console.log('Validation errors:', error)

    return {
      isValid: false,
      data: null,
      errors:
        error.errors?.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })) || [],
    }
  }
}

export function validateUpdateQuiz(data: any) {
  try {
    const validatedData = updateQuizSchema.parse(data)
    return {
      isValid: true,
      data: validatedData,
      errors: null,
    }
  } catch (error: any) {
    return {
      isValid: false,
      data: null,
      errors:
        error.errors?.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })) || [],
    }
  }
}

export function validateQuizQuery(data: any) {
  try {
    const validatedData = quizQuerySchema.parse(data)
    return {
      isValid: true,
      data: validatedData,
      errors: null,
    }
  } catch (error: any) {
    return {
      isValid: false,
      data: null,
      errors:
        error.errors?.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        })) || [],
    }
  }
}

export type CreateQuizData = z.infer<typeof createQuizSchema>
export type UpdateQuizData = z.infer<typeof updateQuizSchema>
export type QuizQueryData = z.infer<typeof quizQuerySchema>
