const mongoose = require('mongoose')

// Direct schema test
const UserRole = {
  ADMINISTRATOR: 'administrator',
  PARENT: 'parent',
  STUDENT: 'student',
}

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
      required: true,
    },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    preferences: {
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'UTC' },
      emailNotifications: { type: Boolean, default: true },
      theme: { type: String, default: 'light' },
    },
    metadata: {
      source: { type: String, default: 'api' },
    },
  },
  { timestamps: true }
)

const User = mongoose.model('TestUser', UserSchema)

mongoose
  .connect('mongodb://127.0.0.1:27017/learning_management_db')
  .then(async () => {
    console.log('🔗 Connected to MongoDB')

    // Clear test users
    await User.deleteMany({})

    // Create test user
    const testUser = new User({
      email: 'test@example.com',
      username: 'testuser',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.ADMINISTRATOR,
    })

    const savedUser = await testUser.save()
    console.log('✅ Test user created:', savedUser.email, 'with role:', savedUser.role)

    mongoose.disconnect()
  })
  .catch((err) => {
    console.error('❌ Error:', err)
    mongoose.disconnect()
  })
