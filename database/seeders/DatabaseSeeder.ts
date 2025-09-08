import bcrypt from 'bcryptjs'
import User, { UserRole } from '#domains/Auth/Models/User'
import Category from '#domains/Content/Categories/Models/Category'
import QuestionSeeder from './QuestionSeeder.js'
import Question from '#domains/Question/Models/Question'

export default class DatabaseSeeder {
  public static async run(): Promise<void> {
    console.log('🌱 Starting database seeding...')

    try {
      // Clear existing data (be careful in production!)
      await this.clearData()

      // Seed data
      // const users = await this.seedUsers()
      // const categories = await this.seedCategories()
      const questions = await new QuestionSeeder().run()

      console.log('✅ Database seeding completed successfully!')
      // console.log(`📊 Created: ${users.length} users, ${categories.length} categories, ${questions.length} questions`)
      console.log(`📊 Created: ${questions.length} questions`)
    } catch (error) {
      console.error('❌ Database seeding failed:', error)
      throw error
    }
  }

  private static async clearData(): Promise<void> {
    console.log('🧹 Clearing existing data...')

    // await Promise.all([User.deleteMany({}), Category.deleteMany({})])
    // await Promise.all([ Question.deleteMany({})])
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

  private static async seedCategories(): Promise<any[]> {
    console.log('📁 Seeding categories...')

    const categoryData = [
      {
        name: 'Programming',
        slug: 'programming',
        description: 'Learn various programming languages and concepts',
        color: '#3B82F6',
        isActive: true,
        sortOrder: 1,
        seo: {
          metaTitle: 'Programming Courses - Learn to Code',
          metaDescription: 'Master programming languages like JavaScript, Python, Java, and more.',
        },
      },
      {
        name: 'Web Development',
        slug: 'web-development',
        description: 'Frontend and backend web development tutorials',
        color: '#10B981',
        isActive: true,
        sortOrder: 2,
        seo: {
          metaTitle: 'Web Development Tutorials',
          metaDescription:
            'Learn modern web development with HTML, CSS, JavaScript, and frameworks.',
        },
      },
      {
        name: 'Data Science',
        slug: 'data-science',
        description: 'Data analysis, machine learning, and statistics',
        color: '#8B5CF6',
        isActive: true,
        sortOrder: 3,
        seo: {
          metaTitle: 'Data Science Courses',
          metaDescription: 'Learn data science, machine learning, and statistical analysis.',
        },
      },
      {
        name: 'Mobile Development',
        slug: 'mobile-development',
        description: 'iOS and Android app development',
        color: '#F59E0B',
        isActive: true,
        sortOrder: 4,
        seo: {
          metaTitle: 'Mobile App Development',
          metaDescription: 'Create mobile apps for iOS and Android platforms.',
        },
      },
      {
        name: 'DevOps',
        slug: 'devops',
        description: 'Development operations and deployment strategies',
        color: '#EF4444',
        isActive: true,
        sortOrder: 5,
        seo: {
          metaTitle: 'DevOps and Deployment',
          metaDescription: 'Learn DevOps practices, CI/CD, and cloud deployment.',
        },
      },
    ]

    const categories = await Category.insertMany(categoryData)

    // Create some subcategories
    const webDevCategory = categories.find((cat) => cat.slug === 'web-development')
    const programmingCategory = categories.find((cat) => cat.slug === 'programming')

    const subcategoryData = [
      {
        name: 'Frontend',
        slug: 'frontend',
        description: 'Client-side web development',
        parent: webDevCategory?._id,
        color: '#06B6D4',
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'Backend',
        slug: 'backend',
        description: 'Server-side web development',
        parent: webDevCategory?._id,
        color: '#84CC16',
        isActive: true,
        sortOrder: 2,
      },
      {
        name: 'JavaScript',
        slug: 'javascript',
        description: 'JavaScript programming language',
        parent: programmingCategory?._id,
        color: '#F59E0B',
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'Python',
        slug: 'python',
        description: 'Python programming language',
        parent: programmingCategory?._id,
        color: '#3B82F6',
        isActive: true,
        sortOrder: 2,
      },
    ]

    const subcategories = await Category.insertMany(subcategoryData)

    return [...categories, ...subcategories]
  }
}
