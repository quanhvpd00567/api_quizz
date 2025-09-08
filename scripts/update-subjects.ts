#!/usr/bin/env node

/**
 * Script to update subjects schema and seed data
 * Usage: npm run update-subjects
 */

import mongoose from 'mongoose'
import SubjectSeeder from '../database/seeders/SubjectSeeder.js'
import { up } from '../database/migrations/002_update_subject_classes.js'

async function updateSubjects() {
  try {
    console.log('🚀 Starting subjects update process...')
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/learning_management'
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB')

    // Run migration
    console.log('\n📦 Running migration...')
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }
    await up(db)

    // Run seeder
    console.log('\n🌱 Running seeder...')
    await SubjectSeeder.run()

    console.log('\n🎉 Subjects update completed successfully!')
    
  } catch (error) {
    console.error('❌ Error updating subjects:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
  }
}

// Run the update if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateSubjects()
}

export default updateSubjects
