import mongoose, { Schema, Document, Model } from 'mongoose'
import bcrypt from 'bcryptjs'

// User roles enum
export enum UserRole {
  ADMINISTRATOR = 'administrator',
  PARENT = 'parent',
  STUDENT = 'student',
}

// Interface for User document
export interface IUser extends Document {
  parent: mongoose.Types.ObjectId
  email: string
  username: string
  password?: string
  firstName: string
  lastName: string
  avatar?: string
  bio?: string
  role: UserRole
  isActive: boolean
  isEmailVerified: boolean
  emailVerificationToken?: string
  passwordResetToken?: string
  passwordResetExpires?: Date
  lastLoginAt?: Date
  loginAttempts: number
  lockUntil?: Date
  preferences: {
    language: string
    timezone: string
    emailNotifications: boolean
    theme: string
  }
  metadata: {
    registrationIP?: string
    userAgent?: string
    source: string
  }
  createdAt: Date
  updatedAt: Date

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>
  generatePasswordResetToken(): string
  generateEmailVerificationToken(): string
  getFullName(): string
  isLocked(): boolean
  incrementLoginAttempts(): Promise<void>
}

// Interface for User model with static methods
export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>
  findByUsername(username: string): Promise<IUser | null>
  createUser(userData: Partial<IUser>): Promise<IUser>
  authenticate(identifier: string, password: string): Promise<IUser | null>
}

// User Schema
const UserSchema = new Schema<IUser>(
  {
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
      match: [
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, underscores, and hyphens',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    avatar: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v)
        },
        message: 'Avatar must be a valid image URL',
      },
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
      required: [true, 'User role is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    lastLoginAt: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    preferences: {
      language: {
        type: String,
        default: 'en',
        enum: ['en', 'vi', 'es', 'fr', 'de', 'ja', 'ko', 'zh'],
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      theme: {
        type: String,
        default: 'light',
        enum: ['light', 'dark', 'auto'],
      },
    },
    metadata: {
      registrationIP: String,
      userAgent: String,
      source: {
        type: String,
        default: 'web',
        enum: ['web', 'mobile', 'api'],
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete ret.password
        delete ret.passwordResetToken
        delete ret.emailVerificationToken
        return ret
      },
    },
    toObject: { virtuals: true },
  }
)

// Indexes
// UserSchema.index({ email: 1 }, { unique: true })
// UserSchema.index({ username: 1 }, { unique: true })
UserSchema.index({ isActive: 1 })
UserSchema.index({ role: 1 })
UserSchema.index({ createdAt: -1 })

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`
})

// Pre-save middleware to hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Instance Methods
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

UserSchema.methods.generatePasswordResetToken = function (): string {
  const token =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  this.passwordResetToken = token
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  return token
}

UserSchema.methods.generateEmailVerificationToken = function (): string {
  const token =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  this.emailVerificationToken = token
  return token
}

UserSchema.methods.getFullName = function (): string {
  return `${this.firstName} ${this.lastName}`
}

UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date())
}

UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    }).exec()
  }

  const updates: any = { $inc: { loginAttempts: 1 } }

  // If we've reached max attempts and it's not locked, lock the account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 } // 2 hours
  }

  return this.updateOne(updates).exec()
}

// Static Methods
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() }).populate('roles')
}

UserSchema.statics.findByUsername = function (username: string) {
  return this.findOne({ username }).populate('roles')
}

UserSchema.statics.createUser = async function (userData: Partial<IUser>) {
  const user = new this(userData)
  return user.save()
}

UserSchema.statics.authenticate = async function (identifier: string, password: string) {
  const user = await this.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
    isActive: true,
  })
    .select('+password')
    .populate('roles')

  if (!user || user.isLocked()) {
    return null
  }

  const isPasswordValid = await user.comparePassword(password)

  if (isPasswordValid) {
    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 },
        $set: { lastLoginAt: new Date() },
      })
    } else {
      await user.updateOne({ lastLoginAt: new Date() })
    }
    return user
  } else {
    await user.incrementLoginAttempts()
    return null
  }
}

// Create and export the model
const User = mongoose.model<IUser, IUserModel>('User', UserSchema)
export default User
