import User from '#domains/Auth/Models/User'
import bcrypt from 'bcryptjs'
import { setupDatabase } from '#config/database'

async function checkAdminUser() {
  try {
    // Connect to database
    await setupDatabase()
    
    console.log('🔍 Checking admin users...')
    
    const users = await User.find({ email: { $in: ['admin@learningms.com', 'admin@example.com'] } }).select('+password')
    
    console.log('Found users:', users.map(u => ({
      email: u.email,
      role: u.role,
      hasPassword: !!u.password,
      passwordLength: u.password?.length || 0,
    })))
    
    // Try to create admin user if not exists
    let adminUser = await User.findOne({ email: 'admin@learningms.com' })
    
    if (!adminUser) {
      console.log('Creating admin user...')
      const hashedPassword = await bcrypt.hash('admin123', 12)
      
      adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@learningms.com',
        password: hashedPassword,
        role: 'administrator',
        isActive: true,
        isEmailVerified: true,
      })
      
      await adminUser.save()
      console.log('✅ Admin user created successfully')
    } else {
      // Update password if needed
      console.log('Admin user exists, updating password...')
      const hashedPassword = await bcrypt.hash('admin123', 12)
      adminUser.password = hashedPassword
      await adminUser.save()
      console.log('✅ Admin password updated')
    }
    
    // Test password
    const testPassword = await adminUser.comparePassword('admin123')
    console.log('Password test result:', testPassword)
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkAdminUser()
