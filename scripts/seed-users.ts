import User from '#domains/Auth/Models/User'
import bcrypt from 'bcryptjs'
import { setupDatabase } from '#config/database'

/**
 * Seed initial users for testing
 */
async function seedUsers() {
  try {
    // Connect to database
    await setupDatabase()
    
    console.log('🌱 Seeding users...')

    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: 'admin@learningms.com' })
    
    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash('admin123', 12)
      
      const admin = new User({
        email: 'admin@learningms.com',
        username: 'admin',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'administrator',
        isActive: true,
        isEmailVerified: true,
        bio: 'System Administrator',
      })
      
      await admin.save()
      console.log('✅ Admin user created')
    } else {
      console.log('ℹ️ Admin user already exists')
    }

    // Create sample parent user
    const existingParent = await User.findOne({ email: 'parent@learningms.com' })
    
    if (!existingParent) {
      const parentPassword = await bcrypt.hash('parent123', 12)
      
      const parent = new User({
        email: 'parent@learningms.com',
        username: 'parent_user',
        password: parentPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'parent',
        isActive: true,
        isEmailVerified: true,
        bio: 'Parent of student',
      })
      
      await parent.save()
      console.log('✅ Parent user created')
    } else {
      console.log('ℹ️ Parent user already exists')
    }

    // Create sample student user
    const existingStudent = await User.findOne({ email: 'student@learningms.com' })
    
    if (!existingStudent) {
      const studentPassword = await bcrypt.hash('student123', 12)
      
      const student = new User({
        email: 'student@learningms.com',
        username: 'student_user',
        password: studentPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'student',
        isActive: true,
        isEmailVerified: false,
        bio: 'Learning student',
      })
      
      await student.save()
      console.log('✅ Student user created')
    } else {
      console.log('ℹ️ Student user already exists')
    }

    // Create inactive user
    const existingInactive = await User.findOne({ email: 'inactive@learningms.com' })
    
    if (!existingInactive) {
      const inactivePassword = await bcrypt.hash('inactive123', 12)
      
      const inactive = new User({
        email: 'inactive@learningms.com',
        username: 'inactive_user',
        password: inactivePassword,
        firstName: 'Inactive',
        lastName: 'User',
        role: 'student',
        isActive: false,
        isEmailVerified: false,
        bio: 'Deactivated user',
      })
      
      await inactive.save()
      console.log('✅ Inactive user created')
    } else {
      console.log('ℹ️ Inactive user already exists')
    }

    const userCount = await User.countDocuments()
    console.log(`📊 Total users in database: ${userCount}`)

    console.log('\n🎯 Test credentials:')
    console.log('👤 Admin: admin@learningms.com / admin123')
    console.log('👥 Parent: parent@learningms.com / parent123')
    console.log('🎓 Student: student@learningms.com / student123')
    console.log('❌ Inactive: inactive@learningms.com / inactive123')

    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers()
}

export { seedUsers }
