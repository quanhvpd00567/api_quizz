import { Job } from '@rlanz/bull-queue'
import SendTelegramService from '#domains/Shared/Services/SendTelegramService'

export default class JobPushNotificationMakeQuizSuccess extends Job {
  static get $$filepath() {
    return import.meta.url
  }

  public async handle(payload: { message: string; telegramChatId: string }) {
    await SendTelegramService.handle(payload.telegramChatId, payload.message)
  }

  public async rescue(error: Error) {
    // save log
    console.error('Error in JobPushNotificationMakeQuizSuccess:', error)
  }
}
