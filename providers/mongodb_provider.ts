import type { ApplicationService } from '@adonisjs/core/types'
import MongodbService from '#config/mongodb'

export default class MongodbProvider {
  constructor(protected app: ApplicationService) {}

  async ready() {
    // Connect to MongoDB when the application is ready
    await MongodbService.connect()
  }

  async shutdown() {
    // Disconnect from MongoDB when shutting down
    await MongodbService.disconnect()
  }
}
