import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class PurgeUsers extends BaseCommand {
  static commandName = 'purge:users'
  static description = ''

  static options: CommandOptions = {}

  async run() {
    console.info(`Purging users older than 1`)
  }
}
