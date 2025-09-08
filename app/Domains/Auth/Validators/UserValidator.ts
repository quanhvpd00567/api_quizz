/**
 * User validation functions
 */

export interface CreateUserRequest {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
  bio?: string
  avatar?: string
  role?: 'administrator' | 'parent' | 'student'
  isActive?: boolean
  isEmailVerified?: boolean
  preferences?: {
    language?: string
    timezone?: string
    emailNotifications?: boolean
    theme?: string
  }
}

export interface UpdateUserRequest {
  email?: string
  username?: string
  password?: string
  firstName?: string
  lastName?: string
  bio?: string
  avatar?: string
  role?: 'administrator' | 'parent' | 'student'
  isActive?: boolean
  isEmailVerified?: boolean
  preferences?: {
    language?: string
    timezone?: string
    emailNotifications?: boolean
    theme?: string
  }
}

/**
 * Validate create user data
 */
export function validateCreateUser(data: any): { isValid: boolean; errors: string[]; data?: CreateUserRequest } {
  const errors: string[] = []

  // Required fields
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required and must be a string')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format')
  }

  if (!data.username || typeof data.username !== 'string') {
    errors.push('Username is required and must be a string')
  } else if (data.username.length < 3 || data.username.length > 20) {
    errors.push('Username must be between 3 and 20 characters')
  } else if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens')
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required and must be a string')
  } else if (data.password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!data.firstName || typeof data.firstName !== 'string') {
    errors.push('First name is required and must be a string')
  }

  if (!data.lastName || typeof data.lastName !== 'string') {
    errors.push('Last name is required and must be a string')
  }

  // Optional fields validation
  if (data.role && !['administrator', 'parent', 'student'].includes(data.role)) {
    errors.push('Role must be one of: administrator, parent, student')
  }

  if (data.bio && typeof data.bio !== 'string') {
    errors.push('Bio must be a string')
  }

  if (data.avatar && typeof data.avatar !== 'string') {
    errors.push('Avatar must be a string URL')
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data as CreateUserRequest : undefined
  }
}

/**
 * Validate update user data
 */
export function validateUpdateUser(data: any): { isValid: boolean; errors: string[]; data?: UpdateUserRequest } {
  const errors: string[] = []

  // All fields are optional for update
  if (data.email !== undefined) {
    if (typeof data.email !== 'string') {
      errors.push('Email must be a string')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format')
    }
  }

  if (data.username !== undefined) {
    if (typeof data.username !== 'string') {
      errors.push('Username must be a string')
    } else if (data.username.length < 3 || data.username.length > 20) {
      errors.push('Username must be between 3 and 20 characters')
    } else if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
      errors.push('Username can only contain letters, numbers, underscores, and hyphens')
    }
  }

  if (data.password !== undefined) {
    if (typeof data.password !== 'string') {
      errors.push('Password must be a string')
    } else if (data.password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
  }

  if (data.firstName !== undefined && typeof data.firstName !== 'string') {
    errors.push('First name must be a string')
  }

  if (data.lastName !== undefined && typeof data.lastName !== 'string') {
    errors.push('Last name must be a string')
  }

  if (data.role !== undefined && !['administrator', 'parent', 'student'].includes(data.role)) {
    errors.push('Role must be one of: administrator, parent, student')
  }

  if (data.bio !== undefined && typeof data.bio !== 'string') {
    errors.push('Bio must be a string')
  }

  if (data.avatar !== undefined && typeof data.avatar !== 'string') {
    errors.push('Avatar must be a string URL')
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data as UpdateUserRequest : undefined
  }
}
