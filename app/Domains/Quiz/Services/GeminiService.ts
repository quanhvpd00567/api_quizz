import { OpenAI } from 'openai'

const openai = new OpenAI({
  // baseURL: 'https://api.deepseek.com',
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: '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',
})

// const deepseek = new DeepSeek('00c5b6087d204513a8194aade138bc8f')

export default class GeminiService {
  public static async generateFeedback(score: number, total: number): Promise<string> {
    try {
      const prompt = `Với kết quả là ${score}/${total} điểm, hãy đưa ra nhận xét ngắn gọn về bài làm của học sinh.`
      const chatCompletion = await openai.chat.completions.create({
        model: 'openai/gpt-4o', // Hoặc "gpt-4" nếu bạn có quyền truy cập
        messages: [
          // { role: 'system', content: 'Bạn là trợ lý Thầy giáo hữu ích.' },
          { role: 'user', content: prompt },
        ],
      })
      return chatCompletion.choices[0].message.content ?? 'Không có nội dung phản hồi.'
    } catch (error) {
      console.error('Error generating feedback:', error)
      return 'Không thể tạo nhận xét vào lúc này.'
    }
  }
}
