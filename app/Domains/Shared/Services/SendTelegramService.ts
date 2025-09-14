export default class SendTelegramService {
  public static async handle(chatId: string, message: string) {
    const telegramBot = '8249689015:AAHkSZV2stL43W76G9CTTL3oJoJZwxH4bX4'
    const url = `https://api.telegram.org/bot${telegramBot}/sendMessage`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })
    await res.json()
  }
}
