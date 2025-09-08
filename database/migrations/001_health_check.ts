import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_health'

  async up() {
    // This is a placeholder schema for health check
    // Real database schemas will be created in Phase 2
  }

  async down() {
    // Placeholder for rollback
  }
}
