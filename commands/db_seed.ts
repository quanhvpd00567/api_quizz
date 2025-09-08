import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import MongodbService from '#config/mongodb'
import DatabaseSeeder from '#database/seeders/DatabaseSeeder'

export default class DbSeed extends BaseCommand {
  static commandName = 'db:seed'
  static description = 'Seed the database with initial data'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  async run(): Promise<void> {
    this.logger.info('Starting database seeding...')

    try {
      // Ensure MongoDB connection
      if (!MongodbService.isConnected()) {
        this.logger.info('Connecting to MongoDB...')
        await MongodbService.connect()
      }

      // Run the seeder
      await DatabaseSeeder.run()

      this.logger.success('Database seeded successfully!')
    } catch (error) {
      this.logger.error('Database seeding failed:')
      this.logger.error(error instanceof Error ? error.message : String(error))
      this.exitCode = 1
    }
  }
}
