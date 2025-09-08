import { z } from 'zod'

// Answer schema for validation
const answerSchema = z.object({
  text: z
    .string()
    .min(1, 'Answer text is required')
    .max(500, 'Answer text must be less than 500 characters')
    .trim(),
  isCorrect: z.boolean().default(false),
  explanation: z
    .string()
    .max(1000, 'Answer explanation must be less than 1000 characters')
    .trim()
    .optional(),
})

// Create Question Validation Schema
const createQuestionSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Question title is required')
      .max(200, 'Question title must be less than 200 characters')
      .trim(),
    content: z
      .string()
      .min(1, 'Question content is required')
      .max(2000, 'Question content must be less than 2000 characters')
      .trim(),
    type: z.enum(['true_false', 'multiple_choice', 'single_choice', 'fill_blank'], {
      message:
        'Question type must be one of: true_false, multiple_choice, single_choice, fill_blank',
    }),
    answers: z
      .array(answerSchema)
      .min(1, 'At least one answer is required')
      .max(6, 'Maximum 6 answers allowed'),
    explanation: z
      .string()
      .max(1000, 'Question explanation must be less than 1000 characters')
      .trim()
      .optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    points: z
      .number()
      .min(1, 'Points must be at least 1')
      .max(100, 'Points must be at most 100')
      .default(1),
    subject: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Subject must be a valid ObjectId')
      .optional(),
    class: z.string().max(20, 'Class code must be less than 20 characters').trim().optional(),
    tags: z
      .array(z.string().max(50, 'Each tag must be 50 characters or less'))
      .max(10, 'Maximum 10 tags allowed')
      .default([])
      .transform((tags) => [...new Set(tags.map((tag) => tag.trim().toLowerCase()))]),
    isActive: z.boolean().default(true),
    createdBy: z.string().optional().default(null),
  })
  .refine(
    (data) => {
      // Custom validation based on question type
      const { type, answers } = data

      switch (type) {
        case 'true_false':
          if (answers.length !== 2) {
            return false
          }
          const correctTrueFalse = answers.filter((a) => a.isCorrect).length
          return correctTrueFalse === 1

        case 'single_choice':
          if (answers.length < 2 || answers.length > 6) {
            return false
          }
          const correctSingle = answers.filter((a) => a.isCorrect).length
          return correctSingle === 1

        case 'multiple_choice':
          if (answers.length < 2 || answers.length > 6) {
            return false
          }
          const correctMultiple = answers.filter((a) => a.isCorrect).length
          return correctMultiple >= 1

        case 'fill_blank':
          if (answers.length < 1) {
            return false
          }
          // For fill in the blank, all answers should be correct answers
          return answers.every((a) => a.isCorrect)

        default:
          return false
      }
    },
    {
      message: 'Invalid answers configuration for the selected question type',
      path: ['answers'],
    }
  )

// Update Question Validation Schema (all fields optional)
const updateQuestionSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Question title is required')
      .max(200, 'Question title must be less than 200 characters')
      .trim()
      .optional(),
    content: z
      .string()
      .min(1, 'Question content is required')
      .max(2000, 'Question content must be less than 2000 characters')
      .trim()
      .optional(),
    type: z.enum(['true_false', 'multiple_choice', 'single_choice', 'fill_blank']).optional(),
    answers: z
      .array(answerSchema)
      .min(1, 'At least one answer is required')
      .max(6, 'Maximum 6 answers allowed')
      .optional(),
    explanation: z
      .string()
      .max(1000, 'Question explanation must be less than 1000 characters')
      .trim()
      .optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    points: z
      .number()
      .min(1, 'Points must be at least 1')
      .max(100, 'Points must be at most 100')
      .optional(),
    subject: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Subject must be a valid ObjectId')
      .optional(),
    class: z.string().max(20, 'Class code must be less than 20 characters').trim().optional(),
    tags: z
      .array(z.string().max(50, 'Each tag must be 50 characters or less'))
      .max(10, 'Maximum 10 tags allowed')
      .transform((tags) => [...new Set(tags.map((tag) => tag.trim().toLowerCase()))])
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Only validate if both type and answers are provided
      if (!data.type || !data.answers) {
        return true
      }

      const { type, answers } = data

      switch (type) {
        case 'true_false':
          if (answers.length !== 2) {
            return false
          }
          const correctTrueFalse = answers.filter((a) => a.isCorrect).length
          return correctTrueFalse === 1

        case 'single_choice':
          if (answers.length < 2 || answers.length > 6) {
            return false
          }
          const correctSingle = answers.filter((a) => a.isCorrect).length
          return correctSingle === 1

        case 'multiple_choice':
          if (answers.length < 2 || answers.length > 6) {
            return false
          }
          const correctMultiple = answers.filter((a) => a.isCorrect).length
          return correctMultiple >= 1

        case 'fill_blank':
          if (answers.length < 1) {
            return false
          }
          return answers.every((a) => a.isCorrect)

        default:
          return false
      }
    },
    {
      message: 'Invalid answers configuration for the selected question type',
      path: ['answers'],
    }
  )

// Query Parameters Validation Schema
const questionQuerySchema = z.object({
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
  type: z.enum(['true_false', 'multiple_choice', 'single_choice', 'fill_blank']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  subject: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Subject must be a valid ObjectId')
    .optional(),
  class: z.string().trim().optional(),
  tags: z
    .string()
    .transform((val: string) =>
      val
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
    .optional(),
  isActive: z
    .string()
    .transform((val: string) => val === 'true')
    .optional(),
  sortBy: z
    .enum(['title', 'type', 'difficulty', 'points', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// Validation Functions
export function validateCreateQuestion(data: any) {
  try {
    console.log('Validating create question data:', data)

    const validatedData = createQuestionSchema.parse(data)
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

export function validateUpdateQuestion(data: any) {
  try {
    const validatedData = updateQuestionSchema.parse(data)
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

export function validateQuestionQuery(data: any) {
  try {
    const validatedData = questionQuerySchema.parse(data)
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

export type CreateQuestionData = z.infer<typeof createQuestionSchema>
export type UpdateQuestionData = z.infer<typeof updateQuestionSchema>
export type QuestionQueryData = z.infer<typeof questionQuerySchema>
