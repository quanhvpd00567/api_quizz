const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/learning_management_db')
  .then(async () => {
    console.log('🔍 Checking users with new role system...');
    
    // Simple query to check users
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    
    console.log('\n👥 Users in database:');
    users.forEach(user => {
      console.log(`📧 ${user.email} - Role: ${user.role} - Name: ${user.firstName} ${user.lastName}`);
    });
    
    console.log(`\n✅ Total users: ${users.length}`);
    
    // Check if passwords are hashed
    const firstUser = users[0];
    if (firstUser) {
      console.log(`\n🔒 Password is hashed: ${firstUser.password.startsWith('$2b$') || firstUser.password.startsWith('$2a$')}`);
    }
    
    mongoose.disconnect();
  })
  .catch(console.error);
