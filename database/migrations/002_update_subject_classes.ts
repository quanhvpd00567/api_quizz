/**
 * Migration: Update Subject schema to use classes array instead of single class
 * Date: 2025-08-19
 * 
 * This migration:
 * 1. Updates existing subjects to use 'classes' array instead of 'class' field
 * 2. Converts single class values to array format
 * 3. Sets default ['all'] for subjects without class specification
 */

import { Db } from 'mongodb'

export async function up(db: Db): Promise<void> {
  console.log('Running migration: Update Subject classes field...')

  try {
    const subjectsCollection = db.collection('subjects')
    
    // Get all subjects that have the old 'class' field
    const subjectsWithOldClass = await subjectsCollection.find({ 
      class: { $exists: true } 
    }).toArray()

    console.log(`Found ${subjectsWithOldClass.length} subjects with old class field`)

    // Update each subject
    for (const subject of subjectsWithOldClass) {
      const updateData: any = {}
      
      if (subject.class) {
        // Convert single class to array
        updateData.classes = [subject.class]
      } else {
        // Set default to all classes
        updateData.classes = ['all']
      }
      
      // Remove the old class field
      await subjectsCollection.updateOne(
        { _id: subject._id },
        { 
          $set: updateData,
          $unset: { class: "" }
        }
      )
    }

    // Update subjects that don't have any class field
    const subjectsWithoutClass = await subjectsCollection.find({ 
      class: { $exists: false },
      classes: { $exists: false }
    }).toArray()

    console.log(`Found ${subjectsWithoutClass.length} subjects without class field`)

    for (const subject of subjectsWithoutClass) {
      await subjectsCollection.updateOne(
        { _id: subject._id },
        { 
          $set: { classes: ['all'] }
        }
      )
    }

    // Create index for classes field
    await subjectsCollection.createIndex({ 'classes': 1, 'isActive': 1 })

    console.log('Migration completed successfully!')
    
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

export async function down(db: Db): Promise<void> {
  console.log('Running rollback: Revert Subject classes field...')

  try {
    const subjectsCollection = db.collection('subjects')
    
    // Get all subjects with classes array
    const subjectsWithClasses = await subjectsCollection.find({ 
      classes: { $exists: true } 
    }).toArray()

    console.log(`Found ${subjectsWithClasses.length} subjects with classes array`)

    // Convert back to single class field
    for (const subject of subjectsWithClasses) {
      const updateData: any = {}
      
      if (subject.classes && subject.classes.length > 0 && subject.classes[0] !== 'all') {
        // Use the first class from the array
        updateData.class = subject.classes[0]
      }
      
      await subjectsCollection.updateOne(
        { _id: subject._id },
        { 
          $set: updateData,
          $unset: { classes: "" }
        }
      )
    }

    // Drop the classes index
    try {
      await subjectsCollection.dropIndex('classes_1_isActive_1')
    } catch (error) {
      console.log('Index may not exist, continuing...')
    }

    console.log('Rollback completed successfully!')
    
  } catch (error) {
    console.error('Rollback failed:', error)
    throw error
  }
}
