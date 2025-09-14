import bcrypt from 'bcryptjs'
import User, { UserRole } from '#domains/Auth/Models/User'
import Category from '#domains/Content/Categories/Models/Category'

export default class DatabaseSeeder {
  public static async run(): Promise<void> {
    console.log('🌱 Starting database seeding...')

    try {
      // Clear existing data (be careful in production!)
      await this.clearData()

      const users = await this.seedUsers()
      console.log('✅ Database seeding completed successfully!')
      console.log(`📊 Created: ${users.length} users`)
    } catch (error) {
      console.error('❌ Database seeding failed:', error)
      throw error
    }
  }

  private static async clearData(): Promise<void> {
    console.log('🧹 Clearing existing data...')
    await Promise.all([User.deleteMany({}), Category.deleteMany({})])
  }

  private static async seedUsers(): Promise<any[]> {
    console.log('👤 Seeding users...')

    // Hash passwords before creating users
    const adminPassword = await bcrypt.hash('Admin123!@#', 12)
    const parentPassword = await bcrypt.hash('Parent123!', 12)
    const studentPassword = await bcrypt.hash('Student123!', 12)

    const userData = [
      {
        email: 'admin@learningms.com',
        username: 'admin',
        password: adminPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: UserRole.ADMINISTRATOR,
        isActive: true,
        isEmailVerified: true,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          theme: 'light',
        },
        metadata: {
          source: 'api',
        },
      },
      {
        email: 'parent@learningms.com',
        username: 'parent',
        password: parentPassword,
        firstName: 'John',
        lastName: 'Parent',
        bio: 'Parent monitoring child progress in the learning management system.',
        role: UserRole.PARENT,
        isActive: true,
        isEmailVerified: true,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          theme: 'light',
        },
        metadata: {
          source: 'api',
        },
      },
      {
        email: 'student@learningms.com',
        username: 'student',
        password: studentPassword,
        firstName: 'Jane',
        lastName: 'Student',
        bio: 'Enthusiastic learner passionate about technology and programming.',
        role: UserRole.STUDENT,
        isActive: true,
        isEmailVerified: true,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          emailNotifications: true,
          theme: 'light',
        },
        metadata: {
          source: 'api',
        },
      },
    ]

    const users = await User.insertMany(userData)
    return users
  }
}
