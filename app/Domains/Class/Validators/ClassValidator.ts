import { z } from 'zod'

// Create Class Validation Schema
const createClassSchema = z.object({
  name: z
    .string()
    .min(1, 'Class name is required')
    .max(100, 'Class name must be less than 100 characters')
    .trim(),
  status: z.boolean().optional().default(true),
})

// Update Class Validation Schema (all fields optional)
const updateClassSchema = z.object({
  name: z
    .string()
    .min(1, 'Class name is required')
    .max(100, 'Class name must be less than 100 characters')
    .trim()
    .optional(),
  status: z.boolean().optional(),
})

// Query Parameters Validation Schema
const classQuerySchema = z.object({
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
  status: z
    .string()
    .transform((val: string) => val === 'true')
    .optional(),
  grade: z
    .string()
    .transform((val: string) => Number.parseInt(val, 10))
    .refine((val: number) => val >= 1 && val <= 12, 'Grade must be between 1 and 12')
    .optional(),
  sortBy: z
    .enum(['name', 'status', 'grade', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// Validation Functions
export function validateCreateClass(data: any) {
  try {
    console.log('Validating create class data:', data)

    const validatedData = createClassSchema.parse(data)
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

export function validateUpdateClass(data: any) {
  try {
    const validatedData = updateClassSchema.parse(data)
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

export function validateClassQuery(data: any) {
  try {
    const validatedData = classQuerySchema.parse(data)
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

export type CreateClassData = z.infer<typeof createClassSchema>
export type UpdateClassData = z.infer<typeof updateClassSchema>
export type ClassQueryData = z.infer<typeof classQuerySchema>
