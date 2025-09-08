import mongoose from 'mongoose'
import env from '#start/env'

export default class MongodbService {
  public static async connect(): Promise<void> {
    try {
      const mongoUri = env.get('MONGODB_URI', 'mongodb://localhost:27017/learning_management')

      await mongoose.connect(mongoUri, {
        dbName: env.get('MONGODB_DB_NAME', 'learning_management'),
      })

      console.log('✅ MongoDB connected successfully')
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error)
      process.exit(1)
    }
  }

  public static async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect()
      console.log('📴 MongoDB disconnected')
    } catch (error) {
      console.error('❌ MongoDB disconnection failed:', error)
    }
  }

  public static getConnection() {
    return mongoose.connection
  }

  public static isConnected(): boolean {
    return mongoose.connection.readyState === 1
  }
}
