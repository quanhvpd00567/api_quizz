import { z } from 'zod'

// Create Subject Validation Schema
const createSubjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Subject name is required')
    .max(100, 'Subject name must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
  code: z
    .string()
    .min(1, 'Subject code is required')
    .max(10, 'Subject code must be less than 10 characters')
    .regex(/^[A-Z0-9_]+$/, 'Code must contain only uppercase letters, numbers, and underscores')
    .trim(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color (e.g., #FF0000)')
    .optional()
    .default('#3B82F6'),
  icon: z.string().max(50, 'Icon must be less than 50 characters').trim().optional(),
  class: z.string().max(20, 'Class code must be less than 20 characters').trim().optional(),
  isActive: z.boolean().optional().default(true),
})

// Update Subject Validation Schema (all fields optional)
const updateSubjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Subject name is required')
    .max(100, 'Subject name must be less than 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
  code: z
    .string()
    .min(1, 'Subject code is required')
    .max(10, 'Subject code must be less than 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Subject code must contain only uppercase letters and numbers')
    .trim()
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color (e.g., #FF0000)')
    .optional(),
  icon: z.string().max(50, 'Icon must be less than 50 characters').trim().optional(),
  class: z.string().max(20, 'Class code must be less than 20 characters').trim().optional(),
  isActive: z.boolean().optional(),
})

// Query Parameters Validation Schema
const subjectQuerySchema = z.object({
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
  class: z.string().trim().optional(),
  sortBy: z
    .enum(['name', 'code', 'createdAt', 'updatedAt', 'totalCourses', 'totalStudents', 'class'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// Validation Functions
export function validateCreateSubject(data: any) {
  try {
    console.log('Validating create subject data:', data)

    const validatedData = createSubjectSchema.parse(data)
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

export function validateUpdateSubject(data: any) {
  try {
    const validatedData = updateSubjectSchema.parse(data)
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

export function validateSubjectQuery(data: any) {
  try {
    const validatedData = subjectQuerySchema.parse(data)
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

export type CreateSubjectData = z.infer<typeof createSubjectSchema>
export type UpdateSubjectData = z.infer<typeof updateSubjectSchema>
export type SubjectQueryData = z.infer<typeof subjectQuerySchema>
